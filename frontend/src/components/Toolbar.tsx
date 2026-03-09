import { signInWithGoogle, logOut } from '../lib/firebase';
import type { User } from '../types';

interface ToolbarProps {
  user: User | null;
  isRunning: boolean;
  onRun: () => void;
  onSaveTemplate: () => void;
  onLoadTemplate: () => void;
  onSaveWorkspace: () => void;
  onReset: () => void;
  statusMessage: string;
}

export default function Toolbar({
  user,
  isRunning,
  onRun,
  onSaveTemplate,
  onLoadTemplate,
  onSaveWorkspace,
  onReset,
  statusMessage,
}: ToolbarProps) {
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)]">
      {/* Left — action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRun}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-md
            bg-[var(--color-success)] text-[var(--color-bg-primary)]
            hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-150"
          title="Ctrl+Enter"
        >
          {isRunning ? (
            <>
              <span className="w-3 h-3 border-2 border-[var(--color-bg-primary)] border-t-transparent rounded-full animate-spin" />
              Running
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Run
            </>
          )}
        </button>

        <div className="w-px h-6 bg-[var(--color-border)]" />

        {user && (
          <>
            <button
              onClick={onSaveTemplate}
              className="px-3 py-1.5 text-xs font-medium rounded-md
                bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]
                hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]
                transition-all duration-150"
            >
              Save Template
            </button>
            <button
              onClick={onLoadTemplate}
              className="px-3 py-1.5 text-xs font-medium rounded-md
                bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]
                hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]
                transition-all duration-150"
            >
              Load Template
            </button>
            <button
              onClick={onSaveWorkspace}
              className="px-3 py-1.5 text-xs font-medium rounded-md
                bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]
                hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]
                transition-all duration-150"
            >
              Save Workspace
            </button>
          </>
        )}

        <button
          onClick={onReset}
          className="px-3 py-1.5 text-xs font-medium rounded-md
            bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]
            hover:text-[var(--color-error)] hover:bg-[var(--color-border)]
            transition-all duration-150"
        >
          Reset
        </button>
      </div>

      {/* Center — status */}
      {statusMessage && (
        <span className="text-xs text-[var(--color-text-secondary)] hidden md:block">
          {statusMessage}
        </span>
      )}

      {/* Right — auth */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="w-6 h-6 rounded-full"
              />
            )}
            <span className="text-xs text-[var(--color-text-secondary)] hidden sm:block max-w-[150px] truncate">
              {user.displayName || user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 text-xs font-medium rounded-md
                bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]
                hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]
                transition-all duration-150"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
              bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]
              hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]
              transition-all duration-150"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        )}
      </div>
    </div>
  );
}
