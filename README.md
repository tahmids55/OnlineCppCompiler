# CP Workspace — Online Competitive Programming C++ Environment

A browser-based competitive programming IDE where users can write, compile, and run C++ code instantly. Built with React, Go, and Docker for secure sandboxed execution.

## Architecture

```
┌─────────────────────────────────────┐
│           Browser (Client)          │
│  React + TypeScript + TailwindCSS   │
│  Monaco Editor · Firebase Auth      │
└──────────────┬──────────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────────┐
│          Go Backend (Gin)           │
│  /api/run  /api/save  /api/load     │
│  Rate limiting · Auth verification  │
└──────────────┬──────────────────────┘
               │ Docker SDK
               ▼
┌─────────────────────────────────────┐
│      Sandbox Container (Docker)     │
│  Alpine + GCC · No network          │
│  2s timeout · 256MB memory          │
└─────────────────────────────────────┘
```

## Features

- **Monaco Editor** with C++ syntax highlighting, autocomplete, bracket matching, code folding
- **Instant compilation** using g++ with C++17 and O2 optimization
- **Secure sandboxed execution** — all code runs in isolated Docker containers
- **Guest mode** — no login required, write code and run immediately
- **Google Sign-In** — save templates, workspaces, and preferences
- **Keyboard shortcuts** — Ctrl+Enter to run, Ctrl+S to save
- **Dark theme** — JetBrains Mono font, minimal distraction-free UI

## Project Structure

```
├── backend/
│   ├── main.go                 # Server entrypoint
│   ├── api/
│   │   ├── run.go              # POST /api/run handler
│   │   └── workspace.go        # Save/load template & workspace
│   ├── auth/
│   │   └── firebase.go         # Firebase Admin SDK init & token verification
│   ├── execution/
│   │   └── executor.go         # Docker sandbox execution engine
│   ├── middleware/
│   │   ├── auth.go             # JWT verification middleware
│   │   └── ratelimit.go        # IP-based rate limiter
│   ├── go.mod
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Main application component
│   │   ├── main.tsx            # Entry point
│   │   ├── index.css           # Tailwind + theme styles
│   │   ├── components/
│   │   │   ├── Header.tsx      # Top bar with filename
│   │   │   ├── CodeEditor.tsx  # Monaco editor wrapper
│   │   │   ├── InputPanel.tsx  # input.txt editor
│   │   │   ├── OutputPanel.tsx # output.txt viewer
│   │   │   └── Toolbar.tsx     # Run, Save, Reset, Auth buttons
│   │   ├── hooks/
│   │   │   └── useAuth.ts      # Firebase auth state hook
│   │   ├── lib/
│   │   │   ├── api.ts          # API client functions
│   │   │   ├── constants.ts    # Default template & config
│   │   │   └── firebase.ts     # Firebase client SDK init
│   │   └── types/
│   │       └── index.ts        # TypeScript interfaces
│   ├── index.html
│   ├── vite.config.ts
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env.example
├── docker/
│   ├── Dockerfile.sandbox      # Sandbox container image
│   ├── run.sh                  # Compile & execute script
│   └── entrypoint.sh           # Backend container entrypoint
├── docker-compose.yml
├── render.yaml                 # Render deployment config
└── README.md
```

## Prerequisites

- **Docker** (with Docker Compose)
- **Node.js 20+** (for frontend development)
- **Go 1.22+** (for backend development)
- **Firebase project** (for authentication & Firestore)

## Quick Start (Local Development)

### 1. Clone and set up environment

```bash
# Copy environment files
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Edit with your Firebase credentials
```

### 2. Build the sandbox image

```bash
cd docker
docker build -t cpworkspace-sandbox -f Dockerfile.sandbox .
cd ..
```

### 3. Start the backend

```bash
cd backend
go mod tidy
go run .
# Server starts on :8080
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
# Dev server starts on :5173
```

### 5. Open browser

Navigate to `http://localhost:5173`

## Docker Compose (Full Stack)

```bash
docker compose up --build
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:8080`

## Firebase Setup

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → **Google** provider
4. Enable **Firestore Database**

### 2. Get frontend credentials

