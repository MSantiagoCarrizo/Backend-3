export const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  STORE: 'store',
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