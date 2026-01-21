import { loginConCredenciales } from "./auth.service.js";

/**
 * Controlador para manejar el inicio de sesión
 * Realiza la validación, sincroniza datos académicos y devuelve el token
 */
export const login = async (req, res) => {
  try {
    const { identificador, password } = req.body;

    // 1. Validación básica de entrada
    if (!identificador || !password) {
      return res.status(400).json({ 
        ok: false, 
        error: "MISSING_FIELDS",
        msg: "DNI/CIAL y contraseña son obligatorios" 
      });
    }

    console.log(`[Auth] Intento de login para: ${identificador}`);

    // 2. Llamada al servicio
    // Este servicio ya debe encargarse de:
    // - Validar contra la DB externa (Gobcan)
    // - Crear/Actualizar el usuario en seguridad.usuarios_app local
    // - SINCRONIZAR las asignaturas y matrículas en la DB local
    const result = await loginConCredenciales({ identificador, password });

    // 3. Respuesta exitosa
    // Al llegar aquí, el 'result' ya contiene el usuario local y el token JWT
    console.log(`[Auth] Login y Sincronización exitosa: ${result.usuario.nombre}`);

    return res.json({
      ok: true,
      token: result.token,
      usuario: {
        id: result.usuario.id_usuario_app,
        nombre: result.usuario.nombre,
        dni: result.usuario.dni,
        rol: result.usuario.id_rol
      }
    });

  } catch (err) {
    console.error("[Login Error]:", err.message);

    // 4. Manejo de errores específicos
    
    // Credenciales incorrectas
    if (err.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ 
        ok: false, 
        error: "INVALID_CREDENTIALS",
        msg: "Usuario o contraseña incorrectos" 
      });
    }

    // Errores de red o base de datos (Supabase externa o local)
    if (err.message.includes("getaddrinfo") || err.message.includes("connection") || err.message.includes("ECONNREFUSED")) {
      return res.status(503).json({
        ok: false,
        error: "DB_CONNECTION_ERROR",
        msg: "Error de conexión con los servicios de base de datos. Revisa tu conexión a internet."
      });
    }

    // Error de Base de Datos local (Postgres)
    if (err.code && err.code.startsWith('23')) {
      return res.status(500).json({
        ok: false,
        error: "DB_INTEGRITY_ERROR",
        msg: "Error al sincronizar los datos locales."
      });
    }

    // 5. Error genérico (Fallback)
    return res.status(500).json({ 
      ok: false, 
      error: "SERVER_ERROR", 
      msg: "Ocurrió un error inesperado en el servidor." 
    });
  }
};

/**
 * Endpoint opcional para verificar si el token sigue siendo válido
 */
export const checkStatus = async (req, res) => {
  // Si pasa por el middleware requireAuth, req.currentUser ya existe
  return res.json({
    ok: true,
    usuario: req.currentUser
  });
};