1. Go to Project Settings → General
2. Under "Your apps", add a Web app
3. Copy the Firebase config values into `frontend/.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Get backend credentials

1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file
4. Set the path in `backend/.env`:

```env
FIREBASE_CREDENTIALS=onlinecppcompiler-firebase-adminsdk-fbsvc-6f0c2571a2.json
```

Or set the raw JSON as an environment variable:

```env
FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}
```

### 4. Firestore rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /templates/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /workspace/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## API Reference

### POST /api/run

Execute C++ code in a sandboxed container.

**Request:**
```json
{
  "code": "#include <bits/stdc++.h>\nusing namespace std;\nint main() { cout << \"Hello\"; }",
  "input": "42"
}
```

**Response:**
```json
{
  "output": "Hello",
  "error": "",
  "compile_error": "",
  "execution_time": 0.234,
  "exit_code": 0,
  "timed_out": false
}
```

### POST /api/save-template (Auth required)

Save a code template.

**Headers:** `Authorization: Bearer <firebase_id_token>`

**Request:** `{ "code": "..." }`

### GET /api/load-template (Auth required)

Load saved code template.

**Response:** `{ "code": "..." }`

### POST /api/save-workspace (Auth required)

Save current workspace state.

**Request:** `{ "main_cpp": "...", "input_txt": "..." }`

### GET /api/load-workspace (Auth required)

Load saved workspace.

**Response:** `{ "main_cpp": "...", "input_txt": "..." }`

## Security

### Sandbox Isolation

Every code execution runs in a Docker container with:

| Constraint | Value |
|---|---|
| Network | **Disabled** (`--network=none`) |
| Memory | **256MB** (`--memory=256m`) |
| CPU | **1 core** (`--cpus=1`) |
| PIDs | **64 max** (`--pids-limit=64`) |
| Timeout | **2 seconds** (via `timeout` command) |
| Filesystem | **Read-only root** (`--read-only`) |
| Privileges | **No escalation** (`--security-opt=no-new-privileges`) |
| Cleanup | **Automatic** (`--rm` + temp dir deletion) |

### Rate Limiting

- `/api/run` endpoint: **10 requests per minute** per IP
- Other endpoints: No rate limit

### Authentication

- Firebase ID tokens verified server-side using Firebase Admin SDK
- Guest users can only run code — no persistence
- Authenticated users get full save/load access

## Deployment on Render

### Option 1: Using render.yaml (Blueprint)

1. Push repo to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New" → "Blueprint"
4. Connect your repo
5. Render auto-detects `render.yaml` and creates services
6. Set environment variables in the Render dashboard

### Option 2: Manual Setup

**Backend:**
1. New → Web Service → Docker
2. Set Docker file path: `backend/Dockerfile`
3. Set Docker context: `.` (root)
4. Add env vars: `PORT=8080`, `FIREBASE_CREDENTIALS_JSON=...`, `ALLOWED_ORIGINS=...`

**Frontend:**  
1. New → Static Site
2. Build command: `cd frontend && npm ci && npm run build`
3. Publish directory: `frontend/dist`
4. Add env vars for Firebase config
5. Add rewrite rule: `/api/*` → `https://your-backend.onrender.com/api/*`

> **Note:** Render free tier has Docker support but may have limitations with Docker-in-Docker. For production, consider a VPS with full Docker access (DigitalOcean, Hetzner, or AWS EC2).

## Testing

### Manual testing

1. Start the full stack (backend + frontend)
2. Write a simple C++ program:
   ```cpp
   #include <bits/stdc++.h>
   using namespace std;
   int main() {
       int n; cin >> n;
       cout << n * 2 << endl;
   }
   ```
3. Enter `42` in the input panel
4. Click "Run" or press Ctrl+Enter
5. Verify output shows `84`

### Test compilation errors

```cpp
int main() {
    undeclared_variable = 5;
}
```

Expected: Compilation error message in output panel.

### Test time limit

```cpp
#include <bits/stdc++.h>
int main() {
    while(true);
}
```

Expected: "Time Limit Exceeded" after 2 seconds.

### Test memory limit

```cpp
#include <bits/stdc++.h>
int main() {
    std::vector<int> v(1e9);
}
```

Expected: Runtime error (killed by memory limit).

### Test authentication

1. Click "Sign in with Google"
2. Complete OAuth flow
3. Verify "Save Template", "Load Template", "Save Workspace" buttons appear
4. Save and reload workspace
5. Sign out and verify buttons disappear

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Enter` | Run code |
| `Ctrl+S` | Save workspace (when signed in) |

## License

MIT
