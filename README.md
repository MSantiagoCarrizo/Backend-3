# ShipNow API

API REST para la gestión de logística y envíos. Permite administrar usuarios, comercios y pedidos, y está construida con Node.js, Express y MongoDB (Mongoose).

El proyecto está organizado en una arquitectura por capas (Controller → Service → Repository) y valida su configuración de entorno al arrancar.

## Tecnologías

* Node.js (ES Modules)
* Express 4
* MongoDB con Mongoose 8
* dotenv, para las variables de entorno
* cors, para habilitar peticiones desde otros orígenes (por ejemplo, un frontend en otro dominio o puerto)
* nodemon, en desarrollo

## Instalación y ejecución

Requiere Node.js y una base de datos MongoDB.

1. Clonar el repositorio e ingresar a la carpeta:

```bash
git clone https://github.com/MSantiagoCarrizo/Backend-3.git
cd Backend-3
```

2. Instalar las dependencias:

```bash
npm install
```

3. Crear el archivo `.env` a partir de la plantilla `.env.example`:

```bash
cp .env.example .env
```

4. Completar el `.env` con los valores propios:

```txt
PORT=8080
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/<nombre-de-la-base>?retryWrites=true&w=majority
NODE_ENV=development
```

5. Iniciar el servidor:

```bash
npm run dev
```

Con `npm start` se inicia sin nodemon.

6. Verificar que la API responde abriendo `http://localhost:8080/health`.

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto en el que corre el servidor |
| `MONGODB_URI` | URI de conexión a MongoDB, incluyendo el nombre de la base de datos |
| `NODE_ENV` | Entorno de ejecución (por ejemplo `development`) |

Las tres variables son obligatorias y se validan una sola vez, al iniciar la aplicación, en `src/config/index.js`. Si falta alguna, la aplicación no arranca y muestra un error descriptivo:

```txt
Falta configurar la variable de entorno: MONGODB_URI
```

El archivo `.env` no se sube al repositorio. `.env.example` documenta las variables que necesita el proyecto, sin valores reales. El resto del código lee la configuración importando el objeto `config` y nunca accede a `process.env` directamente.

## Arquitectura

Cada petición recorre las capas en este orden, y cada capa solo conoce a la siguiente:

```txt
Request → Router → Controller → Service → Repository → Model → MongoDB
```

### Estructura de carpetas

```txt
.
├── .env.example
├── .gitignore
├── README.md
├── package-lock.json
├── package.json
└── src/
    ├── config/
    │   ├── index.js              Carga y valida las variables de entorno
    │   └── db.js                 Conexión a MongoDB
    ├── constants/
    │   └── index.js              Roles, estados y prioridades del dominio
    ├── controllers/
    │   ├── order.controller.js
    │   ├── store.controller.js
    │   └── user.controller.js
    ├── models/
    │   ├── order.model.js
    │   ├── store.model.js
    │   └── user.model.js
    ├── repositories/
    │   ├── order.repository.js
    │   ├── store.repository.js
    │   └── user.repository.js
    ├── routes/
    │   ├── orders.router.js
    │   ├── stores.router.js
    │   └── users.router.js
    ├── services/
    │   ├── order.service.js
    │   ├── store.service.js
    │   └── user.service.js
    ├── app.js                    Configuración de Express y montaje de rutas
    └── server.js                 Punto de entrada: conecta la base y levanta el servidor
```

### Responsabilidad de cada capa

| Capa | Qué hace | Qué no hace |
| --- | --- | --- |
| Router | Conecta cada path con un método del Controller | No tiene lógica |
| Controller | Recibe `req`, llama al Service y responde con el código de estado adecuado | No importa Mongoose ni los Repositories, y no calcula nada |
| Service | Aplica la lógica de negocio: validaciones, existencia de recursos, cálculo del total, estado inicial | No conoce `req`, `res` ni Mongoose |
| Repository | Es el único lugar que accede a Mongoose: consultas, proyecciones y `populate` | No tiene reglas de negocio |
| Model | Define el esquema de cada colección | No contiene lógica de la aplicación |

### Por qué separé Service y Repository

Separé la lógica en dos capas porque cada una tiene una razón distinta para cambiar.

El Service decide qué se puede hacer. Por ejemplo, en `createOrder` valida que lleguen los datos obligatorios, comprueba que el usuario y el comercio existan, calcula el total y define el estado inicial con `ORDER_STATUS.CREATED`. Ahí también vive la regla "si el recurso no existe, es un error 404". No sabe nada de Express ni de Mongoose.

El Repository solo sabe cómo se buscan y se guardan los datos. Por ejemplo, oculta el password con `select('-password')`, resuelve el `populate` en Orders y usa `{ new: true, runValidators: true }` al actualizar. No tiene reglas de negocio.

Con esta separación, si cambia una regla, como el cálculo del total, se toca solo el Service. Si cambia la forma de acceder a los datos, por ejemplo otra base o una capa de caché, se toca solo el Repository y ni el Service ni el Controller se enteran. Además, como el Service no depende de Express ni de Mongoose, su lógica se puede probar sin levantar un servidor ni una base de datos. Como el flujo siempre es el mismo (Controller llama a Service, y Service llama a Repository), también es más fácil entender por dónde pasa cada dato entre las capas.

