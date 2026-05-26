# Doppigram

A Telegram-like chat app with a React frontend and ASP.NET Core backend.

## Quick Start

### 1. Start the backend

```bash
cd backend
dotnet run
# Runs on http://localhost:5000
```

The database (`doppigram.db`) is created automatically on first run.

### 2. Start the frontend

```bash
cd my-app
npm install   # first time only
npm run dev
# Runs on http://localhost:5173
```

### 3. Create the first admin

Open `http://localhost:5173/setup` and create the admin account.

Then log in at `http://localhost:5173/login`.

## Architecture

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite + TailwindCSS |
| Backend | ASP.NET Core 10 Web API |
| Database | SQLite (Entity Framework Core 9) |
| Auth | JWT Bearer (30-day tokens) |
| Real-time | SignalR |
| Files | Local `backend/Uploads/` directory |

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| POST | /api/auth/init-admin | Create first admin |
| GET | /api/users | All users |
| GET | /api/users/lookup?username= | Lookup user |
| GET | /api/chats?userId= | Get user's chats |
| POST | /api/chats | Create chat |
| GET | /api/chats/{id}/messages | Get messages |
| POST | /api/chats/{id}/messages | Send message |
| POST | /api/files/upload | Upload file |
| GET | /api/files/{filename} | Serve file |
| GET | /api/stories?viewerId= | Get active stories |
| POST | /api/stories | Create story |

## SignalR Hub

URL: `/hubs/chat`

Events emitted by server:
- `NewMessage` — new message in a chat
- `TypingStart` / `TypingStop` — typing indicators
- `MessagePinned` — message pin state changed
- `ReactionUpdated` — reaction added/removed
