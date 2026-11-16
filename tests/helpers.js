import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';
import { ERROR_DICTIONARY } from '../src/utils/errorDictionary.js';

export const api = request(app);
export const NON_EXISTENT_ID = '64b000000000000000000000';

export const assertError = (res, statusCode, code) => {
    expect(res.status).to.equal(statusCode);
    expect(res.body).to.deep.equal({
        status: 'error',
        message: ERROR_DICTIONARY[code].message,
        code,
    });
};

export const validUser = (overrides = {}) => ({
    firstName: 'Ana',
    lastName: 'Pérez',
    email: 'ana@test.com',
    password: 'coder123',
    ...overrides,
});

export const createUser = async (overrides = {}) => {
    const res = await api.post('/api/users').send(validUser(overrides));

    expect(res.status).to.equal(201);
    return res.body.payload;
};