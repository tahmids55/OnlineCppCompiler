import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

const MIN_FONT = 10;
const MAX_FONT = 32;

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
  minimap?: boolean;
}

export default function CodeEditor({
  value,
  onChange,
  language = 'cpp',
  readOnly = false,
  height = '100%',
  minimap = false,
}: CodeEditorProps) {
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
    <div ref={containerRef} style={{ height, position: 'relative' }}>
    <Editor
      height="100%"
      language={language}
      theme="vs-dark"
      value={value}
      onChange={(val) => onChange(val || '')}
      options={{
        readOnly,
        minimap: { enabled: minimap },
        fontSize,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        fontLigatures: true,
        lineNumbers: 'on',
        folding: true,
        bracketPairColorization: { enabled: true },
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoIndent: 'full',
        formatOnPaste: true,
        suggestOnTriggerCharacters: true,
        tabSize: 4,
        insertSpaces: true,
        wordWrap: 'off',
        scrollBeyondLastLine: false,
        mouseWheelZoom: false,
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        renderLineHighlight: 'all',
        renderWhitespace: 'selection',
        padding: { top: 8, bottom: 8 },
      }}
    />
    </div>
  );
}
