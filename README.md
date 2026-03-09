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
- **Secure sandbox** — every execution runs in an isolated Docker container with no network, 256MB memory cap, 2s timeout, and read-only filesystem
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
| Sandbox | Docker · Alpine Linux · GCC/G++ |
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
  └─ Docker SDK
        │
        ▼
Sandbox Container (per request)
  ├─ --network=none
  ├─ --memory=256m
  ├─ --read-only filesystem
  ├─ 2s execution timeout
  └─ auto-removed after run
```

---

## 🚀 Quick Start

**Prerequisites:** Docker, Go 1.22+, Node.js 20+, a Firebase project

```bash
# 1. Clone
git clone https://github.com/tahmids55/OnlineCppCompiler.git
cd OnlineCppCompiler

# 2. Build the sandbox image
docker build -t cpworkspace-sandbox -f docker/Dockerfile.sandbox docker/

# 3. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# → Fill in Firebase credentials in both files

# 4. Start backend  (terminal 1)
cd backend && go run .

# 5. Start frontend  (terminal 2)
cd frontend && npm install && npm run dev
```

Open **http://localhost:5173** — done.

---

## 🔑 Environment Variables

**`backend/.env`**
```env
PORT=8080
ALLOWED_ORIGINS=http://localhost:5173
FIREBASE_CREDENTIALS=../your-service-account.json
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
VITE_API_URL=          # leave empty — Vite proxies /api/* to :8080
```

---

## 🔒 Sandbox Security

Every code execution is isolated:

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
│   ├── execution/     # Docker sandbox engine
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
└── docker-compose.yml
```

---

## 📄 License

MIT
