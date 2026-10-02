import mongoose from 'mongoose';
import { generateMockUsers, generateMockDrivers } from '../mocks/user.mock.js';
import { generateMockOrders } from '../mocks/order.mock.js';
import { generateMockDeliveries } from '../mocks/delivery.mock.js';
import { userRepository } from '../repositories/user.repository.js';
import { storeRepository } from '../repositories/store.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { deliveryRepository } from '../repositories/delivery.repository.js';

export const mocksService = {
    getMockUsers: (quantity) => {
        return generateMockUsers(quantity);
    },

    getMockOrders: (quantity) => {
        const fakeCustomerIds = Array.from({ length: quantity }, () => new mongoose.Types.ObjectId());
        const fakeStoreIds = Array.from({ length: quantity }, () => new mongoose.Types.ObjectId());
        return generateMockOrders(fakeCustomerIds, fakeStoreIds, quantity);
    },

    generateData: async ({ users = 0, drivers = 0, orders = 0, deliveries = 0 }) => {
        const result = { users: 0, drivers: 0, orders: 0, deliveries: 0 };

        let createdUsers = [];
        if (users > 0) {
            createdUsers = await userRepository.insertMany(generateMockUsers(users));
            result.users = createdUsers.length;
        }

        let createdDrivers = [];
        if (drivers > 0) {
            createdDrivers = await userRepository.insertMany(generateMockDrivers(drivers));
            result.drivers = createdDrivers.length;
        }

        let createdOrders = [];
        if (orders > 0) {
            if (createdUsers.length === 0) {
                const error = new Error('Faltan usuarios para generar pedidos');
                error.statusCode = 400;
                throw error;
            }

            const existingStores = await storeRepository.findAll();
            if (existingStores.length === 0) {
                const error = new Error('No hay comercios registrados');
                error.statusCode = 400;
                throw error;
            }

            const customerIds = createdUsers.map((user) => user._id);
            const storeIds = existingStores.map((store) => store._id);
            createdOrders = await orderRepository.insertMany(generateMockOrders(customerIds, storeIds, orders));
            result.orders = createdOrders.length;
        }

        if (deliveries > 0) {
            if (createdOrders.length === 0 || createdDrivers.length === 0) {
                const error = new Error('Faltan pedidos y repartidores para generar entregas');
                error.statusCode = 400;
                throw error;
            }

            const createdDeliveries = await deliveryRepository.insertMany(generateMockDeliveries(createdOrders, createdDrivers, deliveries));
            result.deliveries = createdDeliveries.length;
        }

        return result;
    },
};