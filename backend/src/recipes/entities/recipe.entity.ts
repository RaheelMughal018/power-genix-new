import { Item } from '@/items/entities/item.entity';
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
import { RecipeItem } from './recipe-item.entity';

@Entity()
export class Recipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @ManyToOne(() => Item, { eager: false, nullable: false })
  @JoinColumn({ name: 'finalProductId' })
  finalProduct: Item;

  @Column({ unique: true })
  finalProductId: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  additionalExpense: number;

  @OneToMany(() => RecipeItem, (recipeItem) => recipeItem.recipe, {
    cascade: true,
  })
  recipeItems: RecipeItem[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
