import express from "express";
import authRoutes from "./routes/auth.routes.js";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);

export default app;
