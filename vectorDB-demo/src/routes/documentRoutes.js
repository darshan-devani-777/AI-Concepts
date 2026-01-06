import express from "express";
import { addDocument, chat } from "../controllers/documentController.js";

const router = express.Router();

router.post("/add", addDocument);
router.post("/chat", chat);

export default router;
