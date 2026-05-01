import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import {
  OfficeLocationCreatedEvent,
  OfficeLocationDeletedEvent,
  OfficeLocationUpdatedEvent,
} from './events';
import { OfficeLocationService } from './office-location.service';

@Controller()
export class OfficeLocationNatsController {
  private readonly logger = new Logger(OfficeLocationNatsController.name);

  constructor(private readonly officeLocationService: OfficeLocationService) {}

  @EventPattern('office_location.sync_to_auth.created')
  async handleSyncFromCommonService(
    @Payload() event: OfficeLocationCreatedEvent,
  ): Promise<void> {
    this.logger.log(`Received sync from common_service - CREATE: ${event.id}`);

    try {
      await this.officeLocationService.handleSyncFromCommonService(event);
      this.logger.log(
        `Successfully synced office location from common_service: ${event.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error syncing office location from common_service: ${event.id}`,
        error,
      );
      throw error;
    }
  }

  @EventPattern('office_location.sync_to_auth.updated')
  async handleSyncUpdateFromCommonService(
    @Payload() event: OfficeLocationUpdatedEvent,
  ): Promise<void> {
    this.logger.log(`Received sync from common_service - UPDATE: ${event.id}`);

    try {
      await this.officeLocationService.handleSyncUpdateFromCommonService(event);
      this.logger.log(
        `Successfully synced office location update from common_service: ${event.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error syncing office location update from common_service: ${event.id}`,
        error,
      );
      throw error;
    }
  }

  @EventPattern('office_location.sync_to_auth.deleted')
  async handleSyncDeleteFromCommonService(
    @Payload() event: OfficeLocationDeletedEvent,
  ): Promise<void> {
    this.logger.log(`Received sync from common_service - DELETE: ${event.id}`);

    try {
      await this.officeLocationService.handleSyncDeleteFromCommonService(event);
      this.logger.log(
        `Successfully synced office location deletion from common_service: ${event.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error syncing office location deletion from common_service: ${event.id}`,
        error,
      );
      throw error;
    }
  }
}
