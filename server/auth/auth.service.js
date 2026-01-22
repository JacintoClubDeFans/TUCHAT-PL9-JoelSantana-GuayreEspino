import { appDb, gobDb } from "../db/db.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();

/**
 * Función auxiliar para generar hash SHA256
 */
const sha256 = (input) => crypto.createHash("sha256").update(input).digest("hex");

/**
 * Servicio principal de autenticación y sincronización
 */
export const loginConCredenciales = async ({ identificador, password }) => {
    
    // 1. BUSCAR PERSONA EN DB EXTERNA (Gobcan)
    const { rows: personas } = await gobDb.query(
        `SELECT p.*, ug.id_usuario_externo, ug.tipo, cred.salt, cred.password_sha256_hex, c.codigo_centro
         FROM externo.personas p
         JOIN externo.usuarios_gobierno ug ON ug.id_persona = p.id_persona
         JOIN externo.credenciales_acceso cred ON cred.id_usuario_externo = ug.id_usuario_externo
         JOIN externo.centros c ON c.id_centro = ug.id_centro
         WHERE (TRIM(UPPER(p.dni)) = TRIM(UPPER($1)) OR TRIM(p.cial) = $1)
           AND ug.activo = true AND p.activo = true`,
        [identificador.trim()]
    );

    if (!personas.length) {
        console.log(`[Auth] No se encontró usuario: ${identificador}`);
        throw new Error("INVALID_CREDENTIALS");
    }

    const extUser = personas[0];

    // 2. VERIFICAR CONTRASEÑA
    const saltDB = extUser.salt?.trim() || "";
    const hashDB = extUser.password_sha256_hex?.trim() || "";
    // IMPORTANTE: El orden debe coincidir con como lo guardaste (salt + password)
    const hashCalculado = sha256(saltDB+ password);

    if (hashCalculado !== hashDB) {
        console.log("[Auth] Password incorrecto");
        throw new Error("INVALID_CREDENTIALS");
    }

    // 3. OBTENER ROL LOCAL
    const { rows: roles } = await appDb.query(
        "SELECT id_rol FROM seguridad.roles WHERE nombre = $1", 
        [extUser.tipo.trim()]
    );
    const idRol = roles[0]?.id_rol || 2; // Por defecto Alumno si falla

    // 4. UPSERT DEL USUARIO EN DB LOCAL
    const { rows: usuariosApp } = await appDb.query(
        `INSERT INTO seguridad.usuarios_app (
            id_usuario_externo, dni, cial, id_rol, nombre, apellidos, tipo_externo, codigo_centro, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        ON CONFLICT (id_usuario_externo) DO UPDATE SET
            dni = EXCLUDED.dni,
            nombre = EXCLUDED.nombre,
            apellidos = EXCLUDED.apellidos,
            id_rol = EXCLUDED.id_rol,
            updated_at = NOW()
        RETURNING *`,
        [
            extUser.id_usuario_externo, 
            extUser.dni.trim(), 
            extUser.cial?.trim() || null, 
            idRol, 
            extUser.nombre.trim(), 
            extUser.apellidos.trim(), 
            extUser.tipo.trim(), 
            extUser.codigo_centro.trim()
        ]
    );

    const localUser = usuariosApp[0];

    // 5. SINCRONIZACIÓN ACADÉMICA AUTOMÁTICA (CHATS)
    console.log(`[Sync] Iniciando sincronización para ${localUser.nombre}...`);
    
    try {
        if (localUser.tipo_externo === 'ALUMNO') {
            // Obtener datos de matrícula desde DB Externa
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
                [localUser.dni]
            );

            // LIMPIEZA PREVIA para evitar conflictos de FK o duplicados
            await appDb.query(`
                DELETE FROM cache_academico.matriculas_asignaturas 
                WHERE id_matricula IN (SELECT id_matricula FROM cache_academico.matriculas WHERE id_usuario_app = $1)`, 
                [localUser.id_usuario_app]
            );
            await appDb.query("DELETE FROM cache_academico.matriculas WHERE id_usuario_app = $1", [localUser.id_usuario_app]);

            // Diccionario para evitar duplicar la fila de 'matricula' por clase
            const matriculasPorClase = {};

            for (const d of extData) {
                // Sincronizar tablas maestras (Padres)
                await appDb.query(`INSERT INTO cache_academico.asignaturas (id_asignatura, codigo, nombre) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [d.id_asignatura, d.codigo_asig, d.nombre_asig]);
                await appDb.query(`INSERT INTO cache_academico.oferta_asignaturas (id_oferta, id_plan, id_asignatura, curso) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`, [d.id_oferta, d.id_plan, d.id_asignatura, d.curso]);
                await appDb.query(`INSERT INTO cache_academico.clases (id_clase, id_plan, curso, grupo, nombre) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`, [d.id_clase, d.id_plan, d.curso, d.grupo, d.nombre_clase]);

                let idMatricula;
                if (!matriculasPorClase[d.id_clase]) {
                    idMatricula = crypto.randomUUID();
                    await appDb.query(
                        `INSERT INTO cache_academico.matriculas (id_matricula, id_usuario_app, id_clase, id_alumno_externo)
                         VALUES ($1, $2, $3, $4)`,
                        [idMatricula, localUser.id_usuario_app, d.id_clase, d.id_usuario_externo]
                    );
                    matriculasPorClase[d.id_clase] = idMatricula;
                } else {
                    idMatricula = matriculasPorClase[d.id_clase];
                }

                // Vincular con la oferta (Hijo)
                await appDb.query(
                    `INSERT INTO cache_academico.matriculas_asignaturas (id_matricula, id_oferta, estado)
                     VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
                    [idMatricula, d.id_oferta, d.estado]
                );
            }
            console.log(`[Sync] ${extData.length} registros sincronizados correctamente.`);
        }
        
        // Actualizar estado de sync
        await appDb.query(
            `INSERT INTO seguridad.sync_estado_usuario (id_usuario_app, ultimo_sync, ultimo_sync_ok)
             VALUES ($1, NOW(), true)
             ON CONFLICT (id_usuario_app) DO UPDATE SET ultimo_sync = NOW(), ultimo_sync_ok = true`,
            [localUser.id_usuario_app]
        );

    } catch (syncErr) {
        console.error("[Sync Error] Falló la sincronización automática:", syncErr.message);
        // No lanzamos error para que el usuario pueda entrar aunque el chat tarde en cargar
    }

    // 6. GENERAR TOKEN JWT
    const token = jwt.sign(
        { sub: localUser.id_usuario_app, rol: idRol },
        process.env.JWT_SECRET || 'clave_secreta_temporal',
        { expiresIn: "7d" }
    );

    return {
        token,
        usuario: {
            id: localUser.id_usuario_app,
            nombre: localUser.nombre,
            tipo: localUser.tipo_externo,
            dni: localUser.dni
        }
    };
};