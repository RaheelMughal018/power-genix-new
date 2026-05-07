import { toCsvBuffer } from '@/common/helpers/csv.helper';
import { handleError } from '@/common/error-handlers/error.handler';
import { generateInvoiceNumber } from '@/common/helpers/invoice-number.helper';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { Item } from '@/items/entities/item.entity';
import { ProductionUnit } from '@/production/entities/production-unit.entity';
import { SoldInverter } from '@/sold-inverters/entities/sold-inverter.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateSaleInvoiceDto } from '../dtos/create-sale-invoice.dto';
import { SaleInvoiceQueryDto } from '../dtos/sale-invoice-query.dto';
import { UpdateSaleInvoiceDto } from '../dtos/update-sale-invoice.dto';
import { SaleInvoiceItem } from '../entities/sale-invoice-item.entity';
import { SaleInvoice } from '../entities/sale-invoice.entity';

@Injectable()
export class SaleInvoicesService {
  constructor(
    @InjectRepository(SaleInvoice)
    private readonly invoiceRepository: Repository<SaleInvoice>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: SaleInvoiceQueryDto) {
    try {
      const limit = query.limit || 10;
      const page = query.page || 1;
      const skip = (page - 1) * limit;

      const qb = this.invoiceRepository
        .createQueryBuilder('si')
        .leftJoinAndSelect('si.customer', 'customer')
        .leftJoinAndSelect('si.createdBy', 'createdBy')
        .orderBy('si.date', 'DESC')
        .addOrderBy('si.id', 'DESC');

      if (query.search) {
        qb.andWhere(
          '(si.invoiceNumber ILIKE :search OR customer.name ILIKE :search OR si.notes ILIKE :search)',
          { search: `%${query.search}%` },
        );
      }

      if (query.customerId) {
        qb.andWhere('si.customerId = :customerId', { customerId: query.customerId });
      }

      if (query.fromDate) {
        qb.andWhere('si.date >= :fromDate', { fromDate: query.fromDate });
      }

      if (query.toDate) {
        qb.andWhere('si.date <= :toDate', { toDate: query.toDate });
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
        throw new NotFoundException(`Sale invoice #${id} not found`);
      }

      return invoice;
    } catch (error) {
      handleError(error);
    }
  }

  async create(dto: CreateSaleInvoiceDto, activeUser: ActiveUserData) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoiceNumber = await generateInvoiceNumber('SI', this.invoiceRepository);

      const lineTotal = dto.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
      const discount = dto.discount ?? 0;
      const totalAmount = lineTotal - discount;

      const invoice = queryRunner.manager.create(SaleInvoice, {
        invoiceNumber,
        customerId: dto.customerId,
        date: dto.date,
        discount,
        notes: dto.notes ?? null,
        totalAmount,
        createdById: activeUser.id,
      });

      const savedInvoice = await queryRunner.manager.save(SaleInvoice, invoice);

      for (const lineDto of dto.items) {
        const item = await queryRunner.manager.findOne(Item, { where: { id: lineDto.itemId } });

        if (!item) {
          throw new NotFoundException(`Item #${lineDto.itemId} not found`);
        }

        const currentQty = Number(item.totalQuantity);

        if (currentQty < lineDto.quantity) {
          throw new BadRequestException(
            `Insufficient stock for item "${item.name}": available ${currentQty}, requested ${lineDto.quantity}`,
          );
        }

        const lineItem = queryRunner.manager.create(SaleInvoiceItem, {
          invoiceId: savedInvoice.id,
          itemId: lineDto.itemId,
          quantity: lineDto.quantity,
          unitPrice: lineDto.unitPrice,
          totalPrice: lineDto.quantity * lineDto.unitPrice,
          serialNumber: lineDto.serialNumber ?? null,
        });

        await queryRunner.manager.save(SaleInvoiceItem, lineItem);

        await queryRunner.manager.update(Item, { id: lineDto.itemId }, {
          totalQuantity: currentQty - lineDto.quantity,
        });

        if (lineDto.serialNumber) {
          await this.createSoldInverterRecord(
            queryRunner.manager,
            lineDto.serialNumber,
            lineDto.itemId,
            dto.customerId,
            lineDto.unitPrice,
            dto.date,
            activeUser.id,
          );
        }
      }

      await queryRunner.commitTransaction();

      return savedInvoice;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, dto: UpdateSaleInvoiceDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoice = await queryRunner.manager.findOne(SaleInvoice, {
        where: { id },
        relations: ['items'],
      });

      if (!invoice) {
        throw new NotFoundException(`Sale invoice #${id} not found`);
      }

      // Reverse old stock changes
      for (const oldLine of invoice.items) {
        const item = await queryRunner.manager.findOne(Item, { where: { id: oldLine.itemId } });

        if (item) {
          await queryRunner.manager.update(Item, { id: oldLine.itemId }, {
            totalQuantity: Number(item.totalQuantity) + Number(oldLine.quantity),
          });
        }

        // Soft-delete SoldInverter records tied to this invoice's serial numbers
        if (oldLine.serialNumber) {
          await queryRunner.manager.softDelete(SoldInverter, {
            serialNumber: oldLine.serialNumber,
          });
        }
      }

