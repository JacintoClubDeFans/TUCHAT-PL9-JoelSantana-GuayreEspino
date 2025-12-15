const express = require("express");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const { getPool } = require("./db");
const { getRedis } = require("./redis");


const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, name: "tuchat-server" });
});

app.get("/health/mysql", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json({ ok: true, mysql: rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

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


const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: true, credentials: true },
});

io.on("connection", (socket) => {
  console.log("Socket conectado:", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket desconectado:", socket.id);
  });

  // Ejemplo: escuchar un mensaje y retransmitirlo
  socket.on("chat:send", (payload) => {
    // payload: { roomId, fromUserId, ciphertext, msgId, ts }
    io.emit("chat:message", payload);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`API + WS corriendo en http://localhost:${PORT}`);
});
