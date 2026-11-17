import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from './App';
import { apiService } from './services/api';
import type { Problem, User } from './types/problem';

const testProblems: Problem[] = [
  {
    id: '1',
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays',
    description: 'Two sum description',
    constraints: [],
    examples: [],
    starterCode: { cpp: '', python: '', javascript: '' },
    sampleTestCases: [],
    hiddenTestCases: [],
  },
];

const adminUser: User = {
  id: 1,
  username: 'andbelP',
  role: 'admin',
  createdAt: '2026-01-01',
};

describe('App Root Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders loading state initially and then shows problem list', async () => {
    vi.spyOn(apiService, 'getProblems').mockResolvedValueOnce(testProblems);
    vi.spyOn(apiService, 'getMe').mockResolvedValueOnce(null);

    render(<App />);

    expect(screen.getByText(/Loading AlgoPlace catalog/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('1. Two Sum')).toBeInTheDocument();
    });
  });

  it('navigates to problem workspace when problem is clicked and back home', async () => {
    vi.spyOn(apiService, 'getProblems').mockResolvedValue(testProblems);
    vi.spyOn(apiService, 'getMe').mockResolvedValue(null);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('1. Two Sum')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('1. Two Sum'));

    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    const backBtn = screen.getByRole('button', { name: /Problem List/i });
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.getByText('Master Data Structures & Algorithms')).toBeInTheDocument();
    });
  });

  it('allows admin user to switch to AdminPanel and back', async () => {
    vi.spyOn(apiService, 'getProblems').mockResolvedValue(testProblems);
    vi.spyOn(apiService, 'getMe').mockResolvedValue(adminUser);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Admin Panel/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Admin Panel/i }));

    await waitFor(() => {
      expect(screen.getByText('Admin Problem Management')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Back to problemset'));

    await waitFor(() => {
      expect(screen.getByText('Master Data Structures & Algorithms')).toBeInTheDocument();
    });
  });

  it('handles user logout correctly', async () => {
    vi.spyOn(apiService, 'getProblems').mockResolvedValue(testProblems);
    vi.spyOn(apiService, 'getMe').mockResolvedValue(adminUser);
    const logoutSpy = vi.spyOn(apiService, 'logout');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('andbelP')).toBeInTheDocument();
    });

    const logoutBtn = screen.getByTitle('Log out');
    fireEvent.click(logoutBtn);

    expect(logoutSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });
  });
});
