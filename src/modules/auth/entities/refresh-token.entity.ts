import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

// Reemplaza a la tabla "session" de BetterAuth (decisión: JWT HS256,
// ver roadmap/decisiones.md). Nunca se guarda el token en claro:
// token_hash es el SHA-256 del refresh token emitido.
@Entity('refresh_token')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'token_hash', type: 'text', unique: true })
  tokenHash!: string;

  @Index('refreshToken_userId_idx')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  // Rotación (1.4): al rotar, este token queda revocado y apunta
  // al id del token que lo reemplazó (cadena para detectar reuso).
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({ name: 'replaced_by', type: 'uuid', nullable: true })
  replacedBy!: string | null;

  @Column({ name: 'ip_address', type: 'text', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
