export const OFFICE_LOCATION_EVENTS = {
  CREATED: 'office_location.created',
  UPDATED: 'office_location.updated',
  DELETED: 'office_location.deleted',
} as const;

export const OFFICE_LOCATION_SYNC_EVENTS = {
  SYNC_TO_AUTH: 'office_location.sync_to_auth.created',
  SYNC_UPDATE_TO_AUTH: 'office_location.sync_to_auth.updated',
  SYNC_DELETE_TO_AUTH: 'office_location.sync_to_auth.deleted',
} as const;
