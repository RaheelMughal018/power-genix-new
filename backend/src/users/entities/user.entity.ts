import { Auth } from '@/auths/entities/auth.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserType } from '../enums/user-type.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Auth, (auth) => auth.user)
  auth: Auth;

  @Column({ type: 'varchar', nullable: true, length: 90 })
  firstName: string;

  @Column({ type: 'varchar', nullable: true, length: 90 })
  lastName: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'enum', enum: UserType, nullable: false })
  type: UserType;

  // Business Settings
  @Column({ type: 'varchar', nullable: true, length: 150 })
  companyName: string;

  @Column({ type: 'varchar', nullable: true })
  companyLogo: string;

  @Column({ type: 'text', nullable: true })
  companyAddress: string;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  companyPhone: string;

  @Column({ type: 'varchar', nullable: true, length: 10, default: 'LEH' })
  serialPrefix: string;

  @Column({ type: 'int', nullable: true, default: 7 })
  fiscalYearStart: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
