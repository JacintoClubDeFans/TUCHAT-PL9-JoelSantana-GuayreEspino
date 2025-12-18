# TUCHAT (PL9)

Aplicación de comunicación educativa tipo chat.

Monorepo con:
- App: Expo (React Native) + Web (UI compartida)
- Backend: Node.js (Express) + Socket.IO
- Infra local: Redis (Docker)
- BD relacional (cloud): Supabase (PostgreSQL)
- Deploy (Web): Vercel
- Estilos (CSS): Tailwind

## Estructura del proyecto
- `tuchat/`  -> App (Expo)
- `server/`  -> API + WebSocket (Node)
- `docker-compose.yml` -> Redis (local)

## Requisitos
- Node.js (recomendado LTS)
- Git
- Docker Desktop
- Cuenta Supabase (gratis)

## Puertos (local)
- API: http://localhost:4000
- Redis: 6379

## 1) Clonar el repositorio
```bash
git clone https://github.com/JacintoClubDeFans/TUCHAT-PL9-JoelSantana-GuayreEspino.git
cd TUCHAT-PL9-JoelSantana-GuayreEspino
```

## 2) Levantar MySQL + Redis (Docker)
```bash
docker compose up -d
docker ps
```

Adminer:

- URL: http://localhost:8080

- System: MySQL

- Server: tuchat-mysql (recomendado)

- User: tuchat_user

- Password: tuchat_pass

- Database: tuchat

## 3) Crear proyecto en Supabase (Postgres)

- Crea un proyecto en Supabase (plan gratis)

- Copia la cadena de conexión de la BD (DATABASE_URL) desde:
    Project Settings -> Database -> Connection string

## 4) Backend (Node) - Instalar y arrancar
```bash
cd server
npm install
```

Crear server/.env
```bash
PORT=4000

# Supabase Postgres (usa tu URL real)
DATABASE_URL=TU_DATABASE_URL_DE_SUPABASE

# Redis local
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

Notas:

Si NO tienes XAMPP ocupando 3306, puedes usar MYSQL_PORT=3306.

Si tienes XAMPP, lo recomendable es mapear Docker MySQL a 3307:3306 en docker-compose.yml y dejar MYSQL_PORT=3307.

```bash
npm run dev

curl http://localhost:4000/health
curl http://localhost:4000/health/redis
```

## 5) App (Expo + Web) - Instalar y arrancar
```bash
cd tuchat
npm install
npx expo start -c
```

Atajos:

- w abre Web

- a abre Android (emulador)

- QR con Expo Go (móvil)

## 6) Comandos rápidos (levantar todo desde cero)
Terminal 1 (infra):

```bash
docker compose up -d
```

Terminal 2 (backend):

```bash
cd server
npm install
npm run dev
```

Terminal 3 (app):

```bash
cd tuchat
npm install
npx expo start -c
```

Parar todo

```bash
docker compose down
```
