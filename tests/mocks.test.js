import { describe, test, afterEach, mock } from 'node:test';
import { api, assertError } from './helpers.js';
import { userRepository } from '../src/repositories/user.repository.js';
import { storeRepository } from '../src/repositories/store.repository.js';

afterEach(() => mock.restoreAll());

describe('Cantidad inválida en los endpoints de mocks', () => {
    for (const qty of ['abc', '-5', '0', '2.5']) {
        test(`GET /api/mocks/mockingusers?qty=${qty} responde INVALID_MOCK_AMOUNT`, async () => {
            const res = await api.get(`/api/mocks/mockingusers?qty=${qty}`);

            assertError(res, 400, 'INVALID_MOCK_AMOUNT');
        });
    }

    test('GET /api/mocks/mockingorders?qty=abc responde INVALID_MOCK_AMOUNT', async () => {
        const res = await api.get('/api/mocks/mockingorders?qty=abc');

        assertError(res, 400, 'INVALID_MOCK_AMOUNT');
    });

    test('GET /api/mocks/mockingorders?qty=5000 responde MOCK_AMOUNT_TOO_LARGE', async () => {
        const res = await api.get('/api/mocks/mockingorders?qty=5000');

        assertError(res, 400, 'MOCK_AMOUNT_TOO_LARGE');
    });
});

describe('POST /api/mocks/generateData', () => {
    const generate = (body) => api.post('/api/mocks/generateData').send(body);

    test('con {} responde INVALID_MOCK_AMOUNT', async () => {
        assertError(await generate({}), 400, 'INVALID_MOCK_AMOUNT');
    });

    test('con { users: -5 } responde INVALID_MOCK_AMOUNT', async () => {
        assertError(await generate({ users: -5 }), 400, 'INVALID_MOCK_AMOUNT');
    });

    test('con { users: 5000 } responde MOCK_AMOUNT_TOO_LARGE', async () => {
        assertError(await generate({ users: 5000 }), 400, 'MOCK_AMOUNT_TOO_LARGE');
    });

    test('con { orders: 3 } responde MOCK_USERS_REQUIRED', async () => {
        assertError(await generate({ orders: 3 }), 400, 'MOCK_USERS_REQUIRED');
    });

    test('con { deliveries: 2 } responde MOCK_DELIVERIES_REQUIRED', async () => {
        assertError(await generate({ deliveries: 2 }), 400, 'MOCK_DELIVERIES_REQUIRED');
    });

    test('con { users: 2, orders: 3 } y sin comercios responde NO_STORES_AVAILABLE', async () => {
        mock.method(userRepository, 'insertMany', async (users) => users.map((user, i) => ({ ...user, _id: i })));
        mock.method(storeRepository, 'findAll', async () => []);

        assertError(await generate({ users: 2, orders: 3 }), 400, 'NO_STORES_AVAILABLE');
    });

    test('si MongoDB falla al insertar responde MOCK_GENERATION_ERROR', async () => {
        mock.method(console, 'error', () => { });
        mock.method(userRepository, 'insertMany', async () => {
            throw new Error('falla de MongoDB');
        });

        assertError(await generate({ users: 2 }), 500, 'MOCK_GENERATION_ERROR');
    });
});