import { DELIVERY_STATUS, DELIVERY_PRIORITY } from '../constants/index.js';

export const generateMockDelivery = (orderId, driverId, index) => ({
    order: orderId,
    driver: driverId,
    status: DELIVERY_STATUS.ASSIGNED,
    priority: DELIVERY_PRIORITY.NORMAL,
    notes: `Entrega de prueba ${index}`,
});

export const generateMockDeliveries = (orders, drivers, quantity) => {
    const deliveries = [];
    for (let i = 0; i < quantity; i++) {
        const order = orders[i % orders.length];
        const driver = drivers[i % drivers.length];
        deliveries.push(generateMockDelivery(order._id, driver._id, i + 1));
    }
    return deliveries;
};