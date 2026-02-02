import { ConflictException } from '@nestjs/common';

export class AdminAlreadyExistsException extends ConflictException {
  constructor(field: 'cidNo' | 'email' | 'mobileNo', value: string) {
    const fieldName =
      field === 'cidNo'
        ? 'CID Number'
        : field === 'email'
          ? 'Email'
          : 'Mobile Number';
    super(`Admin with ${fieldName} '${value}' already exists`);
  }
}
