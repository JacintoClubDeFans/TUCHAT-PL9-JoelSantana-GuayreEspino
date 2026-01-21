import { appDb, gobDb } from "../db/db.js";
import crypto from "crypto";

/**
 * Obtiene los chats basados en las asignaturas matriculadas
 */
export const getChatsDisponibles = async (req, res) => {
    const { id_usuario_app, tipo_externo } = req.currentUser;
    
    try {
        const vista = (tipo_externo === 'ALUMNO') 
            ? 'cache_academico.v_asignaturas_visibles_chat_alumno' 
            : 'cache_academico.v_asignaturas_visibles_chat_profesor';

        const { rows } = await appDb.query(
            `SELECT id_asignatura, nombre_asignatura as nombre, nombre_clase as clase 
             FROM ${vista} 
             WHERE id_usuario_app = $1 
             ORDER BY nombre_asignatura ASC`, 
            [id_usuario_app]
        );

        return res.json({ ok: true, chats: rows });

    } catch (error) {
        console.error("Error al obtener chats:", error);
        return res.status(500).json({ ok: false, msg: "Error al obtener chats" });
    }
};

/**
 * Fuerza la sincronización de datos desde la DB externa a la local
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

            console.log(`[Sync] Procesando ${extData.length} registros para el usuario local: ${id_usuario_app}`);

            // Limpieza de seguridad para evitar duplicados
            await appDb.query(`
                DELETE FROM cache_academico.matriculas_asignaturas 
                WHERE id_matricula IN (SELECT id_matricula FROM cache_academico.matriculas WHERE id_usuario_app = $1)`, 
                [id_usuario_app]
            );
            await appDb.query("DELETE FROM cache_academico.matriculas WHERE id_usuario_app = $1", [id_usuario_app]);

            const matriculasExistentes = {};

            for (const d of extData) {
                // Sincronizar Asignaturas
                await appDb.query(`INSERT INTO cache_academico.asignaturas (id_asignatura, codigo, nombre) VALUES ($1, $2, $3) ON CONFLICT (id_asignatura) DO NOTHING`, [d.id_asignatura, d.codigo_asig, d.nombre_asig]);
                // Sincronizar Ofertas
                await appDb.query(`INSERT INTO cache_academico.oferta_asignaturas (id_oferta, id_plan, id_asignatura, curso) VALUES ($1, $2, $3, $4) ON CONFLICT (id_oferta) DO NOTHING`, [d.id_oferta, d.id_plan, d.id_asignatura, d.curso]);
                // Sincronizar Clases
                await appDb.query(`INSERT INTO cache_academico.clases (id_clase, id_plan, curso, grupo, nombre) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id_clase) DO NOTHING`, [d.id_clase, d.id_plan, d.curso, d.grupo, d.nombre_clase]);

                let currentIdMat;
                if (!matriculasExistentes[d.id_clase]) {
                    currentIdMat = crypto.randomUUID();
                    await appDb.query(
                        `INSERT INTO cache_academico.matriculas (id_matricula, id_usuario_app, id_clase, id_alumno_externo)
                         VALUES ($1, $2, $3, $4) ON CONFLICT (id_usuario_app, id_clase) DO UPDATE SET id_alumno_externo = EXCLUDED.id_alumno_externo`,
                        [currentIdMat, id_usuario_app, d.id_clase, d.id_usuario_externo]
                    );
                    matriculasExistentes[d.id_clase] = currentIdMat;
                } else {
                    currentIdMat = matriculasExistentes[d.id_clase];
                }

                await appDb.query(
                    `INSERT INTO cache_academico.matriculas_asignaturas (id_matricula, id_oferta, estado)
                     VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
                    [currentIdMat, d.id_oferta, d.estado]
                );
            }
        }

        return res.json({ ok: true, msg: "Sincronización completada con éxito" });

    } catch (error) {
        console.error("Error crítico en forzarSync:", error);
        return res.status(500).json({ ok: false, msg: "Error interno en el servidor de sincronización" });
    }
};

// NO añadas export default al final, las exportaciones nombradas arriba son suficientes