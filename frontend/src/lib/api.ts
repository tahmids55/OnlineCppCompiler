import { API_BASE_URL } from './constants';
import { getIdToken } from './firebase';
import type { RunRequest, RunResult, TemplateData, WorkspaceData } from '../types';

async function authHeaders(): Promise<Record<string, string>> {
  let token: string | null = null;
  try {
    token = await getIdToken();
  } catch {
    throw new Error('Authentication error — try signing out and back in');
  }
  if (token) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }
  throw new Error('Not signed in — please sign in first');
}

// POST /api/run — public endpoint
export async function runCode(req: RunRequest): Promise<RunResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
  } catch (err) {
    throw new Error('Cannot connect to backend. Check VITE_API_URL and backend service status.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Server returned HTTP ${res.status}`);
  }

  return res.json();
}

// POST /api/save-template — authenticated
export async function saveTemplate(data: TemplateData): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/save-template`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Save failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
}

// GET /api/load-template — authenticated
export async function loadTemplate(): Promise<TemplateData> {
  const res = await fetch(`${API_BASE_URL}/api/load-template`, {
    headers: await authHeaders(),
  });

  if (!res.ok) {
    throw new Error('No template found');
  }

  return res.json();
}

// POST /api/save-workspace — authenticated
export async function saveWorkspace(data: WorkspaceData): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/save-workspace`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Save failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
}

// GET /api/load-workspace — authenticated
export async function loadWorkspace(): Promise<WorkspaceData> {
  const res = await fetch(`${API_BASE_URL}/api/load-workspace`, {
    headers: await authHeaders(),
  });

  if (!res.ok) {
    throw new Error('No workspace found');
  }

  return res.json();
}
