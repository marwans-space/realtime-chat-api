# Realtime Chat

A responsive real-time chat application with a React and TypeScript frontend and a FastAPI backend. It includes account registration and login, username discovery, conversation history, live message delivery, light and dark themes, and Progressive Web App support.

## Features

- Register and sign in with a username or email address.
- Search for other users by username and start a conversation.
- Load conversation history and exchange messages in real time.
- Save messages to PostgreSQL before broadcasting them to connected recipients.
- Switch between light and dark themes; the selected theme is saved in the browser.
- Use a responsive interface on mobile and desktop. The frontend build also generates a PWA manifest and service worker.

## Technology

- Frontend: React, TypeScript, React Router, Tailwind CSS, Zod, Vite
- Backend: FastAPI, SQLAlchemy (async), Pydantic Settings, Alembic
- Database: PostgreSQL
- Live delivery: WebSockets

## Requirements

- Python 3.11 or newer
- PostgreSQL
- Node.js and npm
- [uv](https://docs.astral.sh/uv/) for installing backend dependencies

If needed, install uv with `python -m pip install uv`.

## Local development

### 1. Configure the backend

Create `app/.env` with a PostgreSQL connection URL and a private JWT signing secret:

```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/realtime_chat
JWT_SECRET=replace-this-with-a-long-random-secret
```

Keep this file private and do not commit real credentials.

Install the backend dependencies and apply the database migrations:

```powershell
cd app
uv sync --no-install-project
uv run alembic upgrade head
```

Start the API from the `app` directory:

```powershell
uv run uvicorn main:app --reload
```

The API is available at `http://localhost:8000`. Interactive API documentation is at `http://localhost:8000/docs`, and the health endpoint is `http://localhost:8000/health`.

### 2. Configure and run the frontend

In a second terminal opened at the repository root, create `frontend/.env.local`:


```env
VITE_API_URL=http://localhost:8000
```

Do not add a trailing slash to `VITE_API_URL`. Then install dependencies and start Vite:

```powershell
cd frontend
npm ci
npm run dev
```

Open the local URL printed by Vite (by default, `http://localhost:5173`). The backend currently allows browser requests from `http://localhost:5173` and `http://127.0.0.1:5173`; update the CORS configuration in `app/main.py` for other origins or a production deployment.

## Useful frontend commands

Run these from `frontend/`:

```powershell
npm run build
npm run lint
npm run preview
```

The production build is written to `frontend/dist/`. Serve the production PWA over HTTPS, or from `localhost` during development, for service-worker features.

## API overview

Authenticated HTTP endpoints use a bearer access token returned by registration or login.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Sign in with a username or email |
| `GET` | `/auth/me` | Get the current user's profile |
| `GET` | `/users/search?q=<username>` | Search usernames, excluding the current user |
| `GET` | `/chat/conversation` | List the current user's conversations |
| `GET` | `/chat/conversation/{conversation_id}/messages` | Load a conversation's messages |
| `POST` | `/chat/messages` | Save a message and broadcast it to the recipient |
| `WS` | `/ws/?token=<access_token>` | Connect for incoming real-time messages |

Username search returns up to 20 matching users. The browser connects to the WebSocket with the access token and sends messages through the authenticated HTTP endpoint; the API stores each message before broadcasting it to a connected recipient.
