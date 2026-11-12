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

mongoose.set('bufferCommands', false);

export const mochaHooks = {
    afterEach() {
        mock.restoreAll();
    },
};