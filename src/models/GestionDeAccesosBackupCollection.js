import mongoose from "mongoose";
//MODELO DE CUENTAS DE ADMINISTRACION
const userSchema = new mongoose.Schema(
  {
    //DATOS DE CUENTA
    origenDeLaCuenta: String,
    tipoDeGrupo: String,
    codificacionDeRoles: String,
    apodo: String,
    cuenta: String,
    situacionLaboral: String,
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    //DATOS DE CUENTA PERSONAL ASIGNADA
    nombrePersonal: String,
    emailPersonal: String,
    fotoURL: String,
    numeroDeTelefonoMovil: String,

    cuentaAuditor: String,
    cuentaPersonalAuditor: String,
    fechaDeAuditoria: String,
    fechaBackup: String,
    subId: String,
  },
  {
    timestamps: true,
    collection: "gestionDeAccesosBackup",
  },
);

export default mongoose.model("GestionDeAccesosBackup", userSchema);
