#!/bin/bash
set -e

ROOT="/mnt/B6C8C933C8C8F2A3/Project/Running/OnlineC++compiler"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  echo -e "${GREEN}Done.${NC}"
}
trap cleanup EXIT INT TERM

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  CP Workspace — starting servers${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ── Backend ──────────────────────────────────────────────
if [ ! -f "$ROOT/backend/.env" ]; then
  echo -e "${RED}✗ backend/.env not found. Copy backend/.env.example and fill in credentials.${NC}"
  exit 1
fi

echo -e "${GREEN}▶ Starting backend  (http://localhost:8080)${NC}"
cd "$ROOT/backend"
sg docker -c "go run ." > /tmp/cpworkspace-backend.log 2>&1 &
BACKEND_PID=$!

# ── Frontend ─────────────────────────────────────────────
if [ ! -f "$ROOT/frontend/.env" ]; then
  echo -e "${RED}✗ frontend/.env not found. Copy frontend/.env.example and fill in credentials.${NC}"
  exit 1
fi

echo -e "${GREEN}▶ Starting frontend (http://localhost:5173)${NC}"
cd "$ROOT/frontend"
npm run dev > /tmp/cpworkspace-frontend.log 2>&1 &
FRONTEND_PID=$!

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Backend  → ${CYAN}http://localhost:8080${NC}"
echo -e "  Frontend → ${CYAN}http://localhost:5173${NC}"
echo -e "  Logs     → ${YELLOW}/tmp/cpworkspace-backend.log${NC}"
echo -e "             ${YELLOW}/tmp/cpworkspace-frontend.log${NC}"
echo -e "  Press ${RED}Ctrl+C${NC} to stop both servers."
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

wait "$BACKEND_PID" "$FRONTEND_PID"
