import { orderRepository } from '../repositories/order.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { storeRepository } from '../repositories/store.repository.js';
import { ORDER_STATUS, DELIVERY_PRIORITY } from '../constants/index.js';
import { createError } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../utils/errorDictionary.js';

export const orderService = {
  getOrders: async () => {
    return orderRepository.findAll();
  },

  getOrderById: async (id) => {
    const order = await orderRepository.findById(id);

    if (!order) {
      throw createError(ERROR_CODES.ORDER_NOT_FOUND);
    }

    return order;
  },

  createOrder: async (orderData) => {
    const { customer, store, items, deliveryAddress, priority } = orderData;

    if (!customer || !store || !items || !deliveryAddress) {
      throw createError(ERROR_CODES.VALIDATION_ERROR);
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw createError(ERROR_CODES.ORDER_ITEMS_REQUIRED);
    }

    const userFound = await userRepository.findById(customer);
    if (!userFound) {
      throw createError(ERROR_CODES.USER_NOT_FOUND);
    }

    const storeFound = await storeRepository.findById(store);
    if (!storeFound) {
      throw createError(ERROR_CODES.STORE_NOT_FOUND);
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
    if (!Object.values(ORDER_STATUS).includes(status)) {
      throw createError(ERROR_CODES.INVALID_ORDER_STATUS);
    }

    const order = await orderRepository.updateStatus(id, status);
    if (!order) {
      throw createError(ERROR_CODES.ORDER_NOT_FOUND);
    }

    return order;
  },

  deleteOrder: async (id) => {
    const order = await orderRepository.delete(id);
    if (!order) {
      throw createError(ERROR_CODES.ORDER_NOT_FOUND);
    }

    return order;
  },
};