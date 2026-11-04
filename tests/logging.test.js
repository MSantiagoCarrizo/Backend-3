import { describe, test, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { api } from './helpers.js';
import logger from '../src/config/logger.js';
import { userRepository } from '../src/repositories/user.repository.js';

afterEach(() => mock.restoreAll());

const spyLogger = () => ({
  warning: mock.method(logger, 'warning', () => {}),
  error: mock.method(logger, 'error', () => {}),
});

describe('El errorHandler registra los errores', () => {
  test('un error esperado se registra como warning', async () => {
    const spy = spyLogger();

    await api.get('/api/nada');

    assert.equal(spy.warning.mock.callCount(), 1);
    assert.equal(
      spy.warning.mock.calls[0].arguments[0],
      'ROUTE_NOT_FOUND - Ruta no encontrada - GET /api/nada'
    );
    assert.equal(spy.error.mock.callCount(), 0);
  });

  test('un error inesperado se registra como error, con el detalle original', async () => {
    const spy = spyLogger();
    mock.method(userRepository, 'findAll', async () => {
      throw new Error('detalle interno');
    });

    await api.get('/api/users');

    assert.equal(spy.error.mock.callCount(), 1);
    const message = spy.error.mock.calls[0].arguments[0];
    assert.ok(message.startsWith('INTERNAL_SERVER_ERROR - Error interno del servidor - GET /api/users'));
    assert.ok(message.includes('detalle interno'));
    assert.equal(spy.warning.mock.callCount(), 0);
  });
});

describe('GET /loggerTest', () => {
  test('responde 200 y genera un log de cada nivel', async () => {
    const levels = ['debug', 'http', 'info', 'warning', 'error', 'fatal'];
    const spies = levels.map((level) => mock.method(logger, level, () => {}));

    const res = await api.get('/loggerTest');

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'success', message: 'Logs generados correctamente' });
    spies.forEach((spy) => assert.equal(spy.mock.callCount(), 1));
  });
});