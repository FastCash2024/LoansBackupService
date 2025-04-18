import moment from "moment-timezone";
import cron from "node-cron";
import GestionDeAccesosBackupCollection from "../models/GestionDeAccesosBackupCollection.js";
import userSchema from "../models/AuthCollection.js";

export const getCuentasYGuardarBackup = async (req, res) => {
  try {
    const cuentas = await userSchema.find({
      tipoDeGrupo: { $in: ["Asesor de Cobranza", "Asesor de Verificación"] },
      emailPersonal: { $not: { $regex: "^No asignado", $options: "i" } }
    });

    if (cuentas.length === 0) {
      return res.status(404).json({
        message: "No se encontraron cuentas para guardar.",
        status: false
      });
    }

    let registrosGuardados = 0;
    let registrosActualizados = 0;

    console.log("Cuentas encontradas:", cuentas.length);

    for (const cuenta of cuentas) {
      const { _id } = cuenta;
      const fechaBackup = moment().tz("America/Mexico_City").format();

      // Buscar si ya existe un backup para esta cuenta
      const backupExistente = await GestionDeAccesosBackupCollection.findOne({ subId: _id });

      // Crear los datos del backup sin duplicar `_id`
      const backupData = {
        ...cuenta.toObject(),
        subId: _id,
        fechaBackup
      };
      delete backupData._id; // 🔹 Eliminamos el `_id` original para evitar duplicados

      if (!backupExistente) {
        await GestionDeAccesosBackupCollection.create(backupData);
        registrosGuardados++;
      } else {
        await GestionDeAccesosBackupCollection.updateOne(
          { subId: _id },
          { $set: backupData }
        );
        registrosActualizados++;
      }
    }

    res.status(201).json({
      message: "Backup de cuentas realizado con éxito.",
      registrosGuardados,
      registrosActualizados,
      status: true
    });

  } catch (error) {
    console.error("Error al guardar en el backup de cuentas:", error);
    res.status(500).json({ error: "Error al guardar en el backup", details: error.message });
  }
};


cron.schedule("0 0 * * *", () => {
  console.log("Ejecutando asignación de casos a la medianoche...");
  getCuentasYGuardarBackup();
}, {
  timezone: "America/Mexico_City"
});

console.log("Tarea programada para ejecutarse a la medianoche (00:00) hora de México");
