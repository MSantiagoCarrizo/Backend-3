import { mock } from 'node:test';
import { expect } from 'chai';
import { api, assertError } from './helpers.js';
import { userRepository } from '../src/repositories/user.repository.js';

describe('Ruta inexistente', () => {
    it('GET /api/nada responde ROUTE_NOT_FOUND', async () => {
        const res = await api.get('/api/nada');

        assertError(res, 404, 'ROUTE_NOT_FOUND');
    });
});

describe('Error 11000 de Mongo (valor repetido en un campo único)', () => {
    const duplicateKeyError = (keyPattern) =>
        Object.assign(new Error('E11000 duplicate key error'), { code: 11000, keyPattern });

    const postUser = () => api.post('/api/users').send({ email: 'ana@mail.com' });

    it('si el campo repetido es otro responde DUPLICATE_KEY', async () => {
        mock.method(userRepository, 'create', async () => {
            throw duplicateKeyError({ dni: 1 });
        });

        assertError(await postUser(), 409, 'DUPLICATE_KEY');
    });

    it('si el error no trae keyPattern responde DUPLICATE_KEY', async () => {
        mock.method(userRepository, 'create', async () => {
            throw duplicateKeyError(undefined);
        });

        assertError(await postUser(), 409, 'DUPLICATE_KEY');
    });
});

describe('Error inesperado', () => {
    it('responde INTERNAL_SERVER_ERROR con el formato unificado y sin mostrar el detalle', async () => {
        mock.method(userRepository, 'findAll', async () => {
            throw new Error('detalle interno que no debe llegar al cliente');
        });

        const res = await api.get('/api/users');

        assertError(res, 500, 'INTERNAL_SERVER_ERROR');
        expect(JSON.stringify(res.body)).to.not.include('detalle interno');
    });
});