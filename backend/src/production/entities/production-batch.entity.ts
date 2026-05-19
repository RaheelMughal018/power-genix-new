import { Account } from '@/accounts/entities/account.entity';
import { Recipe } from '@/recipes/entities/recipe.entity';
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
import { ProductionStatus } from '../enums/production-status.enum';
import { ProductionUnit } from './production-unit.entity';

@Entity()
export class ProductionBatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  batchNumber: string;

  @ManyToOne(() => Recipe, { eager: false, nullable: false })
  @JoinColumn({ name: 'recipeId' })
  recipe: Recipe;

  @Column()
  recipeId: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'date' })
  productionDate: string;

  @Column({ type: 'enum', enum: ProductionStatus, default: ProductionStatus.PENDING })
  status: ProductionStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  copperAmount: number;

  @ManyToOne(() => Account, { eager: false, nullable: true })
  @JoinColumn({ name: 'copperAccountId' })
  copperAccount: Account | null;

  @Column({ nullable: true })
  copperAccountId: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalCost: number;

  @OneToMany(() => ProductionUnit, (unit) => unit.batch, { cascade: true })
  units: ProductionUnit[];

  @ManyToOne(() => User)
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
