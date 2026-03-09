import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

const MIN_FONT = 10;
const MAX_FONT = 32;

interface InputPanelProps {
  value: string;
  onChange: (value: string) => void;
}

export default function InputPanel({ value, onChange }: InputPanelProps) {
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

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      <div className="flex items-center px-3 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
          input.txt
        </span>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          language="plaintext"
          theme="vs-dark"
          value={value}
          onChange={(val) => onChange(val || '')}
          options={{
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
