import { Router } from "express";
import { getUsers, getUserById, createUser, updateUser, deleteUser, uploadUserDocument } from "../controllers/user.controller.js";
import { uploadDocument } from "../middlewares/upload.middleware.js";

const router = Router();

router.get("/", getUsers);

router.get("/:uid", getUserById);

router.post("/", createUser);

router.post("/:uid/documents", uploadDocument, uploadUserDocument);

router.put("/:uid", updateUser);

router.delete("/:uid", deleteUser);

export default router;