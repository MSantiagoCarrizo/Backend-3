import { mock } from 'node:test';
import { expect } from 'chai';
import { api, assertError, createStore } from './helpers.js';
import { clearDatabase } from './setup.js';
import { storeRepository } from '../src/repositories/store.repository.js';
import { userRepository } from '../src/repositories/user.repository.js';

const USER_MOCK_KEYS = ['firstName', 'lastName', 'email', 'password', 'role'];
const ORDER_MOCK_KEYS = ['customer', 'store', 'items', 'deliveryAddress', 'total', 'status', 'priority'];

const INVALID_QUANTITIES = [
    ['abc', 'INVALID_MOCK_AMOUNT'],
    ['0', 'INVALID_MOCK_AMOUNT'],
    ['-5', 'INVALID_MOCK_AMOUNT'],
    ['2.5', 'INVALID_MOCK_AMOUNT'],
    ['1001', 'MOCK_AMOUNT_TOO_LARGE'],
];

const generate = (body) => api.post('/api/mocks/generateData').send(body);

describe('Mocks', () => {
    beforeEach(clearDatabase);

    describe('GET /api/mocks/mockingusers', () => {
        it('responde 200 con 10 usuarios de prueba por defecto, todos con role customer y email distinto', async () => {
            const res = await api.get('/api/mocks/mockingusers');

            expect(res.status).to.equal(200);
            expect(res.body.status).to.equal('success');
            expect(res.body.payload).to.be.an('array').with.lengthOf(10);
            for (const user of res.body.payload) {
                expect(user).to.have.all.keys(USER_MOCK_KEYS);
                expect(user.email).to.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
                expect(user.role).to.equal('customer');
            }
            expect(new Set(res.body.payload.map((user) => user.email)).size).to.equal(10);
        });

        it('genera la cantidad que se envía', async () => {
            const res = await api.get('/api/mocks/mockingusers?qty=3');

            expect(res.status).to.equal(200);
            expect(res.body.payload).to.be.an('array').with.lengthOf(3);
        });

        for (const qty of [1, 1000]) {
            it(`acepta el límite qty=${qty}`, async () => {
                const res = await api.get(`/api/mocks/mockingusers?qty=${qty}`);

                expect(res.status).to.equal(200);
                expect(res.body.payload).to.be.an('array').with.lengthOf(qty);
            });
        }

        it('no guarda los usuarios en la base de datos', async () => {
            await api.get('/api/mocks/mockingusers?qty=3');

            const res = await api.get('/api/users');

            expect(res.body).to.deep.equal({ status: 'success', payload: [] });
        });

        for (const [qty, code] of INVALID_QUANTITIES) {
            it(`con qty=${qty} responde ${code}`, async () => {
                assertError(await api.get(`/api/mocks/mockingusers?qty=${qty}`), 400, code);
            });
        }
    });

    describe('GET /api/mocks/mockingorders', () => {
        it('responde 200 con 10 pedidos de prueba por defecto, con items, total y estado inicial', async () => {
            const res = await api.get('/api/mocks/mockingorders');

            expect(res.status).to.equal(200);
            expect(res.body.status).to.equal('success');
            expect(res.body.payload).to.be.an('array').with.lengthOf(10);
            for (const order of res.body.payload) {
                expect(order).to.have.all.keys(ORDER_MOCK_KEYS);
                expect(order.customer).to.match(/^[a-f0-9]{24}$/);
                expect(order.store).to.match(/^[a-f0-9]{24}$/);
                expect(order).to.include({ total: 1000, status: 'created', priority: 'normal' });
            }
            expect(res.body.payload[0].items).to.deep.equal([{ name: 'Producto de prueba 1', quantity: 1, price: 1000 }]);
            expect(res.body.payload[0].deliveryAddress).to.equal('Av. Siempre Viva 101');
        });

        it('genera la cantidad que se envía', async () => {
            const res = await api.get('/api/mocks/mockingorders?qty=3');

            expect(res.status).to.equal(200);
            expect(res.body.payload).to.be.an('array').with.lengthOf(3);
        });

        for (const qty of [1, 1000]) {
            it(`acepta el límite qty=${qty}`, async () => {
                const res = await api.get(`/api/mocks/mockingorders?qty=${qty}`);

                expect(res.status).to.equal(200);
                expect(res.body.payload).to.be.an('array').with.lengthOf(qty);
            });
        }

        it('no guarda los pedidos en la base de datos', async () => {
            await api.get('/api/mocks/mockingorders?qty=3');

            const res = await api.get('/api/orders');

            expect(res.body).to.deep.equal({ status: 'success', payload: [] });
        });

        for (const [qty, code] of INVALID_QUANTITIES) {
            it(`con qty=${qty} responde ${code}`, async () => {
                assertError(await api.get(`/api/mocks/mockingorders?qty=${qty}`), 400, code);
            });
        }
    });

    describe('POST /api/mocks/generateData', () => {
        it('responde 201 y guarda los usuarios en la base', async () => {
            const res = await generate({ users: 3 });

            expect(res.status).to.equal(201);
            expect(res.body).to.deep.equal({
                status: 'success',
                payload: { users: 3, drivers: 0, orders: 0, deliveries: 0 },
            });

            const users = await api.get('/api/users');
            expect(users.body.payload).to.have.lengthOf(3);
            expect(users.body.payload.map((user) => user.role)).to.deep.equal(['customer', 'customer', 'customer']);
        });

        it('responde 201 y guarda usuarios, repartidores, pedidos y entregas relacionados entre sí', async () => {
            await createStore();

            const res = await generate({ users: 3, drivers: 2, orders: 5, deliveries: 2 });

            expect(res.status).to.equal(201);
            expect(res.body).to.deep.equal({
                status: 'success',
                payload: { users: 3, drivers: 2, orders: 5, deliveries: 2 },
            });

            const users = await api.get('/api/users');
            const roles = users.body.payload.map((user) => user.role).sort();
            expect(roles).to.deep.equal(['customer', 'customer', 'customer', 'driver', 'driver', 'store']);

            const orders = await api.get('/api/orders');
            expect(orders.body.payload).to.have.lengthOf(5);
            for (const order of orders.body.payload) {
                expect(order.status).to.equal('created');
                expect(order.customer.role).to.equal('customer');
            }

            const deliveries = await api.get('/api/deliveries');
            const orderIds = orders.body.payload.map((order) => order._id);
            expect(deliveries.body.payload).to.have.lengthOf(2);
            for (const delivery of deliveries.body.payload) {
                expect(delivery.status).to.equal('assigned');
                expect(delivery.driver.role).to.equal('driver');
                expect(orderIds).to.include(delivery.order._id);
            }
        });

        for (const body of [{}, { users: 0 }, { users: -5 }, { users: 2.5 }, { users: 'abc' }]) {
            it(`con ${JSON.stringify(body)} responde INVALID_MOCK_AMOUNT`, async () => {
                assertError(await generate(body), 400, 'INVALID_MOCK_AMOUNT');
            });
        }

        it('con una cantidad mayor a 1000 responde MOCK_AMOUNT_TOO_LARGE', async () => {
            assertError(await generate({ users: 1001 }), 400, 'MOCK_AMOUNT_TOO_LARGE');
        });

        it('con pedidos y sin usuarios responde MOCK_USERS_REQUIRED', async () => {
            assertError(await generate({ orders: 3 }), 400, 'MOCK_USERS_REQUIRED');
        });

        it('con pedidos y sin comercios registrados responde NO_STORES_AVAILABLE', async () => {
            assertError(await generate({ users: 2, orders: 3 }), 400, 'NO_STORES_AVAILABLE');
        });

        it('con entregas y sin pedidos ni repartidores responde MOCK_DELIVERIES_REQUIRED', async () => {
            assertError(await generate({ deliveries: 2 }), 400, 'MOCK_DELIVERIES_REQUIRED');
        });

        it('con entregas y sin pedidos responde MOCK_DELIVERIES_REQUIRED', async () => {
            assertError(await generate({ drivers: 2, deliveries: 2 }), 400, 'MOCK_DELIVERIES_REQUIRED');
        });

        it('con entregas y sin repartidores responde MOCK_DELIVERIES_REQUIRED', async () => {
            await createStore();

            assertError(await generate({ users: 2, orders: 2, deliveries: 2 }), 400, 'MOCK_DELIVERIES_REQUIRED');
        });

        it('con un JSON mal formado responde INVALID_JSON', async () => {
            const res = await api
                .post('/api/mocks/generateData')
                .set('Content-Type', 'application/json')
                .send('{"users": ');

            assertError(res, 400, 'INVALID_JSON');
        });

        it('si MongoDB falla al insertar responde MOCK_GENERATION_ERROR', async () => {
            mock.method(userRepository, 'insertMany', async () => {
                throw new Error('falla de MongoDB');
            });

            assertError(await generate({ users: 2 }), 500, 'MOCK_GENERATION_ERROR');
        });

        it('si falla algo inesperado responde INTERNAL_SERVER_ERROR', async () => {
            mock.method(storeRepository, 'findAll', async () => {
                throw new Error('falla inesperada');
            });

            assertError(await generate({ users: 2, orders: 3 }), 500, 'INTERNAL_SERVER_ERROR');
        });
    });
});