import { toCsvBuffer } from '@/common/helpers/csv.helper';
import { handleError } from '@/common/error-handlers/error.handler';
import { applySearch } from '@/common/helpers/search-clause.helper';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { CustomerPayment } from '@/customer-payments/entities/customer-payment.entity';
import { RepairInvoice } from '@/repair-invoices/entities/repair-invoice.entity';
import { RepairInvoicesService } from '@/repair-invoices/providers/repair-invoices.service';
import { SaleInvoice } from '@/sale-invoices/entities/sale-invoice.entity';
import { SaleInvoicesService } from '@/sale-invoices/providers/sale-invoices.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { CreateCustomerDto } from '../dtos/create-customer.dto';
import { UpdateCustomerDto } from '../dtos/update-customer.dto';
import { CustomerQueryDto } from '../dtos/customer-query.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(CustomerPayment)
    private readonly customerPaymentRepository: Repository<CustomerPayment>,
    @InjectRepository(SaleInvoice)
    private readonly saleInvoiceRepository: Repository<SaleInvoice>,
    @InjectRepository(RepairInvoice)
    private readonly repairInvoiceRepository: Repository<RepairInvoice>,
    private readonly saleInvoicesService: SaleInvoicesService,
    private readonly repairInvoicesService: RepairInvoicesService,
  ) {}

  async findAll(query: CustomerQueryDto) {
    try {
      const limit = query.limit || 10;
      const page = query.page || 1;
      const skip = (page - 1) * limit;

      const qb = this.customersRepository
        .createQueryBuilder('customer')
        .leftJoinAndSelect('customer.createdBy', 'createdBy')
        .addSelect(
          `COALESCE((SELECT SUM(CAST(si."totalAmount" AS numeric)) FROM sale_invoice si WHERE si."customerId" = customer.id AND si."deletedAt" IS NULL), 0)`,
          'customer_totalSales',
        )
        .addSelect(
          `COALESCE((SELECT SUM(CAST(ri."totalAmount" AS numeric)) FROM repair_invoice ri WHERE ri."customerId" = customer.id AND ri."isCharged" = true AND ri."deletedAt" IS NULL), 0)`,
          'customer_totalRepairs',
        )
        .addSelect(
          `COALESCE((SELECT SUM(CAST(cp."amount" AS numeric)) FROM customer_payment cp WHERE cp."customerId" = customer.id AND cp."deletedAt" IS NULL), 0)`,
          'customer_totalPayments',
        )
        .addSelect(
          `CASE WHEN (
            EXISTS(SELECT 1 FROM sale_invoice si WHERE si."customerId" = customer.id AND si."deletedAt" IS NULL)
            OR EXISTS(SELECT 1 FROM repair_invoice ri WHERE ri."customerId" = customer.id AND ri."deletedAt" IS NULL)
            OR EXISTS(SELECT 1 FROM customer_payment cp WHERE cp."customerId" = customer.id AND cp."deletedAt" IS NULL)
          ) THEN false ELSE true END`,
          'customer_canDelete',
        )
        .orderBy('customer.name', 'ASC');

      applySearch(qb, query.search, {
        text: ['customer.name', 'customer.phone', 'customer.email', 'customer.address'],
        numeric: ['customer.openingBalance'],
      });

      const { entities, raw } = await qb.skip(skip).take(limit).getRawAndEntities();
      const totalItems = await qb.getCount();

      const data = entities.map((customer, i) => ({
        ...customer,
        totalSales: Number(raw[i]?.customer_totalSales ?? 0),
        totalRepairs: Number(raw[i]?.customer_totalRepairs ?? 0),
        totalPayments: Number(raw[i]?.customer_totalPayments ?? 0),
        due: Number(customer.openingBalance) + Number(raw[i]?.customer_totalSales ?? 0) + Number(raw[i]?.customer_totalRepairs ?? 0) - Number(raw[i]?.customer_totalPayments ?? 0),
        canDelete: raw[i]?.customer_canDelete === true || raw[i]?.customer_canDelete === 'true',
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
      const customer = await this.customersRepository.findOne({
        where: { id },
        relations: ['createdBy'],
      });

      if (!customer) {
        throw new NotFoundException(`Customer #${id} not found`);
      }

      return customer;
    } catch (error) {
      handleError(error);
    }
  }

  async getDetail(id: number, from?: string, to?: string) {
    try {
      const customer = await this.customersRepository.findOne({
        where: { id },
        relations: ['createdBy'],
      });

      if (!customer) {
        throw new NotFoundException(`Customer #${id} not found`);
      }

      const openingBalance = Number(customer.openingBalance);

      const totalSaleAmount = await this.saleInvoicesService.getTotalSaleAmount({ customerId: id, fromDate: from, toDate: to });

      const totalRepairAmount = await this.repairInvoicesService.getTotalRepairAmount({ customerId: id, fromDate: from, toDate: to, isCharged: true });

      const paymentQb = this.customerPaymentRepository
        .createQueryBuilder('cp')
        .where('cp.customerId = :customerId AND cp.deletedAt IS NULL', { customerId: id });
      if (from) paymentQb.andWhere('cp.date >= :from', { from });
      if (to) paymentQb.andWhere('cp.date <= :to', { to });
      const paymentResult = await paymentQb
        .select('COALESCE(SUM(CAST(cp.amount AS numeric)), 0)', 'total')
        .getRawOne<{ total: string }>();

      const totalPaymentReceived = Number(paymentResult?.total ?? 0);

      const currentBalance = openingBalance + totalSaleAmount + totalRepairAmount;
      const outstandingBalance = currentBalance - totalPaymentReceived;

      return {
        ...customer,
        openingBalance,
        totalSaleAmount,
        totalRepairAmount,
        totalPaymentReceived,
        currentBalance,
        outstandingBalance,
      };
    } catch (error) {
      handleError(error);
    }
  }

  async create(dto: CreateCustomerDto, activeUser: ActiveUserData) {
    try {
      const customer = this.customersRepository.create({
        name: dto.name,
        phone: dto.phone,
        email: dto.email ?? null,
        address: dto.address ?? null,
        openingBalance: dto.openingBalance ?? 0,
        createdBy: { id: activeUser.id } as any,
      });

      return await this.customersRepository.save(customer);
    } catch (error) {
      handleError(error);
    }
  }

  async update(id: number, dto: UpdateCustomerDto) {
    try {
      const customer = await this.customersRepository.findOne({ where: { id } });

      if (!customer) {
        throw new NotFoundException(`Customer #${id} not found`);
      }

      Object.assign(customer, dto);

      return await this.customersRepository.save(customer);
    } catch (error) {
      handleError(error);
    }
  }

  async remove(id: number) {
    try {
      const customer = await this.customersRepository.findOne({ where: { id } });

      if (!customer) {
        throw new NotFoundException(`Customer #${id} not found`);
      }

      const hasSales = await this.saleInvoiceRepository.count({ where: { customerId: id } });
      const hasRepairs = await this.repairInvoiceRepository.count({ where: { customerId: id } });
      const hasPayments = await this.customerPaymentRepository.count({ where: { customerId: id } });

      if (hasSales || hasRepairs || hasPayments) {
        throw new BadRequestException('Cannot delete customer with existing transactions');
      }

      await this.customersRepository.softDelete(id);

      return { message: 'Customer deleted successfully' };
    } catch (error) {
      handleError(error);
    }
  }

  async getStatement(id: number, from?: string, to?: string) {
    try {
      const customer = await this.customersRepository.findOne({ where: { id } });

      if (!customer) {
        throw new NotFoundException(`Customer #${id} not found`);
      }

      const saleQb = this.saleInvoiceRepository
        .createQueryBuilder('si')
        .where('si.customerId = :id AND si.deletedAt IS NULL', { id })
        .orderBy('si.date', 'ASC')
        .addOrderBy('si.id', 'ASC');

      if (from) saleQb.andWhere('si.date >= :from', { from });
      if (to) saleQb.andWhere('si.date <= :to', { to });

      const sales = await saleQb.getMany();

      const repairQb = this.repairInvoiceRepository
        .createQueryBuilder('ri')
        .where('ri.customerId = :id AND ri.deletedAt IS NULL', { id })
        .orderBy('ri.date', 'ASC')
        .addOrderBy('ri.id', 'ASC');

      if (from) repairQb.andWhere('ri.date >= :from', { from });
      if (to) repairQb.andWhere('ri.date <= :to', { to });

      const repairs = await repairQb.getMany();

      const paymentQb = this.customerPaymentRepository
        .createQueryBuilder('cp')
        .where('cp.customerId = :id AND cp.deletedAt IS NULL', { id })
        .orderBy('cp.date', 'ASC')
        .addOrderBy('cp.id', 'ASC');

      if (from) paymentQb.andWhere('cp.date >= :from', { from });
      if (to) paymentQb.andWhere('cp.date <= :to', { to });

      const payments = await paymentQb.getMany();

      type Row = {
        date: string;
        invoiceNumber: string;
        saleAmount: number;
        repairAmount: number;
        amountReceived: number;
        balance: number;
        notes: string;
      };

      const entries: Array<{ date: string; sortId: number; type: 'sale' | 'repair' | 'repair_foc' | 'payment'; row: Row }> = [];

      for (const s of sales) {
        entries.push({ date: s.date, sortId: s.id, type: 'sale', row: { date: s.date, invoiceNumber: s.invoiceNumber, saleAmount: Number(s.totalAmount), repairAmount: 0, amountReceived: 0, balance: 0, notes: s.notes ?? '' } });
      }
      for (const r of repairs) {
        entries.push({ date: r.date, sortId: r.id, type: r.isCharged ? 'repair' : 'repair_foc', row: { date: r.date, invoiceNumber: r.invoiceNumber, saleAmount: 0, repairAmount: Number(r.totalAmount), amountReceived: 0, balance: 0, notes: r.description ?? '' } });
      }
      for (const p of payments) {
        entries.push({ date: p.date, sortId: p.id, type: 'payment', row: { date: p.date, invoiceNumber: p.invoiceNumber, saleAmount: 0, repairAmount: 0, amountReceived: Number(p.amount), balance: 0, notes: p.notes ?? '' } });
      }

      entries.sort((a, b) => a.date.localeCompare(b.date) || a.sortId - b.sortId);

      const openingBalance = Number(customer.openingBalance);
      let balance = openingBalance;
      let totalSale = 0;
      let totalRepair = 0;
      let totalReceived = 0;

      const rows = entries.map((e) => {
        const isFoc = e.type === 'repair_foc';
        if (!isFoc) {
          balance += e.row.saleAmount + e.row.repairAmount - e.row.amountReceived;
          totalSale += e.row.saleAmount;
          totalRepair += e.row.repairAmount;
          totalReceived += e.row.amountReceived;
        }
        return { ...e.row, balance, id: e.sortId, type: e.type };
      });

      return {
        customer: { id: customer.id, name: customer.name },
        dateRange: from || to ? { from: from ?? '', to: to ?? '' } : undefined,
        columns: ['Date', 'Invoice #', 'Sale Amount', 'Repair Amount', 'Amount Received', 'Outstanding Balance'],
        rows: rows.map((r) => ({
          id: r.id,
          type: r.type,
          notes: r.notes,
          'Date': r.date,
          'Invoice #': r.invoiceNumber,
          'Sale Amount': r.saleAmount,
          'Repair Amount': r.repairAmount,
          'Amount Received': r.amountReceived,
          'Outstanding Balance': r.balance,
        })),
        footer: {
          'Opening Balance': openingBalance,
          'Total Sale': totalSale,
          'Total Repair': totalRepair,
          'Total Received': totalReceived,
          'Outstanding': openingBalance + totalSale + totalRepair - totalReceived,
        },
      };
    } catch (error) {
      handleError(error);
    }
  }

  async exportCsv() {
    try {
      const customers = await this.customersRepository.find({
        order: { name: 'ASC' },
      });

      return toCsvBuffer(
        ['Name', 'Phone', 'Address', 'Balance'],
        customers.map((c) => ({
          'Name': c.name,
          'Phone': c.phone,
          'Address': c.address ?? '',
          'Balance': c.openingBalance,
        })),
      );
    } catch (error) {
      handleError(error);
    }
  }
}