## Constantes del dominio

Los valores fijos del negocio están centralizados en `src/constants/index.js` como objetos congelados con `Object.freeze`. Los modelos y los services los usan en lugar de escribir strings sueltos.

| Constante | Valores |
| --- | --- |
| `USER_ROLES` | `admin`, `customer`, `store` |
| `ORDER_STATUS` | `created`, `assigned`, `picked_up`, `in_transit`, `delivered`, `cancelled` |
| `DELIVERY_PRIORITY` | `low`, `normal`, `high` |

## Modelo de datos

### User

| Campo | Tipo | Detalle |
| --- | --- | --- |
| `firstName`, `lastName` | String | Obligatorios |
| `email` | String | Obligatorio y único |
| `password` | String | Obligatorio |
| `role` | String | Uno de `USER_ROLES`, por defecto `customer` |
| `documents` | Array | Por defecto vacío |

### Store

| Campo | Tipo | Detalle |
| --- | --- | --- |
| `name`, `address` | String | Obligatorios |
| `owner` | ObjectId | Referencia a un User, obligatorio |
| `isActive` | Boolean | Por defecto `true` |

### Order

| Campo | Tipo | Detalle |
| --- | --- | --- |
| `customer` | ObjectId | Referencia a un User, obligatorio |
| `store` | ObjectId | Referencia a un Store, obligatorio |
| `items` | Array | Cada ítem tiene `name`, `quantity` y `price` |
| `deliveryAddress` | String | Obligatorio |
| `total` | Number | Calculado por el Service |
| `status` | String | Uno de `ORDER_STATUS`, por defecto `created` |
| `priority` | String | Uno de `DELIVERY_PRIORITY`, por defecto `normal` |
| `proof` | Object | Por defecto `null` |

Todos los modelos incluyen `createdAt` y `updatedAt`.

## Endpoints

La URL base en local es `http://localhost:8080`. Los endpoints se pueden probar con Thunder Client, Postman o herramientas similares.

### General

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/health` | Verifica que la API está funcionando |

### Users

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/users` | Lista los usuarios |
| GET | `/api/users/:uid` | Obtiene un usuario |
| POST | `/api/users` | Crea un usuario |
| PUT | `/api/users/:uid` | Actualiza un usuario |
| DELETE | `/api/users/:uid` | Elimina un usuario |

Las consultas y actualizaciones de usuarios no incluyen el campo `password`.

Ejemplo de body para crear un usuario:

```json
{
  "firstName": "Ana",
  "lastName": "Gómez",
  "email": "ana@test.com",
  "password": "123456"
}
```

### Stores

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/stores` | Lista los comercios |
| GET | `/api/stores/:sid` | Obtiene un comercio |
| POST | `/api/stores` | Crea un comercio |
| PUT | `/api/stores/:sid` | Actualiza un comercio |
| DELETE | `/api/stores/:sid` | Elimina un comercio |

Ejemplo de body para crear un comercio:

```json
{
  "name": "Kiosco Centro",
  "address": "Av. Siempre Viva 742",
  "owner": "ID_DEL_USUARIO"
}
```

### Orders

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/orders` | Lista los pedidos, con el cliente (sin password) y el comercio |
| GET | `/api/orders/:oid` | Obtiene un pedido |
| POST | `/api/orders` | Crea un pedido |
| PUT | `/api/orders/:oid/status` | Actualiza el estado de un pedido |
| DELETE | `/api/orders/:oid` | Elimina un pedido |

Al crear un pedido, el Service:

* exige `customer`, `store`, `items` y `deliveryAddress`;
* comprueba que el usuario y el comercio existan;
* calcula el `total` sumando `price × quantity` de cada ítem;
* asigna el estado inicial `created` y la prioridad `normal` si no se envía otra.

Ejemplo de body para crear un pedido (la prioridad es opcional):

```json
{
  "customer": "ID_DEL_USUARIO",
  "store": "ID_DEL_COMERCIO",
  "deliveryAddress": "Calle 456",
  "priority": "high",
  "items": [
    { "name": "Caja mediana", "quantity": 2, "price": 1500 },
    { "name": "Sobre chico", "quantity": 1, "price": 800 }
  ]
}
```

Ejemplo de body para actualizar el estado:

```json
{
  "status": "in_transit"
}
```

## Formato de respuestas y códigos de estado

Las respuestas exitosas tienen esta forma:

```json
{
  "status": "success",
  "payload": {}
}
```

Las respuestas de error tienen esta otra:

```json
{
  "status": "error",
  "message": "Usuario no encontrado"
}
```

| Código | Cuándo se usa |
| --- | --- |
| 200 | Consulta, actualización o eliminación exitosa |
| 201 | Recurso creado |
| 400 | Datos inválidos, faltan campos obligatorios o el ID tiene un formato incorrecto |
| 404 | El recurso solicitado no existe, o la ruta no existe |
| 500 | Error inesperado al listar |

Las reglas de negocio, como "el recurso no existe", las define el Service con un `statusCode` en el error. El Controller usa ese código para responder y, si no hay ninguno, aplica el 400 en las operaciones por ID y de escritura, y el 500 en los listados.

## Autor

Marcos Santiago Carrizo
[MSantiagoCarrizo](https://github.com/MSantiagoCarrizo)
