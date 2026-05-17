import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';

@Entity('otps')
export class Otp extends AbstractEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: Uuid;

  @Column({ type: 'varchar', length: 20, name: 'user_type' })
  userType!: 'admin' | 'staff';

  @Column({ type: 'varchar', length: 255 })
  otp!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;
}
