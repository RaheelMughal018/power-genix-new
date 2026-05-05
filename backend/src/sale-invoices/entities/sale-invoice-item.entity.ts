import { Item } from '@/items/entities/item.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SaleInvoice } from './sale-invoice.entity';

@Entity()
export class SaleInvoiceItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SaleInvoice, (invoice) => invoice.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice: SaleInvoice;

  @Column()
  invoiceId: number;

  @ManyToOne(() => Item, { eager: false, nullable: false })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column()
  itemId: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalPrice: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  serialNumber: string | null;
}
