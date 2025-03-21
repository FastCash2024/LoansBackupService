import express from "express";
import { getRecoleccionesYGuardarBackup, getVerificationBackups } from "../controllers/backoupController.js";

const router = express.Router();

router.get('/getTodos', getRecoleccionesYGuardarBackup);
router.get('/getCasos', getVerificationBackups);

export default router;