import { mock } from 'node:test';
import { api, assertError } from './helpers.js';
import { userRepository } from '../src/repositories/user.repository.js';
import { storeRepository } from '../src/repositories/store.repository.js';
import { orderRepository } from '../src/repositories/order.repository.js';

const ID = '64b000000000000000000000';

const notFound = (repository) => mock.method(repository, 'findById', async () => null);

describe('Recurso que no existe', () => {
    it('GET /api/users/:id responde USER_NOT_FOUND', async () => {
        notFound(userRepository);

        assertError(await api.get(`/api/users/${ID}`), 404, 'USER_NOT_FOUND');
    });

    it('GET /api/stores/:id responde STORE_NOT_FOUND', async () => {
        notFound(storeRepository);

        assertError(await api.get(`/api/stores/${ID}`), 404, 'STORE_NOT_FOUND');
    });
});

describe('Pedidos', () => {
    const validOrder = {
        customer: ID,
        store: ID,
        items: [{ name: 'Pizza', price: 100, quantity: 1 }],
        deliveryAddress: 'Calle 123',
    };

    it('estado inexistente responde INVALID_ORDER_STATUS', async () => {
        const res = await api.put(`/api/orders/${ID}/status`).send({ status: 'volando' });

        assertError(res, 400, 'INVALID_ORDER_STATUS');
    });

    it('sin productos responde ORDER_ITEMS_REQUIRED', async () => {
        const res = await api.post('/api/orders').send({ ...validOrder, items: [] });

        assertError(res, 400, 'ORDER_ITEMS_REQUIRED');
    });

    it('con un customer que no existe responde USER_NOT_FOUND', async () => {
        notFound(userRepository);

        assertError(await api.post('/api/orders').send(validOrder), 404, 'USER_NOT_FOUND');
    });
});

describe('Entregas', () => {
    const validDelivery = { order: ID, driver: ID };

    it('estado inexistente responde INVALID_DELIVERY_STATUS', async () => {
        const res = await api.put(`/api/deliveries/${ID}/status`).send({ status: 'picked_up' });

        assertError(res, 400, 'INVALID_DELIVERY_STATUS');
    });

    it('con un driver que no existe responde DRIVER_NOT_FOUND', async () => {
        mock.method(orderRepository, 'findById', async () => ({ _id: ID }));
        notFound(userRepository);

        assertError(await api.post('/api/deliveries').send(validDelivery), 404, 'DRIVER_NOT_FOUND');
    });

    it('con un driver que no tiene role "driver" responde INVALID_DRIVER_ROLE', async () => {
        mock.method(orderRepository, 'findById', async () => ({ _id: ID }));
        mock.method(userRepository, 'findById', async () => ({ _id: ID, role: 'customer' }));

        assertError(await api.post('/api/deliveries').send(validDelivery), 400, 'INVALID_DRIVER_ROLE');
    });
});