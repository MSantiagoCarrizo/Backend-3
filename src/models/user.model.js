import mongoose from "mongoose";
import { USER_ROLES, DOCUMENT_TYPES } from "../constants/index.js";

const documentSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: Object.values(DOCUMENT_TYPES),
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: false
  }
);

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CUSTOMER
    },
    documents: {
      type: [documentSchema],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const UserModel = mongoose.model("User", userSchema);

export default UserModel;