import { Item } from '@/items/entities/item.entity';
import { Supplier } from '@/suppliers/entities/supplier.entity';
import { User } from '@/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdjustmentType } from '../enums/adjustment-type.enum';
import { AdjustmentReason } from '../enums/adjustment-reason.enum';

@Entity()
export class StockAdjustment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Item, { eager: false, nullable: false })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column()
  itemId: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  unitPrice: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  deductionAmount: number | null;

  @Column({ type: 'enum', enum: AdjustmentType })
  type: AdjustmentType;

  @Column({ type: 'enum', enum: AdjustmentReason })
  reason: AdjustmentReason;

  @ManyToOne(() => Supplier, { eager: false, nullable: true })
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier | null;

  @Column({ nullable: true })
  supplierId: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'date' })
  date: string;

  @ManyToOne(() => User, { eager: false, nullable: false })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
