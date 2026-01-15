import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { registerDecorator, ValidatorConstraint } from 'class-validator';
import type {
  ValidationOptions,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Repository } from 'typeorm';
import { Admin } from '../modules/admin/entities/admin.entity';

@ValidatorConstraint({ async: true })
@Injectable()
export class UniqueCidConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async validate(cidNo: string): Promise<boolean> {
    if (!cidNo || !this.adminRepository) {
      return true; // Skip validation if no value or repository not available
    }

    try {
      const existingAdmin = await this.adminRepository.findOne({
        where: { cidNo },
      });
      return !existingAdmin; // Return false if admin exists (validation fails)
    } catch (error) {
      console.error('Error in UniqueCidConstraint:', error);
      return true; // Allow validation to pass if there's an error
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return `Admin with CID "${args.value}" already exists`;
  }
}

export function UniqueCid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: UniqueCidConstraint,
    });
  };
}
