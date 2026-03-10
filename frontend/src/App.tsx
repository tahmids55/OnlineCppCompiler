import { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import CodeEditor from './components/CodeEditor';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import Toolbar from './components/Toolbar';
import { useAuth } from './hooks/useAuth';
import { runCode, saveTemplate, loadTemplate, saveWorkspace, loadWorkspace } from './lib/api';
import { DEFAULT_TEMPLATE, DEFAULT_INPUT } from './lib/constants';
import type { RunResult } from './types';

const MIN_PANEL_PCT = 15;
const MAX_PANEL_PCT = 85;

export default function App() {
  const { user } = useAuth();

  // Editor state
  const [code, setCode] = useState(DEFAULT_TEMPLATE);
  const [input, setInput] = useState(DEFAULT_INPUT);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [compileError, setCompileError] = useState('');
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  // UI state
  const [statusMessage, setStatusMessage] = useState('');
  const [fetchError, setFetchError] = useState('');

  // Panel sizes (percentages)
  const [leftWidthPct, setLeftWidthPct] = useState(60);  // main.cpp width %
  const [topHeightPct, setTopHeightPct] = useState(50);  // input.txt height % in right column

  // Drag state
  const contentRef = useRef<HTMLDivElement>(null);  // full content area (for horizontal drag)
  const rightRef = useRef<HTMLDivElement>(null);    // right column (for vertical drag)
  const dragging = useRef<'vertical' | 'horizontal' | null>(null);

  // ── Draggable dividers ───────────────────────────────────────────────────
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    e.preventDefault();
    if (dragging.current === 'horizontal' && contentRef.current) {
      const rect = contentRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftWidthPct(Math.max(MIN_PANEL_PCT, Math.min(MAX_PANEL_PCT, pct)));
    }
    if (dragging.current === 'vertical' && rightRef.current) {
      const rect = rightRef.current.getBoundingClientRect();
      const pct = ((e.clientY - rect.top) / rect.height) * 100;
      setTopHeightPct(Math.max(MIN_PANEL_PCT, Math.min(MAX_PANEL_PCT, pct)));
    }
  }, []);

  const onMouseUp = useCallback(() => {
    if (dragging.current) {
      dragging.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);



  // Load workspace when user signs in
  useEffect(() => {
    if (user) {
      loadWorkspace()
        .then((data) => {
          if (data.main_cpp) setCode(data.main_cpp);
          if (data.input_txt !== undefined) setInput(data.input_txt);
          showStatus('Workspace restored');
        })
        .catch(() => {});
    }
  }, [user]);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // ── Run handler ──────────────────────────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput('');
    setError('');
    setCompileError('');
    setExecutionTime(null);
    setExitCode(null);
    setTimedOut(false);
    setFetchError('');

    try {
      const result: RunResult = await runCode({ code, input });
      setOutput(result.output || '');
      setError(result.error || '');
      setCompileError(result.compile_error || '');
      setExecutionTime(result.execution_time);
      setExitCode(result.exit_code);
      setTimedOut(result.timed_out || false);

      if (result.compile_error) showStatus('Compilation failed');
      else if (result.timed_out) showStatus('Time Limit Exceeded');
      else if (result.exit_code === 0) showStatus(`Executed in ${result.execution_time.toFixed(3)}s`);
      else showStatus(`Runtime error (exit code ${result.exit_code})`);

      // Auto-save workspace to Firebase after every run
      if (user) {
        saveWorkspace({ main_cpp: code, input_txt: input }).catch(() => {});
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Execution failed';
      setFetchError(message);
      showStatus('Execution failed');
    } finally {
      setIsRunning(false);
    }
  }, [code, input, isRunning, user]);

  const handleSaveTemplate = useCallback(async () => {
    if (!user) return;
    try { await saveTemplate({ code }); showStatus('Template saved'); }
    catch (err) { showStatus(err instanceof Error ? err.message : 'Failed to save template'); }
  }, [code, user]);

  const handleLoadTemplate = useCallback(async () => {
    if (!user) return;
    try {
      const data = await loadTemplate();
      if (data.code) { setCode(data.code); showStatus('Template loaded'); }
      else showStatus('Template is empty');
    } catch (err) { showStatus(err instanceof Error ? err.message : 'No template found'); }
  }, [user]);

  const handleSaveWorkspace = useCallback(async () => {
    if (!user) return;
    try { await saveWorkspace({ main_cpp: code, input_txt: input }); showStatus('Workspace saved'); }
    catch (err) { showStatus(err instanceof Error ? err.message : 'Failed to save workspace'); }
  }, [code, input, user]);

  const handleReset = useCallback(() => {
    setCode(DEFAULT_TEMPLATE);
    setInput(DEFAULT_INPUT);
    setOutput(''); setError(''); setCompileError('');
    setExecutionTime(null); setExitCode(null); setTimedOut(false);
    showStatus('Workspace reset');
  }, []);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault(); handleRun();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (user) handleSaveWorkspace();
        else showStatus('Sign in to save workspace');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRun, handleSaveWorkspace, user]);

  // ── Drag handle starters ─────────────────────────────────────────────────
  const startVerticalDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = 'vertical';
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const startHorizontalDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = 'horizontal';
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg-primary)]">
      {/* Header */}
      <Header fileName="main.cpp" />

      {/* Main content area — left: code editor, right: input + output */}
      <div ref={contentRef} className="flex-1 flex flex-row min-h-0 overflow-hidden">

        {/* Left — main.cpp */}
        <div style={{ width: `${leftWidthPct}%` }} className="min-w-0 overflow-hidden">
          <CodeEditor
            value={code}
            onChange={setCode}
            language="cpp"
            minimap={false}
          />
        </div>

        {/* ── Horizontal drag handle (left ↔ right) ── */}
        <div
          onMouseDown={startHorizontalDrag}
          className="w-1 shrink-0 bg-[var(--color-border)] hover:bg-[var(--color-accent)] transition-colors duration-150 cursor-col-resize group relative"
          title="Drag to resize"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="h-6 w-0.5 rounded bg-[var(--color-accent)]" />
          </div>
        </div>

        {/* Right column — input.txt (top) + output.txt (bottom) */}
        <div
          ref={rightRef}
          className="flex flex-col min-w-0 overflow-hidden"
          style={{ width: `${100 - leftWidthPct}%` }}
        >
          {/* input.txt */}
          <div style={{ height: `${topHeightPct}%` }} className="min-h-0 overflow-hidden">
            <InputPanel value={input} onChange={setInput} />
          </div>

          {/* ── Vertical drag handle (input ↔ output) ── */}
          <div
            onMouseDown={startVerticalDrag}
            className="h-1 shrink-0 bg-[var(--color-border)] hover:bg-[var(--color-accent)] transition-colors duration-150 cursor-row-resize group relative"
            title="Drag to resize"
          >
            <div className="absolute inset-x-0 -top-1 -bottom-1" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="w-6 h-0.5 rounded bg-[var(--color-accent)]" />
            </div>
          </div>

          {/* output.txt */}
          <div style={{ height: `${100 - topHeightPct}%` }} className="min-h-0 overflow-hidden">
            <OutputPanel
              output={output}
              error={error}
              compileError={compileError}
              executionTime={executionTime}
              exitCode={exitCode}
              timedOut={timedOut}
              isRunning={isRunning}
            />
          </div>
        </div>
      </div>

      {/* Fetch/network error banner */}
      {fetchError && (
        <div style={{ background: 'rgba(248,81,73,0.12)', borderTop: '1px solid rgba(248,81,73,0.5)' }}
          className="px-4 py-2 text-xs text-[var(--color-error)] flex items-center gap-2">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span><strong>Backend error:</strong> {fetchError} — make sure the backend server is running on port 8080.</span>
        </div>
      )}

      {/* Bottom toolbar */}
      <Toolbar
        user={user}
        isRunning={isRunning}
        onRun={handleRun}
        onSaveTemplate={handleSaveTemplate}
        onLoadTemplate={handleLoadTemplate}
        onSaveWorkspace={handleSaveWorkspace}
        onReset={handleReset}
        statusMessage={statusMessage}
      />
    </div>
  );
}
