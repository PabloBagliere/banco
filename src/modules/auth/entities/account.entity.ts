import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('account')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'account_id', type: 'text' })
  accountId!: string;

  @Column({ name: 'provider_id', type: 'text' })
  providerId!: string;

  @Index('account_userId_idx')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'access_token', type: 'text', nullable: true })
  accessToken!: string | null;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken!: string | null;

  @Column({ name: 'id_token', type: 'text', nullable: true })
  idToken!: string | null;

  @Column({
    name: 'access_token_expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  accessTokenExpiresAt!: Date | null;

  @Column({
    name: 'refresh_token_expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  refreshTokenExpiresAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  scope!: string | null;

  @Column({ type: 'text', nullable: true })
  password!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
