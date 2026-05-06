# MERN AI Task Processing Platform

Small AI task processing platform with MERN, Python worker, Redis queue, and MongoDB.

## Features
- JWT auth with bcrypt hashing
- Async task processing via Redis Streams
- Task status tracking, logs, and results
- Dockerized services for local development

## Local setup (Docker)
```bash
docker compose up --build
```

Frontend: http://localhost:5173
Backend: http://localhost:5000

## Environment
Copy `.env.example` to `.env` and update values as needed.

## Scripts
- Backend: `npm run dev` in `backend/`
- Frontend: `npm run dev` in `frontend/`

## Repos
- App repo: `mern-ai-task-app`
- Infra repo: `mern-ai-task-infra`
