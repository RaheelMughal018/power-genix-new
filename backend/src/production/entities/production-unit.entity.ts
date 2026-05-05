import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductionBatch } from './production-batch.entity';
import { ProductionUnitItem } from './production-unit-item.entity';

@Entity()
export class ProductionUnit {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProductionBatch, (batch) => batch.units, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'batchId' })
  batch: ProductionBatch;

  @Column()
  batchId: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  serialNumber: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  unitCost: number;

  @OneToMany(() => ProductionUnitItem, (item) => item.productionUnit, { cascade: true })
  items: ProductionUnitItem[];
}
