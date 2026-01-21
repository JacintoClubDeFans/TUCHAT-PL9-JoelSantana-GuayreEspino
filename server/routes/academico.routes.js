// server/routes/academico.routes.js
import { Router } from "express";
import { getChatsDisponibles, forzarSync } from "../academico/academico.controller.js";
import { requireAuth } from "../auth/auth.middleware.js";

const router = Router();

// IMPORTANTE: Aplicar el middleware aquí
router.use(requireAuth);

router.get("/chats-disponibles", getChatsDisponibles);
router.post("/sync-forzar", forzarSync);

export default router;