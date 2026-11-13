import mongoose from 'mongoose';
import { expect } from 'chai';
import { api } from './helpers.js';
import { clearDatabase } from './setup.js';
import UserModel from '../src/models/user.model.js';

describe('Entorno de testing', () => {
    it('está conectado a la base de datos de testing', () => {
        expect(mongoose.connection.readyState).to.equal(1);
        expect(mongoose.connection.name).to.match(/test$/);
    });

    it('GET /health responde que la API funciona', async () => {
        const res = await api.get('/health');

        expect(res.status).to.equal(200);
        expect(res.body).to.deep.equal({ status: 'success', message: 'API funcionando' });
    });

    it('clearDatabase vacía las colecciones', async () => {
        await UserModel.create({
            firstName: 'Ana',
            lastName: 'Pérez',
            email: 'ana@test.com',
            password: 'coder123',
        });
        expect(await UserModel.countDocuments()).to.equal(1);

        await clearDatabase();

        expect(await UserModel.countDocuments()).to.equal(0);
    });
});