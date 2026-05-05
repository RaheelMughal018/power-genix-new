import { Item } from '@/items/entities/item.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductionUnit } from './production-unit.entity';

@Entity()
export class ProductionUnitItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProductionUnit, (unit) => unit.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'productionUnitId' })
  productionUnit: ProductionUnit;

  @Column()
  productionUnitId: number;

  @ManyToOne(() => Item, { eager: false, nullable: false })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column()
  itemId: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;
}
