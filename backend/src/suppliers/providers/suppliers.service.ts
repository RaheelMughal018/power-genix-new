import { toCsvBuffer } from '@/common/helpers/csv.helper';
import { handleError } from '@/common/error-handlers/error.handler';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { PurchaseInvoice } from '@/purchase-invoices/entities/purchase-invoice.entity';
import { SupplierPayment } from '@/supplier-payments/entities/supplier-payment.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
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
        due: Number(supplier.openingBalance) + Number(raw[i]?.supplier_totalPurchase ?? 0) - Number(raw[i]?.supplier_totalPaid ?? 0),
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

      const currentBalance = openingBalance + totalPurchaseAmount;
      const outstandingBalance = currentBalance - totalPaidAmount;

      return {
        ...supplier,
        openingBalance,
        totalPurchaseAmount,
        totalPaidAmount,
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

      type Row = {
        date: string;
        invoiceNumber: string;
        purchaseAmount: number;
        amountPaid: number;
        balance: number;
      };

      const entries: Array<{ date: string; sortId: number; type: 'invoice' | 'payment'; row: Row }> = [];

      for (const inv of invoices) {
        entries.push({ date: inv.date, sortId: inv.id, type: 'invoice', row: { date: inv.date, invoiceNumber: inv.invoiceNumber, purchaseAmount: Number(inv.totalAmount), amountPaid: 0, balance: 0 } });
      }
      for (const pay of payments) {
        entries.push({ date: pay.date, sortId: pay.id, type: 'payment', row: { date: pay.date, invoiceNumber: pay.invoiceNumber, purchaseAmount: 0, amountPaid: Number(pay.amount), balance: 0 } });
      }

      entries.sort((a, b) => a.date.localeCompare(b.date) || a.sortId - b.sortId);

      const openingBalance = Number(supplier.openingBalance);
      let balance = openingBalance;
      let totalPurchase = 0;
      let totalPaid = 0;

      const rows = entries.map((e) => {
        balance += e.row.purchaseAmount - e.row.amountPaid;
        totalPurchase += e.row.purchaseAmount;
        totalPaid += e.row.amountPaid;
        return { ...e.row, balance, id: e.sortId, type: e.type };
      });

      return {
        supplier: { id: supplier.id, name: supplier.name },
        dateRange: from || to ? { from: from ?? '', to: to ?? '' } : undefined,
        columns: ['Date', 'Invoice #', 'Purchase Amount', 'Amount Paid', 'Outstanding Balance'],
        rows: rows.map((r) => ({
          id: r.id,
          type: r.type,
          'Date': r.date,
          'Invoice #': r.invoiceNumber,
          'Purchase Amount': r.purchaseAmount,
          'Amount Paid': r.amountPaid,
          'Outstanding Balance': r.balance,
        })),
        footer: {
          'Opening Balance': openingBalance,
          'Total Purchase': totalPurchase,
          'Total Paid': totalPaid,
          'Outstanding': openingBalance + totalPurchase - totalPaid,
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
