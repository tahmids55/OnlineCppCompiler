interface HeaderProps {
  fileName: string;
}

export default function Header({ fileName }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <h1 className="text-sm font-bold text-[var(--color-text-primary)] tracking-tight">
            CP Workspace
          </h1>
        </div>
        <div className="w-px h-4 bg-[var(--color-border)]" />
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--color-bg-tertiary)]">
          <svg className="w-3.5 h-3.5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs text-[var(--color-text-secondary)]">{fileName}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[var(--color-text-secondary)] opacity-60">
          C++17 · g++ · O2
        </span>
      </div>
    </div>
  );
}
