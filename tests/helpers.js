import './setup.js';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { ERROR_DICTIONARY } from '../src/utils/errorDictionary.js';

export const api = request(app);

export const assertError = (res, statusCode, code) => {
    assert.equal(res.status, statusCode);
    assert.deepEqual(res.body, {
        status: 'error',
        message: ERROR_DICTIONARY[code].message,
        code,
    });
};