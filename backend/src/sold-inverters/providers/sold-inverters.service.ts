import { toCsvBuffer } from '@/common/helpers/csv.helper';
import { handleError } from '@/common/error-handlers/error.handler';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SoldInverter } from '../entities/sold-inverter.entity';
import { SoldInverterQueryDto } from '../dtos/sold-inverter-query.dto';

@Injectable()
export class SoldInvertersService {
  constructor(
    @InjectRepository(SoldInverter)
    private readonly repo: Repository<SoldInverter>,
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

      if (query.customerId) {
        qb.andWhere('si.customerId = :customerId', { customerId: query.customerId });
      }

      if (query.fromDate) {
        qb.andWhere('si.saleDate >= :fromDate', { fromDate: query.fromDate });
      }

      if (query.toDate) {
        qb.andWhere('si.saleDate <= :toDate', { toDate: query.toDate });
      }

      if (query.search) {
        qb.andWhere(
          '(item.name ILIKE :search OR si.serialNumber ILIKE :search OR customer.name ILIKE :search)',
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

  async getSummary(query: SoldInverterQueryDto) {
    try {
      const qb = this.repo
        .createQueryBuilder('si')
        .select('COALESCE(SUM(CAST(si.productionCost AS numeric)), 0)', 'totalProductionCost')
        .addSelect('COALESCE(SUM(CAST(si.saleCost AS numeric)), 0)', 'totalSaleCost')
        .addSelect('COALESCE(SUM(CAST(si.profit AS numeric)), 0)', 'totalProfit')
        .addSelect('COUNT(si.id)', 'count');

      if (query.customerId) {
        qb.andWhere('si.customerId = :customerId', { customerId: query.customerId });
      }

      if (query.fromDate) {
        qb.andWhere('si.saleDate >= :fromDate', { fromDate: query.fromDate });
      }

      if (query.toDate) {
        qb.andWhere('si.saleDate <= :toDate', { toDate: query.toDate });
      }

      const result = await qb.getRawOne<{
        totalProductionCost: string;
        totalSaleCost: string;
        totalProfit: string;
        count: string;
      }>();

      return {
        totalProductionCost: Number(result?.totalProductionCost ?? 0),
        totalSaleCost: Number(result?.totalSaleCost ?? 0),
        totalProfit: Number(result?.totalProfit ?? 0),
        count: Number(result?.count ?? 0),
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

      if (query.customerId) {
        qb.andWhere('si.customerId = :customerId', { customerId: query.customerId });
      }

      if (query.fromDate) {
        qb.andWhere('si.saleDate >= :fromDate', { fromDate: query.fromDate });
      }

      if (query.toDate) {
        qb.andWhere('si.saleDate <= :toDate', { toDate: query.toDate });
      }

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
}
