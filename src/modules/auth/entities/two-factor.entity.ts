import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('two_factor')
export class TwoFactor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('twoFactor_secret_idx')
  @Column({ type: 'text' })
  secret!: string;

  @Column({ name: 'backup_codes', type: 'text' })
  backupCodes!: string;

  @Index('twoFactor_userId_idx')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'boolean', default: true, nullable: true })
  verified!: boolean | null;

  @ManyToOne(() => User, (user) => user.twoFactors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
