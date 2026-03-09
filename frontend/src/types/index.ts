// Types for CP Workspace

export interface RunRequest {
  code: string;
  input: string;
}

export interface RunResult {
  output: string;
  error: string;
  compile_error?: string;
  execution_time: number;
  exit_code: number;
  timed_out: boolean;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface TemplateData {
  code: string;
}

export interface WorkspaceData {
  main_cpp: string;
  input_txt: string;
}
