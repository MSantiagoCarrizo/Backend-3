import { mock } from 'node:test';
import { expect } from 'chai';
import {
    api,
    assertError,
    createOrder,
    createCustomerAndStore,
    validOrder,
    expectOrder,
    expectUser,
    expectStore,
    NON_EXISTENT_ID,
} from './helpers.js';
import { clearDatabase } from './setup.js';
import { orderRepository } from '../src/repositories/order.repository.js';
import { ORDER_STATUS } from '../src/constants/index.js';

const expectPopulatedOrder = (order, customer, store) => {
    expectOrder({ ...order, customer: customer._id, store: store._id });
    expectUser(order.customer, { _id: customer._id });
    expectStore(order.store, { _id: store._id });
};

const failWith = (method) =>
    mock.method(orderRepository, method, async () => {
        throw new Error('falla inesperada');
    });

describe('Orders', () => {
    beforeEach(clearDatabase);

    describe('GET /api/orders', () => {
        it('responde 200 con la lista de pedidos, con el cliente (sin password) y el comercio completos', async () => {
            const { customer, store, order } = await createOrder();

            const res = await api.get('/api/orders');

            expect(res.status).to.equal(200);
            expect(res.body.status).to.equal('success');
            expect(res.body.payload).to.be.an('array').with.lengthOf(1);
            expectPopulatedOrder(res.body.payload[0], customer, store);
            expect(res.body.payload[0]).to.include({ _id: order._id, total: 3000, status: 'created' });
        });

        it('responde 200 con una lista vacía si no hay pedidos', async () => {
            const res = await api.get('/api/orders');

            expect(res.status).to.equal(200);
            expect(res.body).to.deep.equal({ status: 'success', payload: [] });
        });

        it('responde INTERNAL_SERVER_ERROR si falla el repository', async () => {
            failWith('findAll');

            assertError(await api.get('/api/orders'), 500, 'INTERNAL_SERVER_ERROR');
        });
    });

    describe('POST /api/orders', () => {
        it('responde 201 y crea el pedido en estado created, con prioridad normal y el total calculado', async () => {
            const { customer, store } = await createCustomerAndStore();

            const res = await api.post('/api/orders').send(validOrder(customer._id, store._id));

            expect(res.status).to.equal(201);
            expect(res.body.status).to.equal('success');
            expectOrder(res.body.payload, {
                customer: customer._id,
                store: store._id,
                deliveryAddress: 'Av. Siempre Viva 742',
                total: 3000,
                status: 'created',
                priority: 'normal',
            });
            expect(res.body.payload.items).to.deep.equal([{ name: 'Paquete mediano', quantity: 2, price: 1500 }]);
        });

        it('suma el precio por la cantidad de cada item y respeta la prioridad que se envía', async () => {
            const { customer, store } = await createCustomerAndStore();
            const items = [
                { name: 'Pizza', quantity: 2, price: 100 },
                { name: 'Bebida', quantity: 1, price: 50 },
            ];

            const res = await api.post('/api/orders').send(validOrder(customer._id, store._id, { items, priority: 'high' }));

            expect(res.status).to.equal(201);
            expectOrder(res.body.payload, { total: 250, priority: 'high' });
        });

        it('el pedido creado se puede consultar después', async () => {
            const { customer, store, order } = await createOrder();

            const res = await api.get(`/api/orders/${order._id}`);

            expect(res.status).to.equal(200);
            expectPopulatedOrder(res.body.payload, customer, store);
        });

        it('con datos incompletos responde VALIDATION_ERROR', async () => {
            const res = await api.post('/api/orders').send({ deliveryAddress: 'Av. Siempre Viva 742' });

            assertError(res, 400, 'VALIDATION_ERROR');
        });

        it('con un item sin precio responde VALIDATION_ERROR', async () => {
            const { customer, store } = await createCustomerAndStore();
            const items = [{ name: 'Pizza', quantity: 1 }];

            const res = await api.post('/api/orders').send(validOrder(customer._id, store._id, { items }));

            assertError(res, 400, 'VALIDATION_ERROR');
        });

        it('con la lista de items vacía responde ORDER_ITEMS_REQUIRED', async () => {
            const { customer, store } = await createCustomerAndStore();

            const res = await api.post('/api/orders').send(validOrder(customer._id, store._id, { items: [] }));

            assertError(res, 400, 'ORDER_ITEMS_REQUIRED');
        });

        it('con items que no es una lista responde ORDER_ITEMS_REQUIRED', async () => {
            const { customer, store } = await createCustomerAndStore();

            const res = await api.post('/api/orders').send(validOrder(customer._id, store._id, { items: 'pizza' }));

            assertError(res, 400, 'ORDER_ITEMS_REQUIRED');
        });

        it('con un ID de cliente con formato inválido responde INVALID_ID', async () => {
            const { store } = await createCustomerAndStore();

            const res = await api.post('/api/orders').send(validOrder('abc', store._id));

            assertError(res, 400, 'INVALID_ID');
        });

        it('con un ID de comercio con formato inválido responde INVALID_ID', async () => {
            const { customer } = await createCustomerAndStore();

            const res = await api.post('/api/orders').send(validOrder(customer._id, 'abc'));

            assertError(res, 400, 'INVALID_ID');
        });

        it('con un JSON mal formado responde INVALID_JSON', async () => {
            const res = await api
                .post('/api/orders')
                .set('Content-Type', 'application/json')
                .send('{"customer": ');

            assertError(res, 400, 'INVALID_JSON');
        });

        it('con un cliente que no existe responde USER_NOT_FOUND', async () => {
            const { store } = await createCustomerAndStore();

            const res = await api.post('/api/orders').send(validOrder(NON_EXISTENT_ID, store._id));

            assertError(res, 404, 'USER_NOT_FOUND');
        });

        it('con un comercio que no existe responde STORE_NOT_FOUND', async () => {
            const { customer } = await createCustomerAndStore();

            const res = await api.post('/api/orders').send(validOrder(customer._id, NON_EXISTENT_ID));

            assertError(res, 404, 'STORE_NOT_FOUND');
        });

        it('responde INTERNAL_SERVER_ERROR si falla el repository', async () => {
            const { customer, store } = await createCustomerAndStore();
            failWith('create');

            const res = await api.post('/api/orders').send(validOrder(customer._id, store._id));

            assertError(res, 500, 'INTERNAL_SERVER_ERROR');
        });
    });

    describe('GET /api/orders/:oid', () => {
        it('responde 200 con el pedido, con el cliente (sin password) y el comercio completos', async () => {
            const { customer, store, order } = await createOrder();

            const res = await api.get(`/api/orders/${order._id}`);

            expect(res.status).to.equal(200);
            expect(res.body.status).to.equal('success');
            expectPopulatedOrder(res.body.payload, customer, store);
            expect(res.body.payload).to.include({ _id: order._id, total: 3000, status: 'created' });
        });

        it('con un ID con formato inválido responde INVALID_ID', async () => {
            assertError(await api.get('/api/orders/abc'), 400, 'INVALID_ID');
        });

        it('con un pedido que no existe responde ORDER_NOT_FOUND', async () => {
            assertError(await api.get(`/api/orders/${NON_EXISTENT_ID}`), 404, 'ORDER_NOT_FOUND');
        });

        it('responde INTERNAL_SERVER_ERROR si falla el repository', async () => {
            failWith('findById');

            assertError(await api.get(`/api/orders/${NON_EXISTENT_ID}`), 500, 'INTERNAL_SERVER_ERROR');
        });
    });

    describe('PUT /api/orders/:oid/status', () => {
        it('responde 200 y cambia el estado, sin tocar el resto del pedido', async () => {
            const { customer, store, order } = await createOrder();

            const res = await api.put(`/api/orders/${order._id}/status`).send({ status: 'assigned' });

            expect(res.status).to.equal(200);
            expect(res.body.status).to.equal('success');
            expectOrder(res.body.payload, {
                _id: order._id,
                customer: customer._id,
                store: store._id,
                total: 3000,
                status: 'assigned',
            });
        });

        it('el nuevo estado queda guardado', async () => {
            const { order } = await createOrder();
            await api.put(`/api/orders/${order._id}/status`).send({ status: 'in_transit' });

            const res = await api.get(`/api/orders/${order._id}`);

            expect(res.body.payload.status).to.equal('in_transit');
        });

        for (const status of Object.values(ORDER_STATUS)) {
            it(`acepta el estado ${status}, sin un orden obligatorio`, async () => {
                const { order } = await createOrder();

                const res = await api.put(`/api/orders/${order._id}/status`).send({ status });

                expect(res.status).to.equal(200);
                expect(res.body.payload.status).to.equal(status);
            });
        }

        it('con un estado que no existe responde INVALID_ORDER_STATUS', async () => {
            const { order } = await createOrder();

            const res = await api.put(`/api/orders/${order._id}/status`).send({ status: 'volando' });

            assertError(res, 400, 'INVALID_ORDER_STATUS');
        });

        it('sin enviar el estado responde INVALID_ORDER_STATUS', async () => {
            const { order } = await createOrder();

            const res = await api.put(`/api/orders/${order._id}/status`).send({});

            assertError(res, 400, 'INVALID_ORDER_STATUS');
        });

        it('con un ID con formato inválido responde INVALID_ID', async () => {
            const res = await api.put('/api/orders/abc/status').send({ status: 'assigned' });

            assertError(res, 400, 'INVALID_ID');
        });

        it('con un JSON mal formado responde INVALID_JSON', async () => {
            const { order } = await createOrder();

            const res = await api
                .put(`/api/orders/${order._id}/status`)
                .set('Content-Type', 'application/json')
                .send('{"status": ');

            assertError(res, 400, 'INVALID_JSON');
        });

        it('con un pedido que no existe responde ORDER_NOT_FOUND', async () => {
            const res = await api.put(`/api/orders/${NON_EXISTENT_ID}/status`).send({ status: 'assigned' });

            assertError(res, 404, 'ORDER_NOT_FOUND');
        });

        it('responde INTERNAL_SERVER_ERROR si falla el repository', async () => {
            failWith('updateStatus');

            const res = await api.put(`/api/orders/${NON_EXISTENT_ID}/status`).send({ status: 'assigned' });

            assertError(res, 500, 'INTERNAL_SERVER_ERROR');
        });
    });

    describe('DELETE /api/orders/:oid', () => {
        it('responde 200 con el pedido eliminado y ya no existe', async () => {
            const { customer, store, order } = await createOrder();

            const res = await api.delete(`/api/orders/${order._id}`);

            expect(res.status).to.equal(200);
            expect(res.body.status).to.equal('success');
            expectOrder(res.body.payload, { _id: order._id, customer: customer._id, store: store._id });
            assertError(await api.get(`/api/orders/${order._id}`), 404, 'ORDER_NOT_FOUND');
        });

        it('con un ID con formato inválido responde INVALID_ID', async () => {
            assertError(await api.delete('/api/orders/abc'), 400, 'INVALID_ID');
        });

        it('con un pedido que no existe responde ORDER_NOT_FOUND', async () => {
            assertError(await api.delete(`/api/orders/${NON_EXISTENT_ID}`), 404, 'ORDER_NOT_FOUND');
        });

        it('responde INTERNAL_SERVER_ERROR si falla el repository', async () => {
            failWith('delete');

            assertError(await api.delete(`/api/orders/${NON_EXISTENT_ID}`), 500, 'INTERNAL_SERVER_ERROR');
        });
    });
});