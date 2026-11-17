import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from './Navbar';
import type { User } from '../types/problem';

describe('Navbar Component', () => {
  const dummyUser: User = {
    id: 1,
    username: 'coder123',
    role: 'user',
    createdAt: '2026-01-01',
  };

  const adminUser: User = {
    id: 2,
    username: 'andbelP',
    role: 'admin',
    createdAt: '2026-01-01',
  };

  it('renders branding and Problemset link', () => {
    const handleHome = vi.fn();
    render(
      <Navbar
        user={null}
        onNavigateHome={handleHome}
        onOpenAdmin={vi.fn()}
        onOpenAuth={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByText('Algo')).toBeInTheDocument();
    expect(screen.getByText('Place')).toBeInTheDocument();
    expect(screen.getByText('Problemset')).toBeInTheDocument();
  });

  it('shows Sign In button when unauthenticated and fires onOpenAuth', () => {
    const handleOpenAuth = vi.fn();
    render(
      <Navbar
        user={null}
        onNavigateHome={vi.fn()}
        onOpenAdmin={vi.fn()}
        onOpenAuth={handleOpenAuth}
        onLogout={vi.fn()}
      />
    );

    const signInBtn = screen.getByRole('button', { name: /Sign In/i });
    expect(signInBtn).toBeInTheDocument();

    fireEvent.click(signInBtn);
    expect(handleOpenAuth).toHaveBeenCalledTimes(1);
  });

  it('shows user info and logout button when user is logged in', () => {
    const handleLogout = vi.fn();
    render(
      <Navbar
        user={dummyUser}
        onNavigateHome={vi.fn()}
        onOpenAdmin={vi.fn()}
        onOpenAuth={vi.fn()}
        onLogout={handleLogout}
      />
    );

    expect(screen.getByText('coder123')).toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Sign In/i })).not.toBeInTheDocument();

    const logoutBtn = screen.getByTitle('Log out');
    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it('shows Admin badge and Admin Panel nav link for admin users', () => {
    const handleOpenAdmin = vi.fn();
    render(
      <Navbar
        user={adminUser}
        onNavigateHome={vi.fn()}
        onOpenAdmin={handleOpenAdmin}
        onOpenAuth={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByText('andbelP')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();

    const adminPanelBtn = screen.getByRole('button', { name: /Admin Panel/i });
    expect(adminPanelBtn).toBeInTheDocument();

    fireEvent.click(adminPanelBtn);
    expect(handleOpenAdmin).toHaveBeenCalledTimes(1);
  });

  it('displays activeProblemTitle when provided', () => {
    render(
      <Navbar
        user={null}
        onNavigateHome={vi.fn()}
        onOpenAdmin={vi.fn()}
        onOpenAuth={vi.fn()}
        onLogout={vi.fn()}
        activeProblemTitle="1. Two Sum"
      />
    );

    expect(screen.getByText('1. Two Sum')).toBeInTheDocument();
  });
});
