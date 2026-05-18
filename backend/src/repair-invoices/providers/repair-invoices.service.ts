import { toCsvBuffer } from '@/common/helpers/csv.helper';
import { handleError } from '@/common/error-handlers/error.handler';
import { generateInvoiceNumber } from '@/common/helpers/invoice-number.helper';
import { applySearch } from '@/common/helpers/search-clause.helper';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { Item } from '@/items/entities/item.entity';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { CreateRepairInvoiceDto } from '../dtos/create-repair-invoice.dto';
import { RepairInvoiceQueryDto } from '../dtos/repair-invoice-query.dto';
import { UpdateRepairInvoiceDto } from '../dtos/update-repair-invoice.dto';
import { RepairInvoiceItem } from '../entities/repair-invoice-item.entity';
import { RepairInvoice } from '../entities/repair-invoice.entity';

@Injectable()
export class RepairInvoicesService {
  constructor(
    @InjectRepository(RepairInvoice)
    private readonly invoiceRepository: Repository<RepairInvoice>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: RepairInvoiceQueryDto) {
    try {
      const limit = query.limit || 10;
      const page = query.page || 1;
      const skip = (page - 1) * limit;

      const qb = this.invoiceRepository
        .createQueryBuilder('ri')
        .leftJoinAndSelect('ri.customer', 'customer')
        .leftJoinAndSelect('ri.createdBy', 'createdBy')
        .orderBy('ri.date', 'DESC')
        .addOrderBy('ri.id', 'DESC');

      applySearch(qb, query.search, {
        text: ['ri.invoiceNumber', 'customer.name', 'ri.description'],
        numeric: ['ri.totalAmount'],
        date: ['ri.date'],
      });

      if (query.customerId) {
        qb.andWhere('ri.customerId = :customerId', { customerId: query.customerId });
      }

      if (query.fromDate) {
        qb.andWhere('ri.date >= :fromDate', { fromDate: query.fromDate });
      }

      if (query.toDate) {
        qb.andWhere('ri.date <= :toDate', { toDate: query.toDate });
      }

      if (query.isCharged !== undefined) {
        qb.andWhere('ri.isCharged = :isCharged', { isCharged: query.isCharged });
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
      const invoice = await this.invoiceRepository.findOne({
        where: { id },
        relations: ['customer', 'createdBy', 'items', 'items.item'],
      });

      if (!invoice) {
        throw new NotFoundException(`Repair invoice #${id} not found`);
      }

      return invoice;
    } catch (error) {
      handleError(error);
    }
  }

  async create(dto: CreateRepairInvoiceDto, activeUser: ActiveUserData) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoiceNumber = await generateInvoiceNumber('RI', this.invoiceRepository);

      const laborCost = dto.isCharged ? (dto.laborCost ?? 0) : 0;

      let partsTotal = 0;

      const invoice = queryRunner.manager.create(RepairInvoice, {
        invoiceNumber,
        customerId: dto.customerId,
        serialNumber: dto.serialNumber ?? null,
        description: dto.description,
        date: dto.date,
        laborCost,
        isCharged: dto.isCharged,
        totalAmount: 0,
        createdById: activeUser.id,
      });

      const savedInvoice = await queryRunner.manager.save(RepairInvoice, invoice);

      for (const lineDto of dto.items) {
        const item = await queryRunner.manager.findOne(Item, { where: { id: lineDto.itemId } });
        if (!item) throw new NotFoundException(`Item #${lineDto.itemId} not found`);
        const unitPrice = lineDto.unitPrice ?? Number(item.averagePrice);

        if (lineDto.isReal) {
          if (Number(item.totalQuantity) < lineDto.quantity) {
            throw new BadRequestException(
              `Insufficient stock for "${item.name}": available ${item.totalQuantity}, requested ${lineDto.quantity}`,
            );
          }
          await queryRunner.manager.update(Item, { id: item.id }, {
            totalQuantity: Number(item.totalQuantity) - lineDto.quantity,
          });
        }

        partsTotal += lineDto.quantity * unitPrice;

        const lineItem = queryRunner.manager.create(RepairInvoiceItem, {
          invoiceId: savedInvoice.id,
          itemId: item.id,
          customItemName: null,
          quantity: lineDto.quantity,
          unitPrice,
          isReal: lineDto.isReal,
        });

        await queryRunner.manager.save(RepairInvoiceItem, lineItem);
      }

      const totalAmount = partsTotal + laborCost;

      await queryRunner.manager.update(RepairInvoice, { id: savedInvoice.id }, { totalAmount });

      await queryRunner.commitTransaction();

      return { ...savedInvoice, totalAmount };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, dto: UpdateRepairInvoiceDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoice = await queryRunner.manager.findOne(RepairInvoice, {
        where: { id },
        relations: ['items'],
      });

      if (!invoice) {
        throw new NotFoundException(`Repair invoice #${id} not found`);
      }

      // Reverse old stock changes (only isReal stock items had stock deducted)
      for (const oldLine of invoice.items) {
        if (oldLine.isReal && oldLine.itemId) {
          const item = await queryRunner.manager.findOne(Item, { where: { id: oldLine.itemId } });
          if (item) {
            await queryRunner.manager.update(Item, { id: oldLine.itemId }, {
              totalQuantity: Number(item.totalQuantity) + Number(oldLine.quantity),
            });
          }
        }
      }

      // Delete old line items
      await queryRunner.manager.delete(RepairInvoiceItem, { invoiceId: id });

      // Apply new line items
      const laborCost = dto.isCharged ? (dto.laborCost ?? 0) : 0;
      let partsTotal = 0;

      for (const lineDto of dto.items) {
        const item = await queryRunner.manager.findOne(Item, { where: { id: lineDto.itemId } });
        if (!item) throw new NotFoundException(`Item #${lineDto.itemId} not found`);
        const unitPrice = lineDto.unitPrice ?? Number(item.averagePrice);

        if (lineDto.isReal) {
          if (Number(item.totalQuantity) < lineDto.quantity) {
            throw new BadRequestException(
              `Insufficient stock for "${item.name}": available ${item.totalQuantity}, requested ${lineDto.quantity}`,
            );
          }
          await queryRunner.manager.update(Item, { id: item.id }, {
            totalQuantity: Number(item.totalQuantity) - lineDto.quantity,
          });
        }

        partsTotal += lineDto.quantity * unitPrice;

        const lineItem = queryRunner.manager.create(RepairInvoiceItem, {
          invoiceId: id,
          itemId: item.id,
          customItemName: null,
          quantity: lineDto.quantity,
          unitPrice,
          isReal: lineDto.isReal,
        });

        await queryRunner.manager.save(RepairInvoiceItem, lineItem);
      }

      const totalAmount = partsTotal + laborCost;

      await queryRunner.manager.update(RepairInvoice, { id }, {
        customerId: dto.customerId,
        serialNumber: dto.serialNumber ?? null,
        description: dto.description,
        date: dto.date,
        laborCost,
        isCharged: dto.isCharged,
        totalAmount,
      });

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.invoiceRepository.findOne({
        where: { id },
        relations: ['customer', 'createdBy', 'items', 'items.item'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      handleError(error);
      throw error;
    }
  }

  async getTotalRepairAmount(): Promise<number> {
    try {
      const result = await this.invoiceRepository
        .createQueryBuilder('ri')
        .where('ri.isCharged = true')
        .andWhere('ri.deletedAt IS NULL')
        .select('COALESCE(SUM(CAST(ri.totalAmount AS numeric)), 0)', 'total')
        .getRawOne<{ total: string }>();

      return Number(result?.total ?? 0);
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  async getTotalRepairAmountForCustomer(customerId: number): Promise<number> {
    try {
      const result = await this.invoiceRepository
        .createQueryBuilder('ri')
        .where('ri.customerId = :customerId', { customerId })
        .andWhere('ri.isCharged = true')
        .andWhere('ri.deletedAt IS NULL')
        .select('COALESCE(SUM(CAST(ri.totalAmount AS numeric)), 0)', 'total')
        .getRawOne<{ total: string }>();

      return Number(result?.total ?? 0);
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  async exportCsv(): Promise<string> {
    try {
      const invoices = await this.invoiceRepository.find({
        relations: ['customer', 'createdBy'],
        order: { date: 'DESC' },
      });

      return toCsvBuffer(
        ['Invoice #', 'Date', 'Customer', 'Type', 'Labor Cost', 'Total Amount', 'Description'],
        invoices.map((inv) => ({
          'Invoice #': inv.invoiceNumber,
          'Date': inv.date,
          'Customer': inv.customer?.name ?? '',
          'Type': inv.isCharged ? 'Charged' : 'FOC',
          'Labor Cost': Number(inv.laborCost ?? 0),
          'Total Amount': Number(inv.totalAmount),
          'Description': inv.description ?? '',
        })),
      );
    } catch (error) {
      handleError(error);
      throw error;
    }
  }
}
