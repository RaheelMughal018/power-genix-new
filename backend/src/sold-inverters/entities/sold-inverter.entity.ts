import { Customer } from '@/customers/entities/customer.entity';
import { Item } from '@/items/entities/item.entity';
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

@Entity()
export class SoldInverter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  serialNumber: string;

  @ManyToOne(() => Item, { eager: false, nullable: false })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column()
  itemId: number;

  @ManyToOne(() => Customer, { eager: false, nullable: false })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column()
  customerId: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  productionCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  saleCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  profit: number;

  @Column({ type: 'date' })
  saleDate: string;

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
