import { deliveryRepository } from '../repositories/delivery.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { DELIVERY_STATUS, DELIVERY_PRIORITY, USER_ROLES } from '../constants/index.js';

export const deliveryService = {
  getDeliveries: async () => {
    return deliveryRepository.findAll();
  },

  getDeliveryById: async (id) => {
    const delivery = await deliveryRepository.findById(id);
    if (!delivery) {
      const error = new Error('Entrega no encontrada');
      error.statusCode = 404;
      throw error;
    }
    return delivery;
  },

  createDelivery: async (deliveryData) => {
    const { order, driver, priority, notes } = deliveryData;

    if (!order || !driver) {
      const error = new Error('Faltan datos obligatorios');
      error.statusCode = 400;
      throw error;
    }

    const orderFound = await orderRepository.findById(order);
    if (!orderFound) {
      const error = new Error('Pedido no encontrado');
      error.statusCode = 404;
      throw error;
    }

    const driverFound = await userRepository.findById(driver);
    if (!driverFound) {
      const error = new Error('Repartidor no encontrado');
      error.statusCode = 404;
      throw error;
    }

    if (driverFound.role !== USER_ROLES.DRIVER) {
      const error = new Error('El usuario indicado no tiene el rol de repartidor');
      error.statusCode = 400;
      throw error;
    }

    const newDelivery = {
      order,
      driver,
      notes,
      status: DELIVERY_STATUS.ASSIGNED,
      priority: priority ? priority : DELIVERY_PRIORITY.NORMAL,
    };

    return deliveryRepository.create(newDelivery);
  },

  updateDeliveryStatus: async (id, status) => {
    const delivery = await deliveryRepository.updateStatus(id, status);
    if (!delivery) {
      const error = new Error('Entrega no encontrada');
      error.statusCode = 404;
      throw error;
    }
    return delivery;
  },

  deleteDelivery: async (id) => {
    const delivery = await deliveryRepository.delete(id);
    if (!delivery) {
      const error = new Error('Entrega no encontrada');
      error.statusCode = 404;
      throw error;
    }
    return delivery;
  },
};