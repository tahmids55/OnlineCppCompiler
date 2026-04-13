<h1 align="center">⚡ CP Workspace</h1>

<p align="center">
  A browser-based C++ IDE built for competitive programmers.<br/>
  Write, compile, and run code instantly — no setup required.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/C%2B%2B17-g%2B%2B%20%C2%B7%20O2-blue?style=flat-square&logo=cplusplus" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Go-1.22-00ADD8?style=flat-square&logo=go" />
  <img src="https://img.shields.io/badge/Docker-sandbox-2496ED?style=flat-square&logo=docker" />
  <img src="https://img.shields.io/badge/Firebase-auth%20%26%20storage-FFCA28?style=flat-square&logo=firebase" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
</p>

---

## ✨ Features

- **Monaco Editor** — same engine as VS Code, with full C++ syntax highlighting, autocomplete, bracket matching, and code folding
- **Dual execution modes** — Docker sandbox mode for local/VM setups, and Render-compatible local process mode for managed hosting
- **Three resizable panels** — `main.cpp`, `input.txt`, and `output.txt` with draggable dividers
- **Per-panel font zoom** — Ctrl+Scroll inside any panel to resize text independently
- **Guest mode** — run code instantly, no login needed
- **Google Sign-In** — save templates and workspaces to Firestore, restored on next login
- **Keyboard shortcuts** — `Ctrl+Enter` to run, `Ctrl+S` to save workspace
- **Compile error display** — full g++ error output shown directly in the output panel
- **Execution stats** — shows runtime in seconds after each run

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS v4 |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Backend | Go 1.22 · Gin framework |
| Execution | Docker sandbox (optional) · Local g++ runner · GCC/G++ |
| Auth & DB | Firebase Authentication · Firestore |

---

## 🏗 Architecture

```
Browser (React + Monaco)
        │
        │  /api/*
        ▼
Go Backend (Gin)
  ├─ Rate limiting (10 req/min per IP)
  ├─ Firebase token verification
  └─ Execution engine (auto: Docker -> local)
        │
        ▼
Code Runner (per request)
  ├─ Docker container mode (local)
  ├─ Local process mode (Render)
  └─ 2s run timeout
```

---

## 🚀 Quick Start

**Prerequisites:** Go 1.22+, Node.js 20+, a Firebase project

```bash
# 1. Clone
git clone https://github.com/tahmids55/OnlineCppCompiler.git
cd OnlineCppCompiler

# 2. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# → Fill in Firebase credentials in both files

# Optional: enable Docker sandbox mode locally
# docker build -t cpworkspace-sandbox -f docker/Dockerfile.sandbox docker/
# then set EXECUTION_MODE=docker in backend/.env

# 3. Start backend  (terminal 1)
cd backend && go run .

# 4. Start frontend  (terminal 2)
cd frontend && npm install && npm run dev
```

Open **http://localhost:5173** — done.

---

## ☁️ Deploy on Render (GitHub Blueprint)

This repo now includes a root-level `render.yaml` for one-click Blueprint deploy.

1. Push these changes to GitHub.
2. In Render Dashboard, choose **New +** → **Blueprint**.
3. Connect your GitHub repo and select the branch.
4. Render will create two services from `render.yaml`:
  - `cpworkspace-backend` (Docker web service)
  - `cpworkspace-frontend` (Static site)
5. During first deploy, provide values for all `sync: false` env vars.
6. Set frontend `VITE_API_URL` to your backend public URL, for example:
  - `https://cpworkspace-backend.onrender.com`

The backend is preconfigured with `EXECUTION_MODE=local` for Render.

---

## 🔑 Environment Variables

**`backend/.env`**
```env
PORT=8080
EXECUTION_MODE=auto
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
FIREBASE_CREDENTIALS=../your-service-account.json
# FIREBASE_CREDENTIALS_JSON={...}
```

**`frontend/.env`**
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_API_URL=          # local dev: empty, Render: set backend URL
```

---

## 🔒 Docker Sandbox Security

When `EXECUTION_MODE=docker`, every code execution is isolated:

| Constraint | Value |
|---|---|
| Network | Disabled (`--network=none`) |
| Memory | 256 MB |
| CPU | 1 core |
| Max processes | 64 |
| Timeout | 2 seconds |
| Filesystem | Read-only root + tmpfs `/tmp` |
| Privilege escalation | Blocked (`--no-new-privileges`) |
| Cleanup | Automatic (`--rm` + temp dir deleted) |

In `EXECUTION_MODE=local` (Render default), execution still uses strict request timeouts, but does not provide container-level isolation.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Enter` | Run code |
| `Ctrl + S` | Save workspace (signed in) |
| `Ctrl + Scroll` | Zoom font in current panel |

---

## 📁 Project Structure

```
├── backend/
│   ├── api/           # /api/run, /api/save-template, etc.
│   ├── auth/          # Firebase Admin SDK
│   ├── execution/     # Docker/local execution engine
│   ├── middleware/    # Auth + rate limiting
│   └── main.go
├── frontend/
│   └── src/
│       ├── components/   # CodeEditor, InputPanel, OutputPanel, Header, Toolbar
│       ├── hooks/        # useAuth
│       └── lib/          # api.ts, firebase.ts, constants.ts
├── docker/
│   ├── Dockerfile.sandbox
│   └── run.sh            # compile + execute script inside container
├── render.yaml
└── backend/Dockerfile.render
    
```

---

## 📄 License

MIT