      // Delete old line items
      await queryRunner.manager.delete(SaleInvoiceItem, { invoiceId: id });

      // Apply new line items
      const lineTotal = dto.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
      const discount = dto.discount ?? 0;
      const totalAmount = lineTotal - discount;

      for (const lineDto of dto.items) {
        const item = await queryRunner.manager.findOne(Item, { where: { id: lineDto.itemId } });

        if (!item) {
          throw new NotFoundException(`Item #${lineDto.itemId} not found`);
        }

        const currentQty = Number(item.totalQuantity);

        if (currentQty < lineDto.quantity) {
          throw new BadRequestException(
            `Insufficient stock for item "${item.name}": available ${currentQty}, requested ${lineDto.quantity}`,
          );
        }

        const lineItem = queryRunner.manager.create(SaleInvoiceItem, {
          invoiceId: id,
          itemId: lineDto.itemId,
          quantity: lineDto.quantity,
          unitPrice: lineDto.unitPrice,
          totalPrice: lineDto.quantity * lineDto.unitPrice,
          serialNumber: lineDto.serialNumber ?? null,
        });

        await queryRunner.manager.save(SaleInvoiceItem, lineItem);

        await queryRunner.manager.update(Item, { id: lineDto.itemId }, {
          totalQuantity: currentQty - lineDto.quantity,
        });

        if (lineDto.serialNumber) {
          await this.createSoldInverterRecord(
            queryRunner.manager,
            lineDto.serialNumber,
            lineDto.itemId,
            dto.customerId,
            lineDto.unitPrice,
            dto.date,
            invoice.createdById,
          );
        }
      }

      await queryRunner.manager.update(SaleInvoice, { id }, {
        customerId: dto.customerId,
        date: dto.date,
        discount,
        notes: dto.notes ?? null,
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

  async getAvailableSerials(itemId: number): Promise<Array<{ serialNumber: string; unitCost: number }>> {
    try {
      // Find all sold serial numbers for this item
      const soldSerials = await this.dataSource
        .getRepository(SoldInverter)
        .createQueryBuilder('si')
        .withDeleted()
        .where('si.itemId = :itemId', { itemId })
        .andWhere('si.deletedAt IS NULL')
        .select('si.serialNumber')
        .getRawMany<{ si_serialNumber: string }>();

      const soldSet = new Set(soldSerials.map((r) => r.si_serialNumber));

      // Find production units where the batch's recipe produces this item
      const units = await this.dataSource
        .getRepository(ProductionUnit)
        .createQueryBuilder('pu')
        .innerJoin('pu.batch', 'batch')
        .innerJoin('batch.recipe', 'recipe')
        .where('recipe.finalProductId = :itemId', { itemId })
        .andWhere('batch.status = :status', { status: 'completed' })
        .select(['pu.serialNumber', 'pu.unitCost'])
        .getRawMany<{ pu_serialNumber: string; pu_unitCost: string }>();

      return units
        .filter((u) => !soldSet.has(u.pu_serialNumber))
        .map((u) => ({ serialNumber: u.pu_serialNumber, unitCost: Number(u.pu_unitCost) }));
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  async getTotalSaleAmount(): Promise<number> {
    try {
      const result = await this.invoiceRepository
        .createQueryBuilder('si')
        .where('si.deletedAt IS NULL')
        .select('COALESCE(SUM(CAST(si.totalAmount AS numeric)), 0)', 'total')
        .getRawOne<{ total: string }>();

      return Number(result?.total ?? 0);
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  async getTotalSaleAmountForCustomer(customerId: number): Promise<number> {
    try {
      const result = await this.invoiceRepository
        .createQueryBuilder('si')
        .where('si.customerId = :customerId', { customerId })
        .andWhere('si.deletedAt IS NULL')
        .select('COALESCE(SUM(CAST(si.totalAmount AS numeric)), 0)', 'total')
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
        ['Invoice #', 'Date', 'Customer', 'Discount', 'Total Amount', 'Notes'],
        invoices.map((inv) => ({
          'Invoice #': inv.invoiceNumber,
          'Date': inv.date,
          'Customer': inv.customer?.name ?? '',
          'Discount': Number(inv.discount ?? 0),
          'Total Amount': Number(inv.totalAmount),
          'Notes': inv.notes ?? '',
        })),
      );
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  private async createSoldInverterRecord(
    manager: DataSource['manager'],
    serialNumber: string,
    itemId: number,
    customerId: number,
    saleCost: number,
    saleDate: string,
    createdById: number,
  ): Promise<void> {
    const productionUnit = await manager.findOne(ProductionUnit, {
      where: { serialNumber },
    });

    const productionCost = productionUnit ? Number(productionUnit.unitCost) : 0;
    const profit = saleCost - productionCost;

    const soldInverter = manager.create(SoldInverter, {
      serialNumber,
      itemId,
      customerId,
      productionCost,
      saleCost,
      profit,
      saleDate,
      createdById,
    });

    await manager.save(SoldInverter, soldInverter);
  }
}
