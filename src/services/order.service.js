import { orderRepository } from '../repositories/order.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { storeRepository } from '../repositories/store.repository.js';
import { ORDER_STATUS, DELIVERY_PRIORITY } from '../constants/index.js';

export const orderService = {
  getOrders: async () => {
    return orderRepository.findAll();
  },

  getOrderById: async (id) => {
    const order = await orderRepository.findById(id);

    if (!order) {
      const error = new Error('Pedido no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return order;
  },

  createOrder: async (orderData) => {
    const { customer, store, items, deliveryAddress, priority } = orderData;

    if (!customer || !store || !items || !deliveryAddress) {
      const error = new Error('Faltan datos obligatorios');
      error.statusCode = 400;
      throw error;
    }

    const userFound = await userRepository.findById(customer);
    if (!userFound) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    const storeFound = await storeRepository.findById(store);
    if (!storeFound) {
      const error = new Error('Comercio no encontrado');
      error.statusCode = 404;
      throw error;
    }

    const total = items.reduce((accumulator, item) => accumulator + item.price * item.quantity, 0);

    const newOrder = {
      ...orderData,
      total,
      status: ORDER_STATUS.CREATED,
      priority: priority ? priority : DELIVERY_PRIORITY.NORMAL,
    };

    return orderRepository.create(newOrder);
  },

  updateOrderStatus: async (id, status) => {
    const order = await orderRepository.updateStatus(id, status);
    if (!order) {
      const error = new Error('Pedido no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return order;
  },

  deleteOrder: async (id) => {
    const order = await orderRepository.delete(id);
    if (!order) {
      const error = new Error('Pedido no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return order;
  },
};
