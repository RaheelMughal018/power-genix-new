import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnsoldInvertersController } from './unsold-inverters.controller';
import { UnsoldInvertersService } from './providers/unsold-inverters.service/unsold-inverters.service';
import { ProductionUnit } from '@/production/entities/production-unit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionUnit])],
  controllers: [UnsoldInvertersController],
  providers: [UnsoldInvertersService],
})
export class UnsoldInvertersModule {}
