import { Exclude } from 'class-transformer';
import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';

@Entity('users')
export class User extends AbstractEntity {
  @Column({
    type: 'varchar',
    length: 20,
    default: 'CITIZEN',
    name: 'role_type',
  })
  roleType!: string;

  @Column({ type: 'varchar', length: 20, unique: true, name: 'cid_no' })
  cidNo!: string;

  @Column({ type: 'varchar', nullable: true, name: 'password' })
  @Exclude({ toPlainOnly: true })
  password?: string;
}

// Export alias for backward compatibility
export { User as UserEntity };
