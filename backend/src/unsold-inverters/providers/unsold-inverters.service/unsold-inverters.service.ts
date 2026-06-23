import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ProductionUnit } from '@/production/entities/production-unit.entity';
import { ProductionStatus } from '@/production/enums/production-status.enum';
import { handleError } from '@/common/error-handlers/error.handler';
import { toCsvBuffer } from '@/common/helpers/csv.helper';
import { UnsoldInverterQueryDto } from '../../dtos/unsold-inverter-query.dto';

@Injectable()
export class UnsoldInvertersService {
  constructor(
    @InjectRepository(ProductionUnit)
    private readonly repo: Repository<ProductionUnit>,
  ) {}

  async findAll(query: UnsoldInverterQueryDto) {
    try {
      const limit = query.limit ?? 10;
      const page = query.page ?? 1;
      const skip = (page - 1) * limit;

      const qb = this.baseQuery()
        .select([
          'pu.id              AS pu_id',
          'pu.serialNumber    AS pu_serialnumber',
          'pu.unitCost        AS pu_unitcost',
          'pb.id              AS pb_id',
          'pb.batchNumber     AS pb_batchnumber',
          'pb.productionDate  AS pb_productiondate',
          'item.id            AS item_id',
          'item.name          AS item_name',
        ])
        .orderBy('pb.productionDate', 'DESC')
        .addOrderBy('pu.id', 'DESC');

      this.applyFilters(qb, query);
      this.applySearch(qb, query.search);

      const countQb = this.baseQuery();
      this.applyFilters(countQb, query);
      this.applySearch(countQb, query.search);

      const [rows, totalItems] = await Promise.all([
        qb.offset(skip).limit(limit).getRawMany<{
          pu_id: number;
          pu_serialnumber: string;
          pu_unitcost: string;
          pb_id: number;
          pb_batchnumber: string;
          pb_productiondate: string;
          item_id: number;
          item_name: string;
        }>(),
        countQb
          .select('COUNT(pu.id)', 'count')
          .getRawOne<{ count: string }>()
          .then((r) => Number(r?.count ?? 0)),
      ]);

      const data = rows.map((r) => ({
        id: Number(r.pu_id),
        serialNumber: r.pu_serialnumber,
        unitCost: Number(r.pu_unitcost),
        batch: {
          id: Number(r.pb_id),
          batchNumber: r.pb_batchnumber,
          productionDate: r.pb_productiondate,
        },
        item: { id: Number(r.item_id), name: r.item_name },
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
      throw error;
    }
  }

  async getSummary(query: UnsoldInverterQueryDto) {
    try {
      const qb = this.baseQuery()
        .select('COUNT(pu.id)', 'totalQuantity')
        .addSelect('COALESCE(SUM(CAST(pu.unitCost AS numeric)), 0)', 'totalProductionCost');

      this.applyFilters(qb, query);
      this.applySearch(qb, query.search);

      const result = await qb.getRawOne<{
        totalQuantity: string;
        totalProductionCost: string;
      }>();

      return {
        totalQuantity: Number(result?.totalQuantity ?? 0),
        totalProductionCost: Number(result?.totalProductionCost ?? 0),
      };
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  async listItemsWithUnsold(): Promise<Array<{ id: number; name: string }>> {
    try {
      const qb = this.baseQuery()
        .select('DISTINCT item.id', 'id')
        .addSelect('item.name', 'name')
        .orderBy('item.name', 'ASC');

      const rows = await qb.getRawMany<{ id: number; name: string }>();
      return rows.map((r) => ({ id: Number(r.id), name: r.name }));
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  async exportCsv(query: UnsoldInverterQueryDto) {
    try {
      const qb = this.baseQuery()
        .select([
          'pu.serialNumber    AS serialnumber',
          'item.name          AS itemname',
          'pb.batchNumber     AS batchnumber',
          'pb.productionDate  AS productiondate',
          'pu.unitCost        AS unitcost',
        ])
        .orderBy('pb.productionDate', 'DESC')
        .addOrderBy('pu.id', 'DESC');

      this.applyFilters(qb, query);
      this.applySearch(qb, query.search);

      const rows = await qb.getRawMany<{
        serialnumber: string;
        itemname: string;
        batchnumber: string;
        productiondate: string;
        unitcost: string;
      }>();

      return toCsvBuffer(
        ['Serial Number', 'Item Name', 'Batch Number', 'Production Date', 'Production Cost'],
        rows.map((r) => ({
          'Serial Number': r.serialnumber,
          'Item Name': r.itemname,
          'Batch Number': r.batchnumber,
          'Production Date': r.productiondate,
          'Production Cost': r.unitcost,
        })),
      );
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  private baseQuery(): SelectQueryBuilder<ProductionUnit> {
    return this.repo
      .createQueryBuilder('pu')
      .innerJoin('production_batch', 'pb', 'pb.id = pu.batchId')
      .innerJoin('recipe', 'r', 'r.id = pb.recipeId')
      .innerJoin('item', 'item', 'item.id = r.finalProductId')
      .leftJoin(
        'sold_inverter',
        'si',
        'si.serialNumber = pu.serialNumber AND si.deletedAt IS NULL',
      )
      .where('si.id IS NULL')
      .andWhere('pb.deletedAt IS NULL')
      .andWhere('pb.status = :completed', { completed: ProductionStatus.COMPLETED });
  }

  private applyFilters(qb: SelectQueryBuilder<ProductionUnit>, query: UnsoldInverterQueryDto) {
    if (query.itemId) qb.andWhere('item.id = :itemId', { itemId: query.itemId });
    if (query.fromDate) qb.andWhere('pb.productionDate >= :fromDate', { fromDate: query.fromDate });
    if (query.toDate) qb.andWhere('pb.productionDate <= :toDate', { toDate: query.toDate });
  }

  private applySearch(qb: SelectQueryBuilder<ProductionUnit>, search?: string) {
    if (!search) return;
    qb.andWhere(
      '(pu.serialNumber ILIKE :q OR pb.batchNumber ILIKE :q OR item.name ILIKE :q)',
      { q: `%${search}%` },
    );
  }
}
