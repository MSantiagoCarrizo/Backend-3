import { describe, test, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { api, assertError } from './helpers.js';
import { userRepository } from '../src/repositories/user.repository.js';

afterEach(() => mock.restoreAll());

describe('Ruta inexistente', () => {
    test('GET /api/nada responde ROUTE_NOT_FOUND', async () => {
        const res = await api.get('/api/nada');

        assertError(res, 404, 'ROUTE_NOT_FOUND');
    });
});

describe('Errores que no son nuestros se traducen al formato unificado', () => {
    test('JSON mal formado responde INVALID_JSON', async () => {
        const res = await api
            .post('/api/users')
            .set('Content-Type', 'application/json')
            .send('{"firstName": ');

        assertError(res, 400, 'INVALID_JSON');
    });

    test('ID con formato incorrecto responde INVALID_ID (CastError de Mongoose)', async () => {
        const res = await api.get('/api/users/abc');

        assertError(res, 400, 'INVALID_ID');
    });

    test('Usuario sin datos responde VALIDATION_ERROR (ValidationError de Mongoose)', async () => {
        const res = await api.post('/api/users').send({});

        assertError(res, 400, 'VALIDATION_ERROR');
    });
});

describe('Error 11000 de Mongo (valor repetido en un campo único)', () => {
    const duplicateKeyError = (keyPattern) =>
        Object.assign(new Error('E11000 duplicate key error'), { code: 11000, keyPattern });

    const postUser = () => api.post('/api/users').send({ email: 'ana@mail.com' });

    test('si el campo repetido es email responde EMAIL_ALREADY_EXISTS', async () => {
        mock.method(userRepository, 'create', async () => {
            throw duplicateKeyError({ email: 1 });
        });

        assertError(await postUser(), 409, 'EMAIL_ALREADY_EXISTS');
    });

    test('si el campo repetido es otro responde DUPLICATE_KEY', async () => {
        mock.method(userRepository, 'create', async () => {
            throw duplicateKeyError({ dni: 1 });
        });

        assertError(await postUser(), 409, 'DUPLICATE_KEY');
    });

    test('si el error no trae keyPattern responde DUPLICATE_KEY', async () => {
        mock.method(userRepository, 'create', async () => {
            throw duplicateKeyError(undefined);
        });

        assertError(await postUser(), 409, 'DUPLICATE_KEY');
    });
});

describe('Error inesperado', () => {
    test('responde INTERNAL_SERVER_ERROR con el formato unificado y sin mostrar el detalle', async () => {
        mock.method(userRepository, 'findAll', async () => {
            throw new Error('detalle interno que no debe llegar al cliente');
        });

        const res = await api.get('/api/users');

        assertError(res, 500, 'INTERNAL_SERVER_ERROR');
        assert.ok(!JSON.stringify(res.body).includes('detalle interno'));
    });
});