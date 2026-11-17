import React from 'react';
import type { User } from '../types/problem';
import { Button } from './ui/button';
import { Code2, Compass, Shield, LogIn, LogOut } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onNavigateHome: () => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  activeProblemTitle?: string;
  isAdminView?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onNavigateHome,
  onOpenAdmin,
  onOpenAuth,
  onLogout,
  activeProblemTitle,
  isAdminView = false
}) => {
  return (
    <header className="h-14 border-b border-zinc-800 bg-[#111113] px-4 flex items-center justify-between text-sm select-none shrink-0">
      <div className="flex items-center gap-6">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 font-bold text-lg text-emerald-400 hover:text-emerald-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md px-1"
        >
          <Code2 className="w-6 h-6 text-emerald-400" />
          <span>Algo<span className="text-white">Place</span></span>
        </button>

        <nav className="flex items-center gap-2 text-zinc-400">
          <Button
            variant={!isAdminView ? "default" : "ghost"}
            size="sm"
            onClick={onNavigateHome}
            className={`flex items-center gap-1.5 transition-colors ${
              !isAdminView
                ? 'text-white bg-zinc-800 border-zinc-700'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Problemset</span>
          </Button>

          {/* Admin link */}
          {user?.role === 'admin' && (
            <Button
              variant={isAdminView ? "default" : "ghost"}
              size="sm"
              onClick={onOpenAdmin}
              className={`flex items-center gap-1.5 transition-colors ${
                isAdminView
                  ? 'text-indigo-400 bg-indigo-950/80 border border-indigo-800/70 font-medium'
                  : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40'
              }`}
            >
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Admin Panel</span>
            </Button>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {activeProblemTitle && (
          <div className="hidden sm:block text-xs text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800 max-w-[200px] md:max-w-xs truncate">
            {activeProblemTitle}
          </div>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-[11px] font-bold text-white uppercase">
                  {user.username.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-zinc-200">{user.username}</span>
                {user.role === 'admin' && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1 rounded uppercase font-bold">
                    Admin
                  </span>
                )}
              </div>

              <button
                onClick={onLogout}
                title="Log out"
                aria-label="Log out"
                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
