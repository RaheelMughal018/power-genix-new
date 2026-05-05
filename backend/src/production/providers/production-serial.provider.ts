import { handleError } from '@/common/error-handlers/error.handler';
import type { ActiveUserData } from '@/common/interfaces/active-user-data.interface';
import { SettingsService } from '@/settings/providers/settings.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionUnit } from '../entities/production-unit.entity';

@Injectable()
export class ProductionSerialProvider {
  constructor(
    @InjectRepository(ProductionUnit)
    private readonly unitRepository: Repository<ProductionUnit>,
    private readonly settingsService: SettingsService,
  ) {}

  async generateSerialNumbers(quantity: number, activeUser: ActiveUserData): Promise<string[]> {
    try {
      const settings = await this.settingsService.getSettings(activeUser);
      const prefix = settings?.business?.serialPrefix || 'LEH';
      const year = new Date().getFullYear();

      const pattern = `${prefix}-${year}-%`;
      const existing = await this.unitRepository
        .createQueryBuilder('unit')
        .where('unit.serialNumber LIKE :pattern', { pattern })
        .orderBy('unit.serialNumber', 'DESC')
        .getOne();

      let nextSeq = 1;
      if (existing) {
        const parts = existing.serialNumber.split('-');
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) {
          nextSeq = lastSeq + 1;
        }
      }

      return Array.from({ length: quantity }, (_, i) => {
        const seq = String(nextSeq + i).padStart(3, '0');
        return `${prefix}-${year}-${seq}`;
      });
    } catch (error) {
      handleError(error);
      return [];
    }
  }
}
