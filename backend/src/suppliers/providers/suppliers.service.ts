import { toCsvBuffer } from '@/common/helpers/csv.helper';
import { handleError } from '@/common/error-handlers/error.handler';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { PurchaseInvoice } from '@/purchase-invoices/entities/purchase-invoice.entity';
import { SupplierPayment } from '@/supplier-payments/entities/supplier-payment.entity';
import { StockAdjustment } from '@/stock-adjustments/entities/stock-adjustment.entity';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../entities/supplier.entity';
import { CreateSupplierDto } from '../dtos/create-supplier.dto';
import { UpdateSupplierDto } from '../dtos/update-supplier.dto';
import { SupplierQueryDto } from '../dtos/supplier-query.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly suppliersRepository: Repository<Supplier>,
    @InjectRepository(PurchaseInvoice)
    private readonly purchaseInvoiceRepository: Repository<PurchaseInvoice>,
    @InjectRepository(SupplierPayment)
    private readonly supplierPaymentRepository: Repository<SupplierPayment>,
    @InjectRepository(StockAdjustment)
    private readonly stockAdjustmentRepository: Repository<StockAdjustment>,
  ) {}

  async findAll(query: SupplierQueryDto) {
    try {
      const limit = query.limit || 10;
      const page = query.page || 1;
      const skip = (page - 1) * limit;

      const qb = this.suppliersRepository
        .createQueryBuilder('supplier')
        .leftJoinAndSelect('supplier.createdBy', 'createdBy')
        .addSelect(
          `COALESCE((SELECT SUM(CAST(pi."totalAmount" AS numeric)) FROM purchase_invoice pi WHERE pi."supplierId" = supplier.id AND pi."deletedAt" IS NULL), 0)`,
          'supplier_totalPurchase',
        )
        .addSelect(
          `COALESCE((SELECT SUM(CAST(sp."amount" AS numeric)) FROM supplier_payment sp WHERE sp."supplierId" = supplier.id AND sp."deletedAt" IS NULL), 0)`,
          'supplier_totalPaid',
        )
        .addSelect(
          `COALESCE((SELECT SUM(CAST(sa."deductionAmount" AS numeric)) FROM stock_adjustment sa WHERE sa."supplierId" = supplier.id AND sa."reason" = 'return_to_supplier' AND sa."deletedAt" IS NULL), 0)`,
          'supplier_totalReturns',
        )
        .addSelect(
          `CASE WHEN (
            EXISTS(SELECT 1 FROM purchase_invoice pi WHERE pi."supplierId" = supplier.id AND pi."deletedAt" IS NULL)
            OR EXISTS(SELECT 1 FROM supplier_payment sp WHERE sp."supplierId" = supplier.id AND sp."deletedAt" IS NULL)
            OR EXISTS(SELECT 1 FROM stock_adjustment sa WHERE sa."supplierId" = supplier.id AND sa."deletedAt" IS NULL)
          ) THEN false ELSE true END`,
          'supplier_canDelete',
        )
        .orderBy('supplier.name', 'ASC');

      if (query.search) {
        qb.andWhere(
          '(supplier.name ILIKE :search OR supplier.phone ILIKE :search OR supplier.email ILIKE :search)',
          { search: `%${query.search}%` },
        );
      }

      const { entities, raw } = await qb.skip(skip).take(limit).getRawAndEntities();
      const totalItems = await qb.getCount();

      const data = entities.map((supplier, i) => ({
        ...supplier,
        totalPurchase: Number(raw[i]?.supplier_totalPurchase ?? 0),
        totalPaid: Number(raw[i]?.supplier_totalPaid ?? 0),
        totalReturns: Number(raw[i]?.supplier_totalReturns ?? 0),
        due: Number(supplier.openingBalance) + Number(raw[i]?.supplier_totalPurchase ?? 0) - Number(raw[i]?.supplier_totalPaid ?? 0) - Number(raw[i]?.supplier_totalReturns ?? 0),
        canDelete: raw[i]?.supplier_canDelete === true || raw[i]?.supplier_canDelete === 'true',
      }));

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
      const supplier = await this.suppliersRepository.findOne({
        where: { id },
        relations: ['createdBy'],
      });

      if (!supplier) {
        throw new NotFoundException(`Supplier #${id} not found`);
      }

      return supplier;
    } catch (error) {
      handleError(error);
    }
  }

  async getDetail(id: number) {
    try {
      const supplier = await this.suppliersRepository.findOne({
        where: { id },
        relations: ['createdBy'],
      });

      if (!supplier) {
        throw new NotFoundException(`Supplier #${id} not found`);
      }

      const openingBalance = Number(supplier.openingBalance);

      const purchaseResult = await this.purchaseInvoiceRepository
        .createQueryBuilder('pi')
        .where('pi.supplierId = :supplierId AND pi.deletedAt IS NULL', { supplierId: id })
        .select('COALESCE(SUM(CAST(pi.totalAmount AS numeric)), 0)', 'total')
        .getRawOne<{ total: string }>();

      const totalPurchaseAmount = Number(purchaseResult?.total ?? 0);

      const paymentResult = await this.supplierPaymentRepository
        .createQueryBuilder('sp')
        .where('sp.supplierId = :supplierId AND sp.deletedAt IS NULL', { supplierId: id })
        .select('COALESCE(SUM(CAST(sp.amount AS numeric)), 0)', 'total')
        .getRawOne<{ total: string }>();

      const totalPaidAmount = Number(paymentResult?.total ?? 0);

      const returnResult = await this.stockAdjustmentRepository
        .createQueryBuilder('sa')
        .where('sa.supplierId = :supplierId AND sa.reason = :reason AND sa.deletedAt IS NULL', { supplierId: id, reason: 'return_to_supplier' })
        .select('COALESCE(SUM(CAST(sa.deductionAmount AS numeric)), 0)', 'total')
        .getRawOne<{ total: string }>();

      const totalReturnAmount = Number(returnResult?.total ?? 0);

      const currentBalance = openingBalance + totalPurchaseAmount;
      const outstandingBalance = currentBalance - totalPaidAmount - totalReturnAmount;

      return {
        ...supplier,
        openingBalance,
        totalPurchaseAmount,
        totalPaidAmount,
        totalReturnAmount,
        currentBalance,
        outstandingBalance,
      };
    } catch (error) {
      handleError(error);
    }
  }

  async create(dto: CreateSupplierDto, activeUser: ActiveUserData) {
    try {
      const supplier = this.suppliersRepository.create({
        name: dto.name,
        phone: dto.phone,
        email: dto.email ?? null,
        address: dto.address ?? null,
        openingBalance: dto.openingBalance ?? 0,
        createdBy: { id: activeUser.id } as any,
      });

      return await this.suppliersRepository.save(supplier);
    } catch (error) {
      handleError(error);
    }
  }

  async update(id: number, dto: UpdateSupplierDto) {
    try {
      const supplier = await this.suppliersRepository.findOne({ where: { id } });

      if (!supplier) {
        throw new NotFoundException(`Supplier #${id} not found`);
      }

      Object.assign(supplier, dto);

      return await this.suppliersRepository.save(supplier);
    } catch (error) {
      handleError(error);
    }
  }

  async remove(id: number) {
    try {
      const supplier = await this.suppliersRepository.findOne({ where: { id } });

      if (!supplier) {
        throw new NotFoundException(`Supplier #${id} not found`);
      }

      const hasInvoices = await this.purchaseInvoiceRepository.count({ where: { supplierId: id } });
      const hasPayments = await this.supplierPaymentRepository.count({ where: { supplierId: id } });
      const hasAdjustments = await this.stockAdjustmentRepository.count({ where: { supplierId: id } });

      if (hasInvoices || hasPayments || hasAdjustments) {
        throw new BadRequestException('Cannot delete supplier with existing transactions');
      }

      await this.suppliersRepository.softDelete(id);

      return { message: 'Supplier deleted successfully' };
    } catch (error) {
      handleError(error);
    }
  }

  async getStatement(id: number, from?: string, to?: string) {
    try {
      const supplier = await this.suppliersRepository.findOne({ where: { id } });

      if (!supplier) {
        throw new NotFoundException(`Supplier #${id} not found`);
      }

      const invoiceQb = this.purchaseInvoiceRepository
        .createQueryBuilder('pi')
        .where('pi.supplierId = :id AND pi.deletedAt IS NULL', { id })
        .orderBy('pi.date', 'ASC')
        .addOrderBy('pi.id', 'ASC');

      if (from) invoiceQb.andWhere('pi.date >= :from', { from });
      if (to) invoiceQb.andWhere('pi.date <= :to', { to });

      const invoices = await invoiceQb.getMany();

      const paymentQb = this.supplierPaymentRepository
        .createQueryBuilder('sp')
        .where('sp.supplierId = :id AND sp.deletedAt IS NULL', { id })
        .orderBy('sp.date', 'ASC')
        .addOrderBy('sp.id', 'ASC');

      if (from) paymentQb.andWhere('sp.date >= :from', { from });
      if (to) paymentQb.andWhere('sp.date <= :to', { to });

      const payments = await paymentQb.getMany();

      const returnQb = this.stockAdjustmentRepository
        .createQueryBuilder('sa')
        .where('sa.supplierId = :id AND sa.reason = :reason AND sa.deletedAt IS NULL', { id, reason: 'return_to_supplier' })
        .leftJoinAndSelect('sa.item', 'item')
        .orderBy('sa.date', 'ASC')
        .addOrderBy('sa.id', 'ASC');

      if (from) returnQb.andWhere('sa.date >= :from', { from });
      if (to) returnQb.andWhere('sa.date <= :to', { to });

      const returns = await returnQb.getMany();

      type Row = {
        date: string;
        invoiceNumber: string;
        purchaseAmount: number;
        returnAmount: number;
        amountPaid: number;
        balance: number;
      };

      const entries: Array<{ date: string; sortId: number; type: 'invoice' | 'payment' | 'return'; row: Row }> = [];

      for (const inv of invoices) {
        entries.push({ date: inv.date, sortId: inv.id, type: 'invoice', row: { date: inv.date, invoiceNumber: inv.invoiceNumber, purchaseAmount: Number(inv.totalAmount), returnAmount: 0, amountPaid: 0, balance: 0 } });
      }
      for (const pay of payments) {
        entries.push({ date: pay.date, sortId: pay.id, type: 'payment', row: { date: pay.date, invoiceNumber: pay.invoiceNumber, purchaseAmount: 0, returnAmount: 0, amountPaid: Number(pay.amount), balance: 0 } });
      }
      for (const ret of returns) {
        entries.push({ date: ret.date, sortId: ret.id, type: 'return', row: { date: ret.date, invoiceNumber: ret.item?.name ?? `Return #${ret.id}`, purchaseAmount: 0, returnAmount: Number(ret.deductionAmount ?? 0), amountPaid: 0, balance: 0 } });
      }

      entries.sort((a, b) => a.date.localeCompare(b.date) || a.sortId - b.sortId);

      const openingBalance = Number(supplier.openingBalance);
      let balance = openingBalance;
      let totalPurchase = 0;
      let totalReturns = 0;
      let totalPaid = 0;

      const rows = entries.map((e) => {
        balance += e.row.purchaseAmount - e.row.returnAmount - e.row.amountPaid;
        totalPurchase += e.row.purchaseAmount;
        totalReturns += e.row.returnAmount;
        totalPaid += e.row.amountPaid;
        return { ...e.row, balance, id: e.sortId, type: e.type };
      });

      return {
        supplier: { id: supplier.id, name: supplier.name },
        dateRange: from || to ? { from: from ?? '', to: to ?? '' } : undefined,
        columns: ['Date', 'Invoice #', 'Purchase Amount', 'Return Amount', 'Amount Paid', 'Outstanding Balance'],
        rows: rows.map((r) => ({
          id: r.id,
          type: r.type,
          'Date': r.date,
          'Invoice #': r.invoiceNumber,
          'Purchase Amount': r.purchaseAmount,
          'Return Amount': r.returnAmount,
          'Amount Paid': r.amountPaid,
          'Outstanding Balance': r.balance,
        })),
        footer: {
          'Opening Balance': openingBalance,
          'Total Purchase': totalPurchase,
          'Total Returns': totalReturns,
          'Total Paid': totalPaid,
          'Outstanding': openingBalance + totalPurchase - totalReturns - totalPaid,
        },
      };
    } catch (error) {
      handleError(error);
    }
  }

  async exportCsv() {
    try {
      const suppliers = await this.suppliersRepository.find({
        order: { name: 'ASC' },
      });

      return toCsvBuffer(
        ['Name', 'Phone', 'Address', 'Balance'],
        suppliers.map((s) => ({
          'Name': s.name,
          'Phone': s.phone,
          'Address': s.address ?? '',
          'Balance': s.openingBalance,
        })),
      );
    } catch (error) {
      handleError(error);
    }
  }
}
