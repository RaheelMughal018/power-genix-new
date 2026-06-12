import { toCsvBuffer } from '@/common/helpers/csv.helper';
import { handleError } from '@/common/error-handlers/error.handler';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { Account } from '@/accounts/entities/account.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Asset } from '../entities/asset.entity';
import { CreateAssetDto } from '../dtos/create-asset.dto';
import { UpdateAssetDto } from '../dtos/update-asset.dto';
import { AssetQueryDto } from '../dtos/asset-query.dto';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly repo: Repository<Asset>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: AssetQueryDto) {
    try {
      const limit = query.limit || 10;
      const page = query.page || 1;
      const skip = (page - 1) * limit;

      const qb = this.repo
        .createQueryBuilder('asset')
        .leftJoinAndSelect('asset.account', 'account')
        .leftJoinAndSelect('asset.createdBy', 'createdBy')
        .orderBy('asset.purchaseDate', 'DESC')
        .addOrderBy('asset.id', 'DESC');

      if (query.accountId) {
        qb.andWhere('asset.accountId = :accountId', { accountId: query.accountId });
      }

      if (query.fromDate) {
        qb.andWhere('asset.purchaseDate >= :fromDate', { fromDate: query.fromDate });
      }

      if (query.toDate) {
        qb.andWhere('asset.purchaseDate <= :toDate', { toDate: query.toDate });
      }

      if (query.search) {
        qb.andWhere(
          '(asset.name ILIKE :search OR asset.type ILIKE :search)',
          { search: `%${query.search}%` },
        );
      }

      const [data, totalItems] = await qb.skip(skip).take(limit).getManyAndCount();

      return {
        data,
        meta: {
          itemsPerPage: limit,
          totalItems,
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
        },
      };
    } catch (error) {
      handleError(error);
    }
  }

  async findOne(id: number) {
    try {
      const asset = await this.repo.findOne({
        where: { id },
        relations: ['account', 'createdBy'],
      });

      if (!asset) {
        throw new NotFoundException(`Asset #${id} not found`);
      }

      return asset;
    } catch (error) {
      handleError(error);
    }
  }

  async create(dto: CreateAssetDto, activeUser: ActiveUserData) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const account = await queryRunner.manager.findOne(Account, { where: { id: dto.accountId } });

      if (!account) {
        throw new NotFoundException(`Account #${dto.accountId} not found`);
      }

      const asset = queryRunner.manager.create(Asset, {
        name: dto.name,
        type: dto.type,
        amount: dto.amount,
        purchaseDate: dto.purchaseDate,
        accountId: dto.accountId,
        notes: dto.notes ?? null,
        createdById: activeUser.id,
      });

      const saved = await queryRunner.manager.save(Asset, asset);

      await queryRunner.manager.update(Account, { id: dto.accountId }, {
        currentBalance: Number(account.currentBalance) - Number(dto.amount),
      });

      await queryRunner.commitTransaction();

      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, dto: UpdateAssetDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const asset = await queryRunner.manager.findOne(Asset, { where: { id } });

      if (!asset) {
        throw new NotFoundException(`Asset #${id} not found`);
      }

      const oldAmount = Number(asset.amount);
      const oldAccountId = asset.accountId;
      const newAmount = dto.amount !== undefined ? Number(dto.amount) : oldAmount;
      const newAccountId = dto.accountId !== undefined ? dto.accountId : oldAccountId;

      const oldAccount = await queryRunner.manager.findOne(Account, { where: { id: oldAccountId } });
      if (!oldAccount) {
        throw new NotFoundException(`Account #${oldAccountId} not found`);
      }

      await queryRunner.manager.update(Account, { id: oldAccountId }, {
        currentBalance: Number(oldAccount.currentBalance) + oldAmount,
      });

      const newAccount = await queryRunner.manager.findOne(Account, { where: { id: newAccountId } });
      if (!newAccount) {
        throw new NotFoundException(`Account #${newAccountId} not found`);
      }

      const balanceAfterReverse = newAccountId === oldAccountId
        ? Number(oldAccount.currentBalance) + oldAmount
        : Number(newAccount.currentBalance);

      await queryRunner.manager.update(Account, { id: newAccountId }, {
        currentBalance: balanceAfterReverse - newAmount,
      });

      Object.assign(asset, {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.purchaseDate !== undefined && { purchaseDate: dto.purchaseDate }),
        ...(dto.accountId !== undefined && { accountId: dto.accountId }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      });

      const updated = await queryRunner.manager.save(Asset, asset);

      await queryRunner.commitTransaction();

      return updated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const asset = await queryRunner.manager.findOne(Asset, { where: { id } });

      if (!asset) {
        throw new NotFoundException(`Asset #${id} not found`);
      }

      const account = await queryRunner.manager.findOne(Account, { where: { id: asset.accountId } });

      if (account) {
        await queryRunner.manager.update(Account, { id: asset.accountId }, {
          currentBalance: Number(account.currentBalance) + Number(asset.amount),
        });
      }

      await queryRunner.manager.softDelete(Asset, id);

      await queryRunner.commitTransaction();

      return { message: 'Asset deleted successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getTotalAssetAmount(query: AssetQueryDto = {} as AssetQueryDto) {
    try {
      const qb = this.repo
        .createQueryBuilder('asset')
        .where('asset.deletedAt IS NULL')
        .select('COALESCE(SUM(CAST(asset.amount AS numeric)), 0)', 'total');

      if (query.accountId) {
        qb.andWhere('asset.accountId = :accountId', { accountId: query.accountId });
      }

      if (query.fromDate) {
        qb.andWhere('asset.purchaseDate >= :fromDate', { fromDate: query.fromDate });
      }

      if (query.toDate) {
        qb.andWhere('asset.purchaseDate <= :toDate', { toDate: query.toDate });
      }

      if (query.search) {
        qb.andWhere(
          '(asset.name ILIKE :search OR asset.type ILIKE :search)',
          { search: `%${query.search}%` },
        );
      }

      const result = await qb.getRawOne<{ total: string }>();

      return { total: Number(result?.total ?? 0) };
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  async exportCsv() {
    try {
      const assets = await this.repo.find({
        relations: ['account'],
        order: { purchaseDate: 'DESC' },
      });

      return toCsvBuffer(
        ['Name', 'Type', 'Amount', 'Purchase Date', 'Account', 'Notes'],
        assets.map((a) => ({
          'Name': a.name,
          'Type': a.type,
          'Amount': a.amount,
          'Purchase Date': a.purchaseDate,
          'Account': a.account?.name ?? '',
          'Notes': a.notes ?? '',
        })),
      );
    } catch (error) {
      handleError(error);
      throw error;
    }
  }
}
