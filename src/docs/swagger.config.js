import swaggerJSDoc from 'swagger-jsdoc';
import { config } from '../config/index.js';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ShipNow API',
      version: '1.0.0',
      description:
        'API REST de ShipNow para la gestión de logística y envíos: usuarios, pedidos y entregas. Incluye herramientas de apoyo (mocks y logger de prueba) y respuestas de error con un formato unificado.',
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Servidor local',
      },
    ],
    tags: [
      { name: 'Users', description: 'Alta, consulta, modificación y baja de usuarios.' },
      { name: 'Orders', description: 'Pedidos de los clientes a los comercios y su estado.' },
      { name: 'Deliveries', description: 'Entregas de los pedidos, asignadas a repartidores.' },
      { name: 'Mocks', description: 'Herramientas de desarrollo para generar datos de prueba. No son funcionalidad de negocio.' },
      { name: 'Logger', description: 'Herramienta para validar el logger. No es funcionalidad de negocio.' },
    ],
  },
  apis: ['./src/docs/**/*.yaml'],
};

export const swaggerSpecs = swaggerJSDoc(swaggerOptions);