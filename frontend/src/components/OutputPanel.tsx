import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

const MIN_FONT = 10;
const MAX_FONT = 32;

interface OutputPanelProps {
  output: string;
  error: string;
  compileError: string;
  executionTime: number | null;
  exitCode: number | null;
  timedOut: boolean;
  isRunning: boolean;
}

export default function OutputPanel({
  output,
  error,
  compileError,
  executionTime,
  exitCode,
  timedOut,
  isRunning,
}: OutputPanelProps) {
  const [fontSize, setFontSize] = useState(14);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setFontSize(prev => Math.max(MIN_FONT, Math.min(MAX_FONT, prev + (e.deltaY < 0 ? 1 : -1))));
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);
  // Determine status color and label
  let statusColor = 'text-[var(--color-text-secondary)]';
  let statusLabel = 'Ready';

  if (isRunning) {
    statusColor = 'text-[var(--color-warning)]';
    statusLabel = 'Running...';
  } else if (compileError) {
    statusColor = 'text-[var(--color-error)]';
    statusLabel = 'Compilation Error';
  } else if (timedOut) {
    statusColor = 'text-[var(--color-error)]';
    statusLabel = 'Time Limit Exceeded';
  } else if (exitCode !== null && exitCode !== 0) {
    statusColor = 'text-[var(--color-error)]';
    statusLabel = `Runtime Error (exit ${exitCode})`;
  } else if (exitCode === 0) {
    statusColor = 'text-[var(--color-success)]';
    statusLabel = 'Success';
  }

  // Build display content
  let displayContent = '';
  if (compileError) {
    displayContent = compileError;
  } else if (output || error) {
    displayContent = output;
    if (error) {
      displayContent += (displayContent ? '\n\n' : '') + '--- stderr ---\n' + error;
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
          output.txt
        </span>
        <div className="flex items-center gap-3">
          {executionTime !== null && (
            <span className="text-xs text-[var(--color-text-secondary)]">
              {executionTime.toFixed(3)}s
            </span>
          )}
          <span className={`text-xs font-medium ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
      </div>
      <div className="flex-1 relative">
        {isRunning && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-primary)] bg-opacity-80 z-10">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-[var(--color-text-secondary)]">Compiling & Running...</span>
            </div>
          </div>
        )}
        <Editor
          height="100%"
          language="plaintext"
          theme="vs-dark"
          value={displayContent}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineNumbers: 'off',
            folding: false,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            mouseWheelZoom: false,
            renderLineHighlight: 'none',
            padding: { top: 8, bottom: 8 },
            overviewRulerLanes: 0,
            domReadOnly: true,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'hidden',
            },
          }}
        />
      </div>
    </div>
  );
}
