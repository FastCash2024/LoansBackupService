import express from "express";
import { saveBackoup } from "../controllers/backoupController.js";

const router = express.Router();

router.post('/savebackoup', saveBackoup);

export default router;