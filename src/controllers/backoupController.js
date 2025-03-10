import VerificationCollection from '../models/VerificationCollection.js';
import { VerificationCollectionBackup } from '../models/verificationCollectionBackupSchema.js';

export const getRecoleccionesYGuardarBackup = async (req, res) => {
  try {
    let { fecha } = req.query;

    if (!fecha) {
      const hoy = new Date();
      fecha = hoy.toISOString().split("T")[0];
    }

    const inicioDelDia = new Date(`${fecha}T00:00:00.000Z`);
    const finDelDia = new Date(`${fecha}T23:59:59.999Z`);

    const credits = await VerificationCollection.find({
      updatedAt: { $gte: inicioDelDia, $lte: finDelDia },
      estadoDeCredito: { $ne: "Pagado" }
    });

    if (credits.length === 0) {
      return res.status(404).json({ message: 'No se encontraron registros para esta fecha' });
    }

    let usuarios = credits;

    if (!Array.isArray(usuarios)) {
      usuarios = [usuarios];
    }

    const usuariosGuardados = await VerificationCollectionBackup.insertMany(usuarios);

    res.status(201).json({
      message: "Usuarios registrados con éxito y backup realizado",
      usuarios: usuariosGuardados,
      credits
    });
    
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'El numeroDePrestamo ya existe' });
    } else {
      res.status(500).json({ error: 'Error al guardar en el backup', details: error.message });
    }
  }
};
