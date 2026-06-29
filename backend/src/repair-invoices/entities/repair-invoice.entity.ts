import { Customer } from '@/customers/entities/customer.entity';
import { User } from '@/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RepairInvoiceItem } from './repair-invoice-item.entity';

@Entity()
export class RepairInvoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20, unique: true })
  invoiceNumber: string;

  @ManyToOne(() => Customer, { eager: false, nullable: false })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column()
  customerId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  serialNumber: string | null;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  laborCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'boolean' })
  isCharged: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @ManyToOne(() => User, { eager: false, nullable: false })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: number;

  @OneToMany(() => RepairInvoiceItem, (item) => item.invoice, { cascade: true })
  items: RepairInvoiceItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
