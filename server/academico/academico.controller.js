import { appDb, gobDb } from "../db/db.js";
import crypto from "crypto";

/**
 * Obtiene los chats disponibles (CLASES) evitando duplicados
 */
export const getChatsDisponibles = async (req, res) => {
    const { id_usuario_app, tipo_externo } = req.currentUser;
    
    try {
        const vista = (tipo_externo === 'ALUMNO') 
            ? 'cache_academico.v_asignaturas_visibles_chat_alumno' 
            : 'cache_academico.v_asignaturas_visibles_chat_profesor';

        // Cambiamos DISTINCT ON a id_asignatura para que salgan todos los chats
        const { rows } = await appDb.query(
            `SELECT DISTINCT ON (id_asignatura)
                id_asignatura as id_chat, 
                nombre_asignatura as nombre,
                nombre_clase as subtitulo,
                false as "esProfesor"
             FROM ${vista} 
             WHERE id_usuario_app = $1 
             ORDER BY id_asignatura ASC`, 
            [id_usuario_app]
        );

        return res.json({ ok: true, chats: rows });

    } catch (error) {
        console.error("Error al obtener chats:", error);
        return res.status(500).json({ ok: false, msg: "Error al obtener chats" });
    }
};

/**
 * Sincronización completa con la DB del Gobierno
 */
export const forzarSync = async (req, res) => {
    const { id_usuario_app, dni, tipo_externo } = req.currentUser;

    try {
        if (tipo_externo === 'ALUMNO') {
            const { rows: extData } = await gobDb.query(`
                SELECT 
                    m.id_usuario_externo, m.id_clase, m.id_oferta, m.estado,
                    c.id_plan, c.curso, c.grupo, c.nombre as nombre_clase,
                    oa.id_asignatura,
                    a.codigo as codigo_asig, a.nombre as nombre_asig
                FROM externo.v_matriculas_actuales m
                JOIN academico.clases c ON m.id_clase = c.id_clase
                JOIN academico.oferta_asignaturas oa ON m.id_oferta = oa.id_oferta
                JOIN academico.asignaturas a ON oa.id_asignatura = a.id_asignatura
                WHERE m.dni = $1`, 
                [dni]
            );

            if (extData.length === 0) return res.json({ ok: true, msg: "Sin datos" });

            await appDb.query("BEGIN");

            // Limpiar datos viejos del usuario
            await appDb.query(`
                DELETE FROM cache_academico.matriculas_asignaturas 
                WHERE id_matricula IN (SELECT id_matricula FROM cache_academico.matriculas WHERE id_usuario_app = $1)`, 
                [id_usuario_app]
            );
            await appDb.query("DELETE FROM cache_academico.matriculas WHERE id_usuario_app = $1", [id_usuario_app]);

            const matriculasProcesadas = {};

            for (const d of extData) {
                // Sincronizar catálogos
                await appDb.query(`INSERT INTO cache_academico.asignaturas (id_asignatura, codigo, nombre) VALUES ($1, $2, $3) ON CONFLICT (id_asignatura) DO UPDATE SET nombre = EXCLUDED.nombre`, [d.id_asignatura, d.codigo_asig, d.nombre_asig]);
                await appDb.query(`INSERT INTO cache_academico.clases (id_clase, id_plan, curso, grupo, nombre) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id_clase) DO UPDATE SET nombre = EXCLUDED.nombre`, [d.id_clase, d.id_plan, d.curso, d.grupo, d.nombre_clase]);
                await appDb.query(`INSERT INTO cache_academico.oferta_asignaturas (id_oferta, id_plan, id_asignatura, curso) VALUES ($1, $2, $3, $4) ON CONFLICT (id_oferta) DO NOTHING`, [d.id_oferta, d.id_plan, d.id_asignatura, d.curso]);

                let idMat;
                if (!matriculasProcesadas[d.id_clase]) {
                    idMat = crypto.randomUUID();
                    await appDb.query(
                        `INSERT INTO cache_academico.matriculas (id_matricula, id_usuario_app, id_clase, id_alumno_externo)
                         VALUES ($1, $2, $3, $4)`,
                        [idMat, id_usuario_app, d.id_clase, d.id_usuario_externo]
                    );
                    matriculasProcesadas[d.id_clase] = idMat;
                } else {
                    idMat = matriculasProcesadas[d.id_clase];
                }

                await appDb.query(
                    `INSERT INTO cache_academico.matriculas_asignaturas (id_matricula, id_oferta, estado)
                     VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
                    [idMat, d.id_oferta, d.estado]
                );
            }
            await appDb.query("COMMIT");
        }
        return res.json({ ok: true, msg: "Sincronización OK" });
    } catch (error) {
        await appDb.query("ROLLBACK");
        console.error("Error Sync:", error);
        return res.status(500).json({ ok: false, msg: "Error" });
    }
};

export const getMiembrosClase = async (req, res) => {
    const { id } = req.params;

    if (!id || id === 'undefined') {
        return res.status(400).json({ ok: false, msg: "ID de clase no válido" });
    }

    try {
        const { rows } = await appDb.query(
            `SELECT id_usuario_app FROM cache_academico.v_miembros_clase WHERE id_asignatura = $1`,
            [id]
        );
        return res.json({ ok: true, ids: rows.map(r => r.id_usuario_app) });
    } catch (error) {
        console.error("Error en getMiembrosClase:", error);
        return res.status(500).json({ ok: false, msg: "Error interno" });
    }
};