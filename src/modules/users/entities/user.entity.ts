import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Account } from './account.entity';
import { UserRole } from './user-role.enum';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { TwoFactor } from '../../auth/entities/two-factor.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', unique: true })
  email!: string;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'text', nullable: true })
  image!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'text', unique: true, nullable: true })
  username!: string | null;

  @Column({ name: 'display_username', type: 'text', nullable: true })
  displayUsername!: string | null;

  @Column({
    name: 'two_factor_enabled',
    type: 'boolean',
    default: false,
    nullable: true,
  })
  twoFactorEnabled!: boolean | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ type: 'boolean', default: false, nullable: true })
  banned!: boolean | null;

  @Column({ name: 'ban_reason', type: 'text', nullable: true })
  banReason!: string | null;

  @Column({ name: 'ban_expires', type: 'timestamptz', nullable: true })
  banExpires!: Date | null;

  @OneToMany(() => Account, (account) => account.user)
  accounts!: Account[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens!: RefreshToken[];

  @OneToMany(() => TwoFactor, (twoFactor) => twoFactor.user)
  twoFactors!: TwoFactor[];
}
