import app from "./app.js";
import connectDB from "./config/db.js";
import { config } from "./config/index.js";
import logger from "./config/logger.js";

const startServer = async () => {
  try {
    await connectDB();

    app.listen(config.port, () => {
      logger.info(`Servidor escuchando en el puerto ${config.port}`);
    });
  } catch (error) {
    logger.fatal(`Error al iniciar el servidor: ${error.message}`);
    process.exitCode = 1;
  }
};

startServer();