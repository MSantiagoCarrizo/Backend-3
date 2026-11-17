import { mock } from 'node:test';
import { expect } from 'chai';
import { api, assertError, createUser, validUser, expectUser, NON_EXISTENT_ID } from './helpers.js';
import { clearDatabase } from './setup.js';
import { userRepository } from '../src/repositories/user.repository.js';

const failWith = (method) =>
    mock.method(userRepository, method, async () => {
        throw new Error('falla inesperada');
    });

describe('Users', () => {
    beforeEach(clearDatabase);

    describe('GET /api/users', () => {
        it('responde 200 con la lista de usuarios, sin password', async () => {
            await createUser({ email: 'ana@test.com' });
            await createUser({ email: 'luis@test.com', firstName: 'Luis' });

            const res = await api.get('/api/users');

            expect(res.status).to.equal(200);
            expect(res.body.status).to.equal('success');
            expect(res.body.payload).to.be.an('array').with.lengthOf(2);
            res.body.payload.forEach((user) => expectUser(user));
            expect(res.body.payload.map((user) => user.email)).to.have.members(['ana@test.com', 'luis@test.com']);
        });

        it('responde 200 con una lista vacía si no hay usuarios', async () => {
            const res = await api.get('/api/users');

            expect(res.status).to.equal(200);
            expect(res.body).to.deep.equal({ status: 'success', payload: [] });
        });

        it('responde INTERNAL_SERVER_ERROR si falla el repository', async () => {
            failWith('findAll');

            assertError(await api.get('/api/users'), 500, 'INTERNAL_SERVER_ERROR');
        });
    });

    describe('POST /api/users', () => {
        it('responde 201 y crea un usuario con role customer por defecto, sin devolver el password', async () => {
            const res = await api.post('/api/users').send(validUser());

            expect(res.status).to.equal(201);
            expect(res.body.status).to.equal('success');
            expectUser(res.body.payload, { firstName: 'Ana', lastName: 'Pérez', email: 'ana@test.com', role: 'customer' });
        });

        it('responde 201 con el role que se envía', async () => {
            const res = await api.post('/api/users').send(validUser({ role: 'driver' }));

            expect(res.status).to.equal(201);
            expectUser(res.body.payload, { role: 'driver' });
        });

        it('el usuario creado se puede consultar después', async () => {
            const created = await createUser();

            const res = await api.get(`/api/users/${created._id}`);

            expect(res.status).to.equal(200);
            expect(res.body.payload).to.deep.equal(created);
        });

        it('con datos incompletos responde VALIDATION_ERROR', async () => {
            const res = await api.post('/api/users').send({ firstName: 'Ana' });

            assertError(res, 400, 'VALIDATION_ERROR');
        });

        it('con un role que no existe responde VALIDATION_ERROR', async () => {
            const res = await api.post('/api/users').send(validUser({ role: 'jefe' }));

            assertError(res, 400, 'VALIDATION_ERROR');
        });

        it('con un JSON mal formado responde INVALID_JSON', async () => {
            const res = await api
                .post('/api/users')
                .set('Content-Type', 'application/json')
                .send('{"firstName": ');

            assertError(res, 400, 'INVALID_JSON');
        });

        it('con un email que ya existe responde EMAIL_ALREADY_EXISTS', async () => {
            await createUser({ email: 'repetido@test.com' });

            const res = await api.post('/api/users').send(validUser({ email: 'repetido@test.com' }));

            assertError(res, 409, 'EMAIL_ALREADY_EXISTS');
        });

        it('responde INTERNAL_SERVER_ERROR si falla el repository', async () => {
            failWith('create');

            assertError(await api.post('/api/users').send(validUser()), 500, 'INTERNAL_SERVER_ERROR');
        });
    });

    describe('GET /api/users/:uid', () => {
        it('responde 200 con el usuario, sin password', async () => {
            const created = await createUser();

            const res = await api.get(`/api/users/${created._id}`);

            expect(res.status).to.equal(200);
            expect(res.body.status).to.equal('success');
            expectUser(res.body.payload, { _id: created._id, email: 'ana@test.com' });
        });

        it('con un ID con formato inválido responde INVALID_ID', async () => {
            assertError(await api.get('/api/users/abc'), 400, 'INVALID_ID');
        });

        it('con un usuario que no existe responde USER_NOT_FOUND', async () => {
            assertError(await api.get(`/api/users/${NON_EXISTENT_ID}`), 404, 'USER_NOT_FOUND');
        });

        it('responde INTERNAL_SERVER_ERROR si falla el repository', async () => {
            failWith('findById');

            assertError(await api.get(`/api/users/${NON_EXISTENT_ID}`), 500, 'INTERNAL_SERVER_ERROR');
        });
    });

    describe('PUT /api/users/:uid', () => {
        it('responde 200 y actualiza solo los campos enviados, sin devolver el password', async () => {
            const created = await createUser();

            const res = await api
                .put(`/api/users/${created._id}`)
                .send({ firstName: 'Ana María', password: 'nueva123' });

            expect(res.status).to.equal(200);
            expect(res.body.status).to.equal('success');
            expectUser(res.body.payload, {
                _id: created._id,
                firstName: 'Ana María',
                lastName: 'Pérez',
                email: 'ana@test.com',
            });
        });

        it('el cambio queda guardado', async () => {
            const created = await createUser();
            await api.put(`/api/users/${created._id}`).send({ role: 'admin' });

            const res = await api.get(`/api/users/${created._id}`);

            expect(res.body.payload.role).to.equal('admin');
        });

        it('con un ID con formato inválido responde INVALID_ID', async () => {
            assertError(await api.put('/api/users/abc').send({ firstName: 'Ana' }), 400, 'INVALID_ID');
        });

        it('con un role que no existe responde VALIDATION_ERROR', async () => {
            const created = await createUser();

            const res = await api.put(`/api/users/${created._id}`).send({ role: 'jefe' });

            assertError(res, 400, 'VALIDATION_ERROR');
        });

        it('con un JSON mal formado responde INVALID_JSON', async () => {
            const created = await createUser();

            const res = await api
                .put(`/api/users/${created._id}`)
                .set('Content-Type', 'application/json')
                .send('{"firstName": ');

            assertError(res, 400, 'INVALID_JSON');
        });

        it('con un usuario que no existe responde USER_NOT_FOUND', async () => {
            const res = await api.put(`/api/users/${NON_EXISTENT_ID}`).send({ firstName: 'Ana' });

            assertError(res, 404, 'USER_NOT_FOUND');
        });

        it('con el email de otro usuario responde EMAIL_ALREADY_EXISTS', async () => {
            await createUser({ email: 'ana@test.com' });
            const luis = await createUser({ email: 'luis@test.com', firstName: 'Luis' });

            const res = await api.put(`/api/users/${luis._id}`).send({ email: 'ana@test.com' });

            assertError(res, 409, 'EMAIL_ALREADY_EXISTS');
        });

        it('responde INTERNAL_SERVER_ERROR si falla el repository', async () => {
            failWith('update');

            const res = await api.put(`/api/users/${NON_EXISTENT_ID}`).send({ firstName: 'Ana' });

            assertError(res, 500, 'INTERNAL_SERVER_ERROR');
        });
    });

    describe('DELETE /api/users/:uid', () => {
        it('responde 200 con el usuario eliminado, sin password, y ya no existe', async () => {
            const created = await createUser();

            const res = await api.delete(`/api/users/${created._id}`);

            expect(res.status).to.equal(200);
            expect(res.body.status).to.equal('success');
            expectUser(res.body.payload, { _id: created._id, email: 'ana@test.com' });
            assertError(await api.get(`/api/users/${created._id}`), 404, 'USER_NOT_FOUND');
        });

        it('con un ID con formato inválido responde INVALID_ID', async () => {
            assertError(await api.delete('/api/users/abc'), 400, 'INVALID_ID');
        });

        it('con un usuario que no existe responde USER_NOT_FOUND', async () => {
            assertError(await api.delete(`/api/users/${NON_EXISTENT_ID}`), 404, 'USER_NOT_FOUND');
        });

        it('responde INTERNAL_SERVER_ERROR si falla el repository', async () => {
            failWith('delete');

            assertError(await api.delete(`/api/users/${NON_EXISTENT_ID}`), 500, 'INTERNAL_SERVER_ERROR');
        });
    });
});