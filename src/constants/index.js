export const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  STORE: 'store',
  DRIVER: 'driver',
});

export const ORDER_STATUS = Object.freeze({
  CREATED: 'created',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
});

export const DELIVERY_PRIORITY = Object.freeze({
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
});

export const DELIVERY_STATUS = Object.freeze({
  ASSIGNED: 'assigned',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
});

export const MOCK_MAX_QUANTITY = 1000;

export const DOCUMENT_TYPES = Object.freeze({
  USER_DOCUMENT: 'user_document',
  DRIVER_LICENSE: 'driver_license',
  DELIVERY_PROOF: 'delivery_proof',
});

export const USER_DOCUMENT_TYPES = Object.freeze([
  DOCUMENT_TYPES.USER_DOCUMENT,
  DOCUMENT_TYPES.DRIVER_LICENSE,
]);

export const UPLOAD_FOLDERS = Object.freeze({
  DOCUMENTS: 'uploads/documents',
  PROOFS: 'uploads/proofs',
});

export const ALLOWED_FILE_TYPES = Object.freeze({
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
});

export const MAX_FILE_SIZE = 5 * 1024 * 1024;