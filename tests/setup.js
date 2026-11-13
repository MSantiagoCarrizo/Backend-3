import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { mock } from 'node:test';

const env = dotenv.config({ path: '.env.test', override: true });

if (env.error) {
    throw new Error('Falta el archivo .env.test. Copiá .env.test.example, completalo y volvé a correr los tests.');
}

if (!process.env.MONGODB_URI) {
    throw new Error('Falta MONGODB_URI en el archivo .env.test.');
}

process.env.NODE_ENV = 'test';

const databaseName = process.env.MONGODB_URI.split('/').pop().split('?')[0];

if (!databaseName.endsWith('test')) {
    throw new Error(
        `Los tests solo corren sobre una base de testing: el nombre de la base tiene que terminar en "test" (la actual es "${databaseName}").`
    );
}

export const clearDatabase = async () => {
    await Promise.all(Object.values(mongoose.models).map((model) => model.deleteMany({})));
};

export const mochaHooks = {
    async beforeAll() {
        try {
            await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
        } catch (error) {
            throw new Error(`No se pudo conectar a la base de testing: ${error.message}`);
        }

        await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
        await clearDatabase();
    },

    async afterAll() {
        if (mongoose.connection.readyState !== 1) return;

        await clearDatabase();
        await mongoose.disconnect();
    },

    afterEach() {
        mock.restoreAll();
    },
};