import { Router } from "express";
import { getChatsDisponibles, forzarSync, getMiembrosClase } from "../academico/academico.controller.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { appDb } from "../db/db.js";

const router = Router();

router.use(requireAuth);

router.get("/chats-disponibles", getChatsDisponibles);
router.post("/sync-forzar", forzarSync);
router.get("/miembros/:id", requireAuth, getMiembrosClase);

// T2: Endpoint para que el móvil sepa a quién notificar en Redis
router.get("/miembros-clase/:asignaturaId", async (req, res) => {
  try {
    const { asignaturaId } = req.params;
    // Ajusta esta consulta según el nombre de tu tabla de matriculas/inscripciones
    const result = await appDb.query(
      "SELECT id_usuario FROM matriculas WHERE id_asignatura = $1", 
      [asignaturaId]
    );
    const ids = result.rows.map(row => row.id_usuario);
    res.json({ ok: true, ids });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// server/routes/academico.routes.js

router.get("/miembros-detalle/:asignaturaId", async (req, res) => {
  try {
    const { asignaturaId } = req.params;

    // 1. Obtenemos todos los usuarios (Alumnos y Profesores) vinculados a la asignatura
    // Usamos un LEFT JOIN para asegurar que traemos la información de la tabla usuarios
    const query = `
      SELECT 
        u.id_usuario, 
        u.nombre, 
        u.es_profesor
      FROM usuarios u
      JOIN matriculas m ON u.id_usuario = m.id_usuario
      WHERE m.id_asignatura = $1
      ORDER BY u.es_profesor DESC, u.nombre ASC
    `;

    const result = await appDb.query(query, [asignaturaId]);

    // 2. Obtenemos la configuración actual del chat desde la memoria (ajustesSalas)
    // Si no existe, devolvemos un objeto por defecto
    const config = ajustesSalas[asignaturaId] || { 
      soloProfesores: false, 
      delegados: [] 
    };

    // 3. Respondemos con el formato exacto que espera el componente de React Native
    res.json({
      ok: true,
      usuarios: result.rows,
      config: {
        soloLectura: config.soloProfesores, // Mapeamos el nombre de la variable
        delegados: config.delegados
      }
    });

  } catch (e) {
    console.error("Error en miembros-detalle:", e);
    res.status(500).json({ 
      ok: false, 
      error: "Error al obtener los participantes de la clase" 
    });
  }
});

export default router;