import mongoose from 'mongoose';

process.env.PORT = '3000';
process.env.MONGODB_URI = 'mongodb://localhost:27017/shipnow-test';
process.env.NODE_ENV = 'test';

mongoose.set('bufferCommands', false);