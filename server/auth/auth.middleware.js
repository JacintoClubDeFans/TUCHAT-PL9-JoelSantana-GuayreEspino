import jwt from "jsonwebtoken";
import { appDb } from "../db/db.js";
import dotenv from 'dotenv';

// Cargamos variables de entorno
dotenv.config();

/**
 * Middleware para proteger rutas privadas
 * 1. Extrae el token del header Authorization (Bearer)
 * 2. Verifica la validez y expiración del JWT
 * 3. Recupera el usuario de la base de datos local (cache_academico / seguridad)
 * 4. Inyecta los datos en req.currentUser para los siguientes controladores
 */
export const requireAuth = async (req, res, next) => {
    // 1. Obtener el header de autorización
    const authHeader = req.headers.authorization;

    // 2. Validar existencia y formato del header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("[Auth Middleware] Intento de acceso sin token o formato inválido");
        return res.status(401).json({
            ok: false,
            error: "NO_TOKEN_PROVIDED",
            msg: "No se proporcionó un token de acceso válido"
        });
    }

    // 3. Extraer el token puro
    const token = authHeader.split(" ")[1];

    try {
        // 4. Verificar el JWT
        // Priorizamos el secreto de .env, si no existe usamos el fallback temporal
        const secret = process.env.JWT_SECRET || 'clave_secreta_temporal';
        const payload = jwt.verify(token, secret);

        // 5. Validar que el payload contiene el ID del usuario (sub)
        if (!payload.sub) {
            return res.status(401).json({
                ok: false,
                error: "INVALID_TOKEN_PAYLOAD",
                msg: "El token no contiene información de usuario válida"
            });
        }

        // 6. Buscar al usuario en la base de datos local (Seguridad)
        // Traemos también el rol y el tipo_externo para saber si es ALUMNO o PROFESOR
        const query = `
            SELECT 
                id_usuario_app, 
                id_usuario_externo, 
                dni, 
                nombre, 
                apellidos, 
                id_rol, 
                tipo_externo, 
                activo
            FROM seguridad.usuarios_app 
            WHERE id_usuario_app = $1
        `;

        const { rows } = await appDb.query(query, [payload.sub]);

        // 7. Verificar si el usuario existe en nuestra DB local
        if (rows.length === 0) {
            console.log(`[Auth Middleware] Usuario con ID ${payload.sub} no encontrado`);
            return res.status(401).json({
                ok: false,
                error: "USER_NOT_FOUND",
                msg: "El usuario ya no existe en el sistema"
            });
        }

        const user = rows[0];

        // 8. Verificar si el usuario está activo
        if (!user.activo) {
            console.log(`[Auth Middleware] Usuario ${user.nombre} intentó entrar estando inactivo`);
            return res.status(403).json({
                ok: false,
                error: "USER_INACTIVE",
                msg: "Tu cuenta ha sido desactivada. Contacta con el administrador."
            });
        }

        // 9. INYECCIÓN CLAVE: Pasamos el usuario a la request
        // Esto permite que 'req.currentUser' esté disponible en controllers como forzarSync
        req.currentUser = {
            id_usuario_app: user.id_usuario_app,
            id_usuario_externo: user.id_usuario_externo,
            dni: user.dni,
            nombre: user.nombre,
            tipo_externo: user.tipo_externo, // Vital para saber qué vista cargar
            id_rol: user.id_rol
        };

        // 10. Continuar al siguiente controlador
        next();

    } catch (error) {
        // 11. Manejo detallado de errores de JWT
        console.error("[Auth Middleware Error]:", error.message);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                ok: false,
                error: "TOKEN_EXPIRED",
                msg: "Tu sesión ha expirado, por favor inicia sesión de nuevo"
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                ok: false,
                error: "INVALID_TOKEN",
                msg: "Token de seguridad inválido o manipulado"
            });
        }

        // Error genérico de base de datos o servidor
        return res.status(500).json({
            ok: false,
            error: "INTERNAL_AUTH_ERROR",
            msg: "Error interno al verificar la identidad"
        });
    }
};