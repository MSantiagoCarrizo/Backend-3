import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';
import { ERROR_DICTIONARY } from '../src/utils/errorDictionary.js';

export const api = request(app);

export const assertError = (res, statusCode, code) => {
    expect(res.status).to.equal(statusCode);
    expect(res.body).to.deep.equal({
        status: 'error',
        message: ERROR_DICTIONARY[code].message,
        code,
    });
};