import { Item } from '@/items/entities/item.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RepairInvoice } from './repair-invoice.entity';

@Entity()
export class RepairInvoiceItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => RepairInvoice, (invoice) => invoice.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice: RepairInvoice;

  @Column()
  invoiceId: number;

  @ManyToOne(() => Item, { eager: false, nullable: true })
  @JoinColumn({ name: 'itemId' })
  item: Item | null;

  @Column({ nullable: true })
  itemId: number | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  customItemName: string | null;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ type: 'boolean', default: true })
  isReal: boolean;
}
