import mongoose from 'mongoose';
import { generateMockUsers, generateMockDrivers } from '../mocks/user.mock.js';
import { generateMockOrders } from '../mocks/order.mock.js';
import { generateMockDeliveries } from '../mocks/delivery.mock.js';
import { userRepository } from '../repositories/user.repository.js';
import { storeRepository } from '../repositories/store.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { deliveryRepository } from '../repositories/delivery.repository.js';
import { createError } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../utils/errorDictionary.js';
import { MOCK_MAX_QUANTITY } from '../constants/index.js';

const DEFAULT_QUANTITY = 10;

const parseAmount = (value, defaultValue, min) => {
    if (value === undefined) {
        return defaultValue;
    }

    const isNumeric = typeof value === 'number' || typeof value === 'string';
    const amount = isNumeric && String(value).trim() !== '' ? Number(value) : NaN;

    if (!Number.isInteger(amount) || amount < min) {
        throw createError(ERROR_CODES.INVALID_MOCK_AMOUNT);
    }

    if (amount > MOCK_MAX_QUANTITY) {
        throw createError(ERROR_CODES.MOCK_AMOUNT_TOO_LARGE);
    }

    return amount;
};

const insertOrFail = async (repository, data) => {
    try {
        return await repository.insertMany(data);
    } catch (error) {
        console.error(error);
        throw createError(ERROR_CODES.MOCK_GENERATION_ERROR);
    }
};

export const mocksService = {
    getMockUsers: (qty) => {
        const quantity = parseAmount(qty, DEFAULT_QUANTITY, 1);
        return generateMockUsers(quantity);
    },

    getMockOrders: (qty) => {
        const quantity = parseAmount(qty, DEFAULT_QUANTITY, 1);
        const fakeCustomerIds = Array.from({ length: quantity }, () => new mongoose.Types.ObjectId());
        const fakeStoreIds = Array.from({ length: quantity }, () => new mongoose.Types.ObjectId());
        return generateMockOrders(fakeCustomerIds, fakeStoreIds, quantity);
    },

    generateData: async (data) => {
        const users = parseAmount(data.users, 0, 0);
        const drivers = parseAmount(data.drivers, 0, 0);
        const orders = parseAmount(data.orders, 0, 0);
        const deliveries = parseAmount(data.deliveries, 0, 0);

        if (users + drivers + orders + deliveries === 0) {
            throw createError(ERROR_CODES.INVALID_MOCK_AMOUNT);
        }

        const result = { users: 0, drivers: 0, orders: 0, deliveries: 0 };

        let createdUsers = [];
        if (users > 0) {
            createdUsers = await insertOrFail(userRepository, generateMockUsers(users));
            result.users = createdUsers.length;
        }

        let createdDrivers = [];
        if (drivers > 0) {
            createdDrivers = await insertOrFail(userRepository, generateMockDrivers(drivers));
            result.drivers = createdDrivers.length;
        }

        let createdOrders = [];
        if (orders > 0) {
            if (createdUsers.length === 0) {
                throw createError(ERROR_CODES.MOCK_USERS_REQUIRED);
            }

            const existingStores = await storeRepository.findAll();
            if (existingStores.length === 0) {
                throw createError(ERROR_CODES.NO_STORES_AVAILABLE);
            }

            const customerIds = createdUsers.map((user) => user._id);
            const storeIds = existingStores.map((store) => store._id);
            createdOrders = await insertOrFail(orderRepository, generateMockOrders(customerIds, storeIds, orders));
            result.orders = createdOrders.length;
        }

        if (deliveries > 0) {
            if (createdOrders.length === 0 || createdDrivers.length === 0) {
                throw createError(ERROR_CODES.MOCK_DELIVERIES_REQUIRED);
            }

            const createdDeliveries = await insertOrFail(deliveryRepository, generateMockDeliveries(createdOrders, createdDrivers, deliveries));
            result.deliveries = createdDeliveries.length;
        }

        return result;
    },
};