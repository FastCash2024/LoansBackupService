import express from "express";
import { getForVerificationBackups, getRecoleccionesYGuardarBackup, getVerificationBackups } from "../controllers/backoupController.js";

const router = express.Router();

router.get('/getTodos', getRecoleccionesYGuardarBackup);
router.get('/getCasos', getVerificationBackups);
router.get('/getCasosVerificador', getForVerificationBackups);

export default router;