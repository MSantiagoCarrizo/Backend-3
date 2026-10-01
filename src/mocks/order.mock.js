import { ORDER_STATUS, DELIVERY_PRIORITY } from '../constants/index.js';

export const generateMockOrder = (customerId, storeId, index) => {
  const items = [{ name: `Producto de prueba ${index}`, quantity: 1, price: 1000 }];
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return {
    customer: customerId,
    store: storeId,
    items,
    deliveryAddress: `Av. Siempre Viva ${100 + index}`,
    total,
    status: ORDER_STATUS.CREATED,
    priority: DELIVERY_PRIORITY.NORMAL,
  };
};

export const generateMockOrders = (customerIds, storeIds, quantity) => {
  const orders = [];
  for (let i = 0; i < quantity; i++) {
    const customerId = customerIds[i % customerIds.length];
    const storeId = storeIds[i % storeIds.length];
    orders.push(generateMockOrder(customerId, storeId, i + 1));
  }
  return orders;
};