import VerificationCollection from '../models/VerificationCollection.js';
import { VerificationCollectionBackup } from '../models/verificationCollectionBackupSchema.js';

export const getRecoleccionesYGuardarBackup = async (req, res) => {
  try {
    let { fecha } = req.query;

    if (!fecha) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); 
      fecha = hoy.toISOString().split("T")[0]; 
    }

    const [year, month, day] = fecha.split("-").map(Number);

    const inicioDelDia = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)); 
    const finDelDia = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)); 

    const credits = await VerificationCollection.find({
      estadoDeCredito: { $ne: "Pagado" }
    });

    if (credits.length === 0) {
      return res.status(404).json({
        message: 'No se encontraron registros para guardar.',
        status: false
      });
    }

    const usuariosGuardados = [];
    let registrosGuardados = 0;

    for (const credit of credits) {
      const { numeroDePrestamo, updatedAt } = credit;

      const updatedAtDate = new Date(updatedAt);
      updatedAtDate.setUTCHours(0, 0, 0, 0); 

      if (updatedAtDate >= inicioDelDia && updatedAtDate <= finDelDia) {

        // Verificar si ya existe el numeroDePrestamo en la colección de backups
        const backupExistente = await VerificationCollectionBackup.findOne({ numeroDePrestamo });

        // Si no existe, crear el backup
        if (!backupExistente) {
          const backup = await VerificationCollectionBackup.create(credit.toObject());
          usuariosGuardados.push(backup);
          registrosGuardados++;
        } else {
          console.log(`El número de préstamo ${numeroDePrestamo} ya existe en el backup.`);
        }
      } else {
        console.log(`Registro con número de préstamo ${numeroDePrestamo} no está en el rango de fechas.`);
      }
    }

    if (registrosGuardados === 0) {
      return res.status(404).json({
        message: 'No se encontraron registros para guardar.',
        status:false
      });
    }

    res.status(201).json({
      message: 'Backup realizado con éxito.',
      registrosGuardados,
      status:true
    });

  } catch (error) {
    res.status(500).json({ error: 'Error al guardar en el backup', details: error.message });
  }
};
