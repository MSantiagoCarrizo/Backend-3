import mongoose from "mongoose";
import { config } from "./index.js";

const connectDB = async () => {
  await mongoose.connect(config.mongoUri);
  console.log("MongoDB conectado");
};

export default connectDB;