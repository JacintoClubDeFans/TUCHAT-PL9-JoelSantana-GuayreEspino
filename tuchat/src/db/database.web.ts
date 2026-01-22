// src/db/database.web.ts

export const initDB = () => {
  console.log("DB: Usando LocalStorage (Web Mode)");
};

export const saveMessageLocal = (msg: any) => {
  try {
    const key = `chat_${msg.roomId}`;
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    // Evitar duplicados por msg_id en web también
    if (!history.find((m: any) => m.msg_id === msg.msg_id)) {
      localStorage.setItem(key, JSON.stringify([...history, msg]));
    }
  } catch (e) {
    console.error("Error guardando en LocalStorage", e);
  }
};

export const getMessagesByRoom = (roomId: string): any[] => {
  try {
    return JSON.parse(localStorage.getItem(`chat_${roomId}`) || '[]');
  } catch (e) {
    return [];
  }
};

// --- FUNCIONES PARA BORRADORES EN WEB ---

export const saveDraftLocal = (roomId: string, content: string) => {
  try {
    localStorage.setItem(`draft_${roomId}`, content);
  } catch (e) {
    console.error("Error guardando borrador en Web", e);
  }
};

export const getDraftLocal = (roomId: string): string => {
  try {
    return localStorage.getItem(`draft_${roomId}`) || "";
  } catch (e) {
    return "";
  }
};