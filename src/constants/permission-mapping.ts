export const PERMISSION_MAPPING: Record<string, string[]> = {
  'manage': ['create', 'read', 'update', 'delete'],
  'manage-users': ['create', 'read', 'update', 'delete', 'verify', 'approve'],
  // Add more composite permissions here as needed
};
