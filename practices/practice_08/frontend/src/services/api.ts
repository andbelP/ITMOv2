import type { Problem, Submission, SubmissionResult, SupportedLanguage, User } from '../types/problem';
import { MOCK_PROBLEMS } from '../data/mockProblems';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('algoplace_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export const apiService = {
  // Auth endpoints
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('algoplace_token', data.token);
    localStorage.setItem('algoplace_user', JSON.stringify(data.user));
    return data;
  },

  async register(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }
    const data = await res.json();
    localStorage.setItem('algoplace_token', data.token);
    localStorage.setItem('algoplace_user', JSON.stringify(data.user));
    return data;
  },

  async getMe(): Promise<User | null> {
    const token = localStorage.getItem('algoplace_token');
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: getAuthHeader()
      });
      if (!res.ok) {
        this.logout();
        return null;
      }
      return await res.json();
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('algoplace_token');
    localStorage.removeItem('algoplace_user');
  },

  getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem('algoplace_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('algoplace_token');
  },

  // Problem endpoints
  async getProblems(query?: string): Promise<Problem[]> {
    const trimmed = query ? query.trim() : '';
    const url = trimmed
      ? `${API_BASE_URL}/api/problems?q=${encodeURIComponent(trimmed)}`
      : `${API_BASE_URL}/api/problems`;
    try {
      const response = await fetch(url, {
        headers: getAuthHeader()
      });
      if (!response.ok) throw new Error('Backend HTTP error');
      return await response.json();
    } catch {
      if (trimmed) {
        return MOCK_PROBLEMS.filter((p) =>
          p.title.toLowerCase().includes(trimmed.toLowerCase())
        );
      }
      return MOCK_PROBLEMS;
    }
  },

  async getProblemBySlug(slug: string): Promise<Problem | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/problems/${slug}`, {
        headers: getAuthHeader()
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return MOCK_PROBLEMS.find((p) => p.slug === slug) || null;
    }
  },

  // Execution endpoints (Protected)
  async runCode(
    problemId: string,
    language: SupportedLanguage,
    code: string,
    customInput?: string
  ): Promise<SubmissionResult> {
    const response = await fetch(`${API_BASE_URL}/api/submissions/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ problemId, language, code, customInput })
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Please sign in or register to execute code.');
      }
      const err = await response.json().catch(() => ({ error: 'Failed to run code' }));
      throw new Error(err.error || 'Failed to run code');
    }
    return response.json();
  },

  async submitCode(
    problemId: string,
    language: SupportedLanguage,
    code: string
  ): Promise<SubmissionResult> {
    const response = await fetch(`${API_BASE_URL}/api/submissions/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ problemId, language, code })
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Please sign in or register to submit code.');
      }
      const err = await response.json().catch(() => ({ error: 'Failed to submit code' }));
      throw new Error(err.error || 'Failed to submit code');
    }
    return response.json();
  },

  async getSubmissions(problemId: string): Promise<Submission[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/problems/${problemId}/submissions`, {
        headers: {
          ...getAuthHeader()
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view submission history.');
        }
        const err = await response.json().catch(() => ({ error: 'Failed to fetch submissions' }));
        throw new Error(err.error || 'Failed to fetch submissions');
      }
      return response.json();
    } catch (e: any) {
      if (e?.message?.includes('sign in')) throw e;
      return [];
    }
  },

  // Admin endpoints (Admin Role only)
  async createProblem(problem: Problem): Promise<{ status: string; id: string }> {
    const response = await fetch(`${API_BASE_URL}/api/admin/problems`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(problem)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Failed to create problem' }));
      throw new Error(err.error || 'Failed to create problem');
    }
    return response.json();
  },

  async updateProblem(id: string, problem: Problem): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/api/admin/problems/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(problem)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Failed to update problem' }));
      throw new Error(err.error || 'Failed to update problem');
    }
    return response.json();
  },

  async deleteProblem(id: string): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/api/admin/problems/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Failed to delete problem' }));
      throw new Error(err.error || 'Failed to delete problem');
    }
    return response.json();
  }
};
