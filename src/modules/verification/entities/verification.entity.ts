import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('verification')
export class Verification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('verification_identifier_idx')
  @Column({ type: 'text' })
  identifier!: string;

  @Column({ type: 'text' })
  value!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
