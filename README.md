# TUCHAT (PL9)

Aplicación de comunicación educativa tipo chat.
Monorepo con:
- App: Expo (React Native) + Web (UI compartida)
- Backend: Node.js (Express) + Socket.IO
- Infra local: MySQL + Redis + Adminer (Docker)

## Estructura del proyecto
- `tuchat/`  -> App (Expo)
- `server/`  -> API + WebSocket (Node)
- `docker-compose.yml` -> MySQL + Redis + Adminer

## Requisitos
- Node.js (recomendado LTS)
- Git
- Docker Desktop

## Puertos (local)
- API: http://localhost:4000
- MySQL: 3306 o 3307 (según tu configuración)
- Redis: 6379
- Adminer: http://localhost:8080

## 1) Clonar el repositorio
```bash
git clone https://github.com/JacintoClubDeFans/TUCHAT-PL9-JoelSantana-GuayreEspino.git
cd <TUREPOSITORIO>
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

## 3) Backend (Node) - Instalar y arrancar
```bash
cd server
npm install
```

Crear server/.env
```bash
PORT=4000

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3307
MYSQL_DATABASE=tuchat
MYSQL_USER=tuchat_user
MYSQL_PASSWORD=tuchat_pass

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

Notas:

Si NO tienes XAMPP ocupando 3306, puedes usar MYSQL_PORT=3306.

Si tienes XAMPP, lo recomendable es mapear Docker MySQL a 3307:3306 en docker-compose.yml y dejar MYSQL_PORT=3307.

```bash
npm run dev

curl http://localhost:4000/health
curl http://localhost:4000/health/mysql
curl http://localhost:4000/health/redis
```

## 4) App (Expo + Web) - Instalar y arrancar
```bash
cd tuchat
npm install
npx expo start -c
```

Atajos:

- w abre Web

- a abre Android (emulador)

- QR con Expo Go (móvil)

## 5) Comandos rápidos (levantar todo desde cero)
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
