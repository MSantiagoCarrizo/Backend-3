import { deliveryRepository } from '../repositories/delivery.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { DELIVERY_STATUS, DELIVERY_PRIORITY, USER_ROLES } from '../constants/index.js';
import { createError } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../utils/errorDictionary.js';

export const deliveryService = {
  getDeliveries: async () => {
    return deliveryRepository.findAll();
  },

  getDeliveryById: async (id) => {
    const delivery = await deliveryRepository.findById(id);
    if (!delivery) {
      throw createError(ERROR_CODES.DELIVERY_NOT_FOUND);
    }
    return delivery;
  },

  createDelivery: async (deliveryData) => {
    const { order, driver, priority, notes } = deliveryData;

    if (!order || !driver) {
      throw createError(ERROR_CODES.VALIDATION_ERROR);
    }

    const orderFound = await orderRepository.findById(order);
    if (!orderFound) {
      throw createError(ERROR_CODES.ORDER_NOT_FOUND);
    }

    const driverFound = await userRepository.findById(driver);
    if (!driverFound) {
      throw createError(ERROR_CODES.DRIVER_NOT_FOUND);
    }

    if (driverFound.role !== USER_ROLES.DRIVER) {
      throw createError(ERROR_CODES.INVALID_DRIVER_ROLE);
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
    if (!Object.values(DELIVERY_STATUS).includes(status)) {
      throw createError(ERROR_CODES.INVALID_DELIVERY_STATUS);
    }

    const delivery = await deliveryRepository.updateStatus(id, status);
    if (!delivery) {
      throw createError(ERROR_CODES.DELIVERY_NOT_FOUND);
    }
    return delivery;
  },

  deleteDelivery: async (id) => {
    const delivery = await deliveryRepository.delete(id);
    if (!delivery) {
      throw createError(ERROR_CODES.DELIVERY_NOT_FOUND);
    }
    return delivery;
  },
};