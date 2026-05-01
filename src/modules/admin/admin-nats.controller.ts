import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { AdminService } from './admin.service';

@Controller()
export class AdminNatsController {
  constructor(private readonly adminService: AdminService) {}

  @MessagePattern('admin.find_by_office_location')
  async findByOfficeLocation(@Payload() officeLocationId: string) {
    return this.adminService.findByOfficeLocationId(officeLocationId);
  }
}
