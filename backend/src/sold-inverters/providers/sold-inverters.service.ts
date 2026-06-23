import { toCsvBuffer } from '@/common/helpers/csv.helper';
import { handleError } from '@/common/error-handlers/error.handler';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { SoldInverter } from '../entities/sold-inverter.entity';
import { SoldInverterQueryDto } from '../dtos/sold-inverter-query.dto';
import { SaleInvoiceItem } from '@/sale-invoices/entities/sale-invoice-item.entity';

@Injectable()
export class SoldInvertersService {
  constructor(
    @InjectRepository(SoldInverter)
    private readonly repo: Repository<SoldInverter>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: SoldInverterQueryDto) {
    try {
      const limit = query.limit || 10;
      const page = query.page || 1;
      const skip = (page - 1) * limit;

      const qb = this.repo
        .createQueryBuilder('si')
        .leftJoinAndSelect('si.item', 'item')
        .leftJoinAndSelect('si.customer', 'customer')
        .leftJoinAndSelect('si.createdBy', 'createdBy')
        .orderBy('si.saleDate', 'DESC')
        .addOrderBy('si.id', 'DESC');

      this.applyFilters(qb, query);
      this.applySearch(qb, query.search);

      const [data, totalItems] = await qb.skip(skip).take(limit).getManyAndCount();
      const enriched = await this.attachSaleInvoices(data);

      return {
        data: enriched,
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

  async getSummary(query: SoldInverterQueryDto) {
    try {
      const qb = this.repo
        .createQueryBuilder('si')
        .leftJoin('si.item', 'item')
        .leftJoin('si.customer', 'customer')
        .select('COALESCE(SUM(CAST(si.productionCost AS numeric)), 0)', 'totalProductionCost')
        .addSelect('COALESCE(SUM(CAST(si.saleCost AS numeric)), 0)', 'totalSaleCost')
        .addSelect('COALESCE(SUM(CAST(si.profit AS numeric)), 0)', 'totalProfit')
        .addSelect('COUNT(si.id)', 'totalQuantity');

      this.applyFilters(qb, query);
      this.applySearch(qb, query.search);

      const result = await qb.getRawOne<{
        totalProductionCost: string;
        totalSaleCost: string;
        totalProfit: string;
        totalQuantity: string;
      }>();

      return {
        totalProductionCost: Number(result?.totalProductionCost ?? 0),
        totalSaleCost: Number(result?.totalSaleCost ?? 0),
        totalProfit: Number(result?.totalProfit ?? 0),
        totalQuantity: Number(result?.totalQuantity ?? 0),
      };
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  async exportCsv(query: SoldInverterQueryDto) {
    try {
      const qb = this.repo
        .createQueryBuilder('si')
        .leftJoinAndSelect('si.item', 'item')
        .leftJoinAndSelect('si.customer', 'customer')
        .orderBy('si.saleDate', 'DESC');

      this.applyFilters(qb, query);
      this.applySearch(qb, query.search);

      const records = await qb.getMany();

      return toCsvBuffer(
        ['Serial Number', 'Item', 'Customer', 'Sale Date'],
        records.map((r) => ({
          'Serial Number': r.serialNumber,
          'Item': r.item?.name ?? '',
          'Customer': r.customer?.name ?? '',
          'Sale Date': r.saleDate,
        })),
      );
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  private applyFilters(qb: SelectQueryBuilder<SoldInverter>, query: SoldInverterQueryDto) {
    if (query.customerId) {
      qb.andWhere('si.customerId = :customerId', { customerId: query.customerId });
    }
    if (query.fromDate) {
      qb.andWhere('si.saleDate >= :fromDate', { fromDate: query.fromDate });
    }
    if (query.toDate) {
      qb.andWhere('si.saleDate <= :toDate', { toDate: query.toDate });
    }
  }

  private applySearch(qb: SelectQueryBuilder<SoldInverter>, search?: string) {
    if (!search) return;
    qb.leftJoin(SaleInvoiceItem, 'sii_search', 'sii_search.serialNumber = si.serialNumber')
      .leftJoin('sii_search.invoice', 'inv_search')
      .andWhere(
        '(item.name ILIKE :search OR si.serialNumber ILIKE :search OR customer.name ILIKE :search OR inv_search.invoiceNumber ILIKE :search)',
        { search: `%${search}%` },
      );
  }

  private async attachSaleInvoices(rows: SoldInverter[]) {
    const serials = rows.map((r) => r.serialNumber).filter((s): s is string => !!s);
    if (serials.length === 0) {
      return rows.map((r) => ({ ...r, saleInvoice: null }));
    }

    const items = await this.dataSource
      .getRepository(SaleInvoiceItem)
      .createQueryBuilder('sii')
      .innerJoin('sii.invoice', 'inv')
      .select('sii.serialNumber', 'serial')
      .addSelect('inv.id', 'id')
      .addSelect('inv.invoiceNumber', 'invoiceNumber')
      .where('sii.serialNumber IN (:...serials)', { serials })
      .getRawMany<{ serial: string; id: number; invoiceNumber: string }>();

    const map = new Map<string, { id: number; invoiceNumber: string }>();
    for (const i of items) {
      map.set(i.serial, { id: Number(i.id), invoiceNumber: i.invoiceNumber });
    }

    return rows.map((r) => ({
      ...r,
      saleInvoice: r.serialNumber ? map.get(r.serialNumber) ?? null : null,
    }));
  }
}
