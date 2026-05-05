import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoldInverter } from './entities/sold-inverter.entity';
import { SoldInvertersController } from './sold-inverters.controller';
import { SoldInvertersService } from './providers/sold-inverters.service';

@Module({
  imports: [TypeOrmModule.forFeature([SoldInverter])],
  controllers: [SoldInvertersController],
  providers: [SoldInvertersService],
  exports: [SoldInvertersService],
})
export class SoldInvertersModule {}
