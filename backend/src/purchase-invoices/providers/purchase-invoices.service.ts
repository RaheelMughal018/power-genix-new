import { toCsvBuffer } from '@/common/helpers/csv.helper';
import { handleError } from '@/common/error-handlers/error.handler';
import { generateInvoiceNumber } from '@/common/helpers/invoice-number.helper';
import { calculateWeightedAverage } from '@/common/helpers/stock.helper';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { Item } from '@/items/entities/item.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreatePurchaseInvoiceDto } from '../dtos/create-purchase-invoice.dto';
import { PurchaseInvoiceQueryDto } from '../dtos/purchase-invoice-query.dto';
import { UpdatePurchaseInvoiceDto } from '../dtos/update-purchase-invoice.dto';
import { PurchaseInvoiceItem } from '../entities/purchase-invoice-item.entity';
import { PurchaseInvoice } from '../entities/purchase-invoice.entity';

@Injectable()
export class PurchaseInvoicesService {
  constructor(
    @InjectRepository(PurchaseInvoice)
    private readonly invoiceRepository: Repository<PurchaseInvoice>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: PurchaseInvoiceQueryDto) {
    try {
      const limit = query.limit || 10;
      const page = query.page || 1;
      const skip = (page - 1) * limit;

      const qb = this.invoiceRepository
        .createQueryBuilder('pi')
        .leftJoinAndSelect('pi.supplier', 'supplier')
        .leftJoinAndSelect('pi.createdBy', 'createdBy')
        .orderBy('pi.date', 'DESC')
        .addOrderBy('pi.id', 'DESC');

      if (query.search) {
        qb.andWhere(
          '(pi.invoiceNumber ILIKE :search OR supplier.name ILIKE :search)',
          { search: `%${query.search}%` },
        );
      }

      if (query.supplierId) {
        qb.andWhere('pi.supplierId = :supplierId', { supplierId: query.supplierId });
      }

      if (query.fromDate) {
        qb.andWhere('pi.date >= :fromDate', { fromDate: query.fromDate });
      }

      if (query.toDate) {
        qb.andWhere('pi.date <= :toDate', { toDate: query.toDate });
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
        relations: ['supplier', 'createdBy', 'items', 'items.item'],
      });

      if (!invoice) {
        throw new NotFoundException(`Purchase invoice #${id} not found`);
      }

      return invoice;
    } catch (error) {
      handleError(error);
    }
  }

  async create(dto: CreatePurchaseInvoiceDto, activeUser: ActiveUserData) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoiceNumber = await generateInvoiceNumber('PI', this.invoiceRepository);

      const lineTotal = dto.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
      const discount = dto.discount ?? 0;
      const totalAmount = lineTotal - discount;

      const invoice = queryRunner.manager.create(PurchaseInvoice, {
        invoiceNumber,
        supplierId: dto.supplierId,
        date: dto.date,
        discount,
        notes: dto.notes ?? null,
        totalAmount,
        createdById: activeUser.id,
      });

      const savedInvoice = await queryRunner.manager.save(PurchaseInvoice, invoice);

      for (const lineDto of dto.items) {
        const item = await queryRunner.manager.findOne(Item, { where: { id: lineDto.itemId } });

        if (!item) {
          throw new NotFoundException(`Item #${lineDto.itemId} not found`);
        }

        const lineItem = queryRunner.manager.create(PurchaseInvoiceItem, {
          invoiceId: savedInvoice.id,
          itemId: lineDto.itemId,
          quantity: lineDto.quantity,
          unitPrice: lineDto.unitPrice,
          totalPrice: lineDto.quantity * lineDto.unitPrice,
        });

        await queryRunner.manager.save(PurchaseInvoiceItem, lineItem);

        const oldQty = Number(item.totalQuantity);
        const oldAvg = Number(item.averagePrice);
        const newAvg = calculateWeightedAverage(oldQty, oldAvg, lineDto.quantity, lineDto.unitPrice);

        await queryRunner.manager.update(Item, { id: lineDto.itemId }, {
          totalQuantity: oldQty + lineDto.quantity,
          averagePrice: newAvg,
        });
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

  async update(id: number, dto: UpdatePurchaseInvoiceDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoice = await queryRunner.manager.findOne(PurchaseInvoice, {
        where: { id },
        relations: ['items'],
      });

      if (!invoice) {
        throw new NotFoundException(`Purchase invoice #${id} not found`);
      }

      // Reverse old stock changes
      for (const oldLine of invoice.items) {
        const item = await queryRunner.manager.findOne(Item, { where: { id: oldLine.itemId } });

        if (!item) continue;

        const currentQty = Number(item.totalQuantity);
        const currentAvg = Number(item.averagePrice);
        const removedQty = Number(oldLine.quantity);
        const removedPrice = Number(oldLine.unitPrice);

        const remainingQty = currentQty - removedQty;

        let restoredAvg: number;
        if (remainingQty <= 0) {
          restoredAvg = 0;
        } else {
          // Reverse: (currentQty * currentAvg - removedQty * removedPrice) / remainingQty
          restoredAvg = (currentQty * currentAvg - removedQty * removedPrice) / remainingQty;
        }

        await queryRunner.manager.update(Item, { id: oldLine.itemId }, {
          totalQuantity: Math.max(0, remainingQty),
          averagePrice: Math.max(0, restoredAvg),
        });
      }

      // Delete old line items
      await queryRunner.manager.delete(PurchaseInvoiceItem, { invoiceId: id });

      // Apply new line items
      const lineTotal = dto.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
      const discount = dto.discount ?? 0;
      const totalAmount = lineTotal - discount;

      for (const lineDto of dto.items) {
        const item = await queryRunner.manager.findOne(Item, { where: { id: lineDto.itemId } });

        if (!item) {
          throw new NotFoundException(`Item #${lineDto.itemId} not found`);
        }

        const lineItem = queryRunner.manager.create(PurchaseInvoiceItem, {
          invoiceId: id,
          itemId: lineDto.itemId,
          quantity: lineDto.quantity,
          unitPrice: lineDto.unitPrice,
          totalPrice: lineDto.quantity * lineDto.unitPrice,
        });

        await queryRunner.manager.save(PurchaseInvoiceItem, lineItem);

        const oldQty = Number(item.totalQuantity);
        const oldAvg = Number(item.averagePrice);
        const newAvg = calculateWeightedAverage(oldQty, oldAvg, lineDto.quantity, lineDto.unitPrice);

        await queryRunner.manager.update(Item, { id: lineDto.itemId }, {
          totalQuantity: oldQty + lineDto.quantity,
          averagePrice: newAvg,
        });
      }

      await queryRunner.manager.update(PurchaseInvoice, { id }, {
        supplierId: dto.supplierId,
        date: dto.date,
        discount,
        notes: dto.notes ?? null,
        totalAmount,
      });

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.invoiceRepository.findOne({
        where: { id },
        relations: ['supplier', 'createdBy', 'items', 'items.item'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      handleError(error);
      throw error;
    }
  }

  async getTotalPurchaseAmount(): Promise<number> {
    try {
      const result = await this.invoiceRepository
        .createQueryBuilder('pi')
        .where('pi.deletedAt IS NULL')
        .select('COALESCE(SUM(CAST(pi.totalAmount AS numeric)), 0)', 'total')
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
        relations: ['supplier', 'createdBy'],
        order: { date: 'DESC' },
      });

      return toCsvBuffer(
        ['Invoice #', 'Date', 'Supplier', 'Discount', 'Total Amount', 'Notes'],
        invoices.map((inv) => ({
          'Invoice #': inv.invoiceNumber,
          'Date': inv.date,
          'Supplier': inv.supplier?.name ?? '',
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
}
