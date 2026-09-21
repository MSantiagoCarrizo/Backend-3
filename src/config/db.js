import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("Falta la variable MONGODB_URI");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB conectado");
};

export default connectDB;
