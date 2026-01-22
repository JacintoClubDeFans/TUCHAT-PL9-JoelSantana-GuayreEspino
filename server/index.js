// 1. Importaciones modernas (ESM)
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import mensajesRoutes from "./routes/mensajes.routes.js";

import { appDb } from "../server/db/db.js";
import { getRedis } from "./redis.js";

// Importa tus rutas de auth (ajusta la ruta según tu carpeta real)
import authRoutes from "./routes/auth.routes.js"; 
import academicoRoutes from "./routes/academico.routes.js";
import dotenv from 'dotenv';
dotenv.config();
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// 3. Rutas de la API
app.use("/auth", authRoutes);
app.use("/academico", academicoRoutes);
app.use("/mensajes", mensajesRoutes);

// --- Endpoints de Health Check (T5) ---

app.get("/health", (req, res) => {
  res.json({ ok: true, name: "tuchat-server" });
});

// Verifica conexión a la base de datos local (Supabase App)
app.get("/health/db", async (req, res) => {
  try {
    const result = await appDb.query("SELECT 1 AS ok");
    res.json({ ok: true, db: result.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Verifica conexión a Redis (Docker)
app.get("/health/redis", async (req, res) => {
  try {
    const redis = getRedis();
    await redis.set("tuchat:ping", "pong", "EX", 10);
    const val = await redis.get("tuchat:ping");
    res.json({ ok: true, redis: val });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- Configuración de Servidor HTTP y WebSockets ---

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: true, credentials: true },
});

io.on("connection", (socket) => {
  console.log("🚀 Socket conectado:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Socket desconectado:", socket.id);
  });

  socket.on("chat:send", (payload) => {
    io.emit("chat:message", payload);
  });
});

// --- Inicio del servidor ---

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});

io.on("connection", (socket) => {
  // T1: Usuario se une a una sala (asignatura/grupo)
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`👤 Socket ${socket.id} unido a sala: ${roomId}`);
  });

  // Simulación de persistencia de ajustes (T4)
// En producción, carga esto desde tu DB al arrancar el servidor
let ajustesSalas = {
  // "id_clase_ejemplo": { soloProfesores: true, delegados: ["id_alumno_1"] }
};

socket.on("chat:send", async (payload) => {
  const { roomId, senderId, recipients, esProfesor } = payload;
  
  // 1. Verificar Permisos (Modo WhatsApp: Solo Admins)
  const settings = ajustesSalas[roomId] || { soloProfesores: false, delegados: [] };
  const esDelegado = settings.delegados.includes(senderId);
  
  const puedeHablar = !settings.soloProfesores || esProfesor || esDelegado;

  if (!puedeHablar) {
    return socket.emit("error_permisos", { 
      msg: "Solo el profesor o delegados pueden enviar mensajes en este chat." 
    });
  }

  const message = { ...payload, timestamp: Date.now() };

  // 2. Enviar en Tiempo Real
  io.to(roomId).emit("chat:receive", message);

  // 3. Guardar en Redis (Con Bypass por si no tienes Docker/Redis activo)
  if (recipients && Array.isArray(recipients)) {
    try {
      const redis = getRedis();
      if (redis && redis.status === 'ready') {
        for (const userId of recipients) {
          if (userId !== senderId) {
            const key = `pendientes:usuario:${userId}`;
            await redis.lpush(key, JSON.stringify(message));
            await redis.expire(key, 604800);
          }
        }
      }
    } catch (e) {
      console.log("Redis no disponible, mensaje enviado solo en tiempo real.");
    }
  }
});

// Evento para que el profesor cambie los ajustes
socket.on("chat:update_settings", ({ roomId, soloProfesores, delegados, esProfesor }) => {
  // Verificación de seguridad básica: solo el profesor puede cambiar ajustes
  if (esProfesor) {
    // Guardamos en memoria (o base de datos si quieres persistencia real)
    ajustesSalas[roomId] = { 
      soloProfesores, 
      delegados 
    };

    // Notificamos a TODOS en la sala para que sus interfaces se bloqueen/desbloqueen
    io.to(roomId).emit("chat:settings_changed", ajustesSalas[roomId]);
    
    console.log(`Ajustes actualizados en sala ${roomId}: SoloLectura=${soloProfesores}`);
  }
});

  socket.on("disconnect", () => {
    console.log("❌ Socket desconectado:", socket.id);
  });
});