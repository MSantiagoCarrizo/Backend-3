import { mock } from 'node:test';
import { expect } from 'chai';
import {
    api,
    assertError,
    createDelivery,
    createDriver,
    createOrder,
    createOrderAndDriver,
    validDelivery,
    expectDelivery,
    expectOrder,
    expectUser,
    NON_EXISTENT_ID,
} from './helpers.js';
import { clearDatabase } from './setup.js';
import { deliveryRepository } from '../src/repositories/delivery.repository.js';
import { DELIVERY_STATUS } from '../src/constants/index.js';

const expectPopulatedDelivery = (delivery, order, driver) => {
    expectDelivery({ ...delivery, order: order._id, driver: driver._id });
    expectOrder(delivery.order, { _id: order._id, customer: order.customer, store: order.store });
    expectUser(delivery.driver, { _id: driver._id });
};

const failWith = (method) =>
    mock.method(deliveryRepository, method, async () => {
        throw new Error('falla inesperada');
    });

describe('Deliveries', () => {
    beforeEach(clearDatabase);

    describe('GET /api/deliveries', () => {
        it('responde 200 con la lista de entregas, con el pedido y el repartidor (sin password) completos', async () => {
            const { order, driver, delivery } = await createDelivery();

            const res = await api.get('/api/deliveries');

            expect(res.status).to.equal(200);
            expect(res.body.status).to.equal('success');
            expect(res.body.payload).to.be.an('array').with.lengthOf(1);
            expectPopulatedDelivery(res.body.payload[0], order, driver);
            expect(res.body.payload[0]).to.include({ _id: delivery._id, status: 'assigned' });
        });

        it('responde 200 con una lista vacía si no hay entregas', async () => {
            const res = await api.get('/api/deliveries');

            expect(res.status).to.equal(200);
            expect(res.body).to.deep.equal({ status: 'success', payload: [] });
        });

        it('responde INTERNAL_SERVER_ERROR si falla el repository', async () => {
            failWith('findAll');

            assertError(await api.get('/api/deliveries'), 500, 'INTERNAL_SERVER_ERROR');
        });
    });

    describe('POST /api/deliveries', () => {
        it('responde 201 y crea la entrega en estado assigned, con prioridad normal y sin notas', async () => {
            const { order, driver } = await createOrderAndDriver();

            const res = await api.post('/api/deliveries').send(validDelivery(order._id, driver._id));

            expect(res.status).to.equal(201);
            expect(res.body.status).to.equal('success');
            expectDelivery(res.body.payload, {
                order: order._id,
                driver: driver._id,
                status: 'assigned',
                priority: 'normal',
                notes: null,
            });
        });

        it('respeta la prioridad y las notas que se envían', async () => {
            const { order, driver } = await createOrderAndDriver();
            const deliveryData = { priority: 'high', notes: 'Tocar el timbre dos veces' };

            const res = await api.post('/api/deliveries').send(validDelivery(order._id, driver._id, deliveryData));

            expect(res.status).to.equal(201);
            expectDelivery(res.body.payload, deliveryData);
        });

        it('la entrega creada se puede consultar después', async () => {
            const { order, driver, delivery } = await createDelivery();

            const res = await api.get(`/api/deliveries/${delivery._id}`);

            expect(res.status).to.equal(200);
            expectPopulatedDelivery(res.body.payload, order, driver);
        });

        it('con datos incompletos responde VALIDATION_ERROR', async () => {
            const res = await api.post('/api/deliveries').send({});

            assertError(res, 400, 'VALIDATION_ERROR');
        });

        it('con una prioridad que no existe responde VALIDATION_ERROR', async () => {
            const { order, driver } = await createOrderAndDriver();

            const res = await api
                .post('/api/deliveries')
                .send(validDelivery(order._id, driver._id, { priority: 'urgente' }));

            assertError(res, 400, 'VALIDATION_ERROR');
        });

        it('con un ID de pedido con formato inválido responde INVALID_ID', async () => {
            const driver = await createDriver();

            const res = await api.post('/api/deliveries').send(validDelivery('abc', driver._id));

            assertError(res, 400, 'INVALID_ID');
        });

        it('con un ID de repartidor con formato inválido responde INVALID_ID', async () => {
            const { order } = await createOrder();

            const res = await api.post('/api/deliveries').send(validDelivery(order._id, 'abc'));

            assertError(res, 400, 'INVALID_ID');
        });

        it('con un usuario que no es repartidor responde INVALID_DRIVER_ROLE', async () => {
            const { customer, order } = await createOrder();

            const res = await api.post('/api/deliveries').send(validDelivery(order._id, customer._id));

            assertError(res, 400, 'INVALID_DRIVER_ROLE');
        });

        it('con un JSON mal formado responde INVALID_JSON', async () => {
            const res = await api
                .post('/api/deliveries')
                .set('Content-Type', 'application/json')
                .send('{"order": ');

            assertError(res, 400, 'INVALID_JSON');
        });

        it('con un pedido que no existe responde ORDER_NOT_FOUND', async () => {
            const driver = await createDriver();

            const res = await api.post('/api/deliveries').send(validDelivery(NON_EXISTENT_ID, driver._id));

            assertError(res, 404, 'ORDER_NOT_FOUND');
        });

        it('con un repartidor que no existe responde DRIVER_NOT_FOUND', async () => {
            const { order } = await createOrder();

            const res = await api.post('/api/deliveries').send(validDelivery(order._id, NON_EXISTENT_ID));

            assertError(res, 404, 'DRIVER_NOT_FOUND');
        });

        it('responde INTERNAL_SERVER_ERROR si falla el repository', async () => {
            const { order, driver } = await createOrderAndDriver();
            failWith('create');

            const res = await api.post('/api/deliveries').send(validDelivery(order._id, driver._id));

            assertError(res, 500, 'INTERNAL_SERVER_ERROR');
        });
    });

    describe('GET /api/deliveries/:did', () => {
        it('responde 200 con la entrega, con el pedido y el repartidor (sin password) completos', async () => {
            const { order, driver, delivery } = await createDelivery();

            const res = await api.get(`/api/deliveries/${delivery._id}`);

            expect(res.status).to.equal(200);
            expect(res.body.status).to.equal('success');
            expectPopulatedDelivery(res.body.payload, order, driver);
            expect(res.body.payload).to.include({ _id: delivery._id, status: 'assigned' });
        });

        it('con un ID con formato inválido responde INVALID_ID', async () => {
            assertError(await api.get('/api/deliveries/abc'), 400, 'INVALID_ID');
        });

        it('con una entrega que no existe responde DELIVERY_NOT_FOUND', async () => {
            assertError(await api.get(`/api/deliveries/${NON_EXISTENT_ID}`), 404, 'DELIVERY_NOT_FOUND');
        });

        it('responde INTERNAL_SERVER_ERROR si falla el repository', async () => {
            failWith('findById');

            assertError(await api.get(`/api/deliveries/${NON_EXISTENT_ID}`), 500, 'INTERNAL_SERVER_ERROR');
        });
    });

    describe('PUT /api/deliveries/:did/status', () => {
        it('responde 200 y cambia el estado, sin tocar el resto de la entrega', async () => {
            const { order, driver, delivery } = await createDelivery({ priority: 'high', notes: 'Dejar en portería' });

            const res = await api.put(`/api/deliveries/${delivery._id}/status`).send({ status: 'in_transit' });

            expect(res.status).to.equal(200);
            expect(res.body.status).to.equal('success');
            expectDelivery(res.body.payload, {
                _id: delivery._id,
                order: order._id,
                driver: driver._id,
                status: 'in_transit',
                priority: 'high',
                notes: 'Dejar en portería',
            });
        });

        it('el nuevo estado queda guardado', async () => {
            const { delivery } = await createDelivery();
            await api.put(`/api/deliveries/${delivery._id}/status`).send({ status: 'delivered' });

            const res = await api.get(`/api/deliveries/${delivery._id}`);

            expect(res.body.payload.status).to.equal('delivered');
        });

        for (const status of Object.values(DELIVERY_STATUS)) {
            it(`acepta el estado ${status}, sin un orden obligatorio`, async () => {
                const { delivery } = await createDelivery();

                const res = await api.put(`/api/deliveries/${delivery._id}/status`).send({ status });

                expect(res.status).to.equal(200);
                expect(res.body.payload.status).to.equal(status);
            });
        }

        it('con un estado que no existe para las entregas responde INVALID_DELIVERY_STATUS', async () => {
            const { delivery } = await createDelivery();

            const res = await api.put(`/api/deliveries/${delivery._id}/status`).send({ status: 'picked_up' });

            assertError(res, 400, 'INVALID_DELIVERY_STATUS');
        });

        it('sin enviar el estado responde INVALID_DELIVERY_STATUS', async () => {
            const { delivery } = await createDelivery();

            const res = await api.put(`/api/deliveries/${delivery._id}/status`).send({});

            assertError(res, 400, 'INVALID_DELIVERY_STATUS');
        });

        it('con un ID con formato inválido responde INVALID_ID', async () => {
            const res = await api.put('/api/deliveries/abc/status').send({ status: 'delivered' });

            assertError(res, 400, 'INVALID_ID');
        });

        it('con un JSON mal formado responde INVALID_JSON', async () => {
            const { delivery } = await createDelivery();

            const res = await api
                .put(`/api/deliveries/${delivery._id}/status`)
                .set('Content-Type', 'application/json')
                .send('{"status": ');

            assertError(res, 400, 'INVALID_JSON');
        });

        it('con una entrega que no existe responde DELIVERY_NOT_FOUND', async () => {
            const res = await api.put(`/api/deliveries/${NON_EXISTENT_ID}/status`).send({ status: 'delivered' });

            assertError(res, 404, 'DELIVERY_NOT_FOUND');
        });

        it('responde INTERNAL_SERVER_ERROR si falla el repository', async () => {
            failWith('updateStatus');

            const res = await api.put(`/api/deliveries/${NON_EXISTENT_ID}/status`).send({ status: 'delivered' });

            assertError(res, 500, 'INTERNAL_SERVER_ERROR');
        });
    });

    describe('DELETE /api/deliveries/:did', () => {
        it('responde 200 con la entrega eliminada y ya no existe', async () => {
            const { order, driver, delivery } = await createDelivery();

            const res = await api.delete(`/api/deliveries/${delivery._id}`);

            expect(res.status).to.equal(200);
            expect(res.body.status).to.equal('success');
            expectDelivery(res.body.payload, { _id: delivery._id, order: order._id, driver: driver._id });
            assertError(await api.get(`/api/deliveries/${delivery._id}`), 404, 'DELIVERY_NOT_FOUND');
        });

        it('con un ID con formato inválido responde INVALID_ID', async () => {
            assertError(await api.delete('/api/deliveries/abc'), 400, 'INVALID_ID');
        });

        it('con una entrega que no existe responde DELIVERY_NOT_FOUND', async () => {
            assertError(await api.delete(`/api/deliveries/${NON_EXISTENT_ID}`), 404, 'DELIVERY_NOT_FOUND');
        });

        it('responde INTERNAL_SERVER_ERROR si falla el repository', async () => {
            failWith('delete');

            assertError(await api.delete(`/api/deliveries/${NON_EXISTENT_ID}`), 500, 'INTERNAL_SERVER_ERROR');
        });
    });
});