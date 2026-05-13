import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import { Admin } from '../../admins/entities/admin.entity';

@Entity('password_reset_otps')
export class PasswordResetOtp extends AbstractEntity {
  @Column({ type: 'uuid', name: 'admin_id' })
  adminId!: Uuid;

  @ManyToOne(() => Admin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin!: Admin;

  @Column({ type: 'varchar', length: 255 })
  otp!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'mobile_no' })
  mobileNo?: string;
}
