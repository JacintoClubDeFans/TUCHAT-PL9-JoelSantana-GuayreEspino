import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('tuchat.db');

export const initDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS mensajes_locales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      msg_id TEXT UNIQUE,
      roomId TEXT,
      senderId TEXT,
      senderName TEXT,
      text TEXT,
      image TEXT,
      timestamp INTEGER
    );
    CREATE TABLE IF NOT EXISTS drafts (
      roomId TEXT PRIMARY KEY,
      content TEXT
    );
  `);
};

export const saveMessageLocal = (msg: any) => {
  try {
    db.runSync(
      'INSERT OR IGNORE INTO mensajes_locales (msg_id, roomId, senderId, senderName, text, image, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [msg.msg_id, msg.roomId, msg.senderId, msg.senderName || "Usuario", msg.text, msg.image, msg.timestamp]
    );
  } catch (e) { console.error("Error saveMessageLocal:", e); }
};

export const getMessagesByRoom = (roomId: string): any[] => {
  try {
    return db.getAllSync('SELECT * FROM mensajes_locales WHERE roomId = ? ORDER BY timestamp ASC', [roomId]);
  } catch (e) { return []; }
};

export const saveDraftLocal = (roomId: string, content: string) => {
  try {
    db.runSync('INSERT OR REPLACE INTO drafts (roomId, content) VALUES (?, ?)', [roomId, content]);
  } catch (e) { console.error("Error saveDraftLocal:", e); }
};

export const getDraftLocal = (roomId: string): string => {
  try {
    const row: any = db.getFirstSync('SELECT content FROM drafts WHERE roomId = ?', [roomId]);
    return row ? row.content : "";
  } catch (e) { return ""; }
};