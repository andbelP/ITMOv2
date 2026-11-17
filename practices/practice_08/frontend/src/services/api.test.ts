import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiService } from './api';
import { MOCK_PROBLEMS } from '../data/mockProblems';
import type { Problem } from '../types/problem';

describe('apiService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('auth methods', () => {
    it('login stores token and user in localStorage on success', async () => {
      const mockResponse = {
        token: 'fake-jwt-token-123',
        user: { id: 1, username: 'testuser', role: 'user', createdAt: '2026-01-01' },
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.login('testuser', 'password123');

      expect(result).toEqual(mockResponse);
      expect(localStorage.getItem('algoplace_token')).toBe('fake-jwt-token-123');
      expect(localStorage.getItem('algoplace_user')).toBe(JSON.stringify(mockResponse.user));
    });

    it('login throws error on failure with server message', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid username or password' }),
      } as Response);

      await expect(apiService.login('baduser', 'wrongpass')).rejects.toThrow(
        'Invalid username or password'
      );
    });

    it('register stores token and user in localStorage on success', async () => {
      const mockResponse = {
        token: 'new-user-token',
        user: { id: 2, username: 'newuser', role: 'user', createdAt: '2026-01-01' },
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.register('newuser', 'password123');
      expect(result).toEqual(mockResponse);
      expect(localStorage.getItem('algoplace_token')).toBe('new-user-token');
      expect(apiService.getToken()).toBe('new-user-token');
      expect(apiService.getStoredUser()).toEqual(mockResponse.user);
    });

    it('logout removes credentials from localStorage', () => {
      localStorage.setItem('algoplace_token', 'test-token');
      localStorage.setItem('algoplace_user', JSON.stringify({ id: 1, username: 'tester' }));

      apiService.logout();

      expect(apiService.getToken()).toBeNull();
      expect(apiService.getStoredUser()).toBeNull();
    });

    it('getMe returns user data when authenticated', async () => {
      localStorage.setItem('algoplace_token', 'active-token');
      const mockUser = { id: 5, username: 'activeuser', role: 'user', createdAt: '2026-01-01' };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      } as Response);

      const user = await apiService.getMe();
      expect(user).toEqual(mockUser);
    });

    it('getMe clears token and returns null when response not ok', async () => {
      localStorage.setItem('algoplace_token', 'expired-token');

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      const user = await apiService.getMe();
      expect(user).toBeNull();
      expect(localStorage.getItem('algoplace_token')).toBeNull();
    });

    it('getMe returns null immediately if no token present', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const user = await apiService.getMe();
      expect(user).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('problems methods', () => {
    it('getProblems returns backend problems when fetch succeeds', async () => {
      const customProblems = [{ id: '1', title: 'Problem 1' }] as Problem[];
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => customProblems,
      } as Response);

      const res = await apiService.getProblems();
      expect(res).toEqual(customProblems);
    });

    it('getProblems appends query parameter when query is provided', async () => {
      const customProblems = [{ id: '1', title: 'Two Sum' }] as Problem[];
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => customProblems,
      } as Response);

      const res = await apiService.getProblems('  Two Sum  ');
      expect(res).toEqual(customProblems);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/problems?q=Two%20Sum'),
        expect.any(Object)
      );
    });

    it('getProblems falls back to MOCK_PROBLEMS when backend fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const res = await apiService.getProblems();
      expect(res).toEqual(MOCK_PROBLEMS);
    });

    it('getProblems filters MOCK_PROBLEMS by title when backend fails with query', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const res = await apiService.getProblems('Palindrome');
      expect(res.length).toBeGreaterThan(0);
      expect(res.every((p) => p.title.toLowerCase().includes('palindrome'))).toBe(true);
    });

    it('getProblemBySlug returns problem when fetch succeeds', async () => {
      const prob = { id: '1', slug: 'two-sum', title: 'Two Sum' } as Problem;
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => prob,
      } as Response);

      const res = await apiService.getProblemBySlug('two-sum');
      expect(res).toEqual(prob);
    });

    it('getProblemBySlug falls back to MOCK_PROBLEMS on network error', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const res = await apiService.getProblemBySlug('two-sum');
      expect(res?.slug).toBe('two-sum');
    });
  });

  describe('execution methods', () => {
    it('runCode sends request and returns result', async () => {
      localStorage.setItem('algoplace_token', 'valid-token');
      const mockResult = {
        status: 'Accepted',
        runtimeMs: 12,
        memoryMb: 16,
        passedTests: 3,
        totalTests: 3,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      } as Response);

      const res = await apiService.runCode('1', 'python', 'print(1)');
      expect(res).toEqual(mockResult);
    });

    it('runCode throws login required error on 401', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      await expect(apiService.runCode('1', 'python', 'code')).rejects.toThrow(
        'Please sign in or register to execute code.'
      );
    });

    it('submitCode sends submit request and returns result', async () => {
      localStorage.setItem('algoplace_token', 'valid-token');
      const mockResult = {
        status: 'Accepted',
        runtimeMs: 15,
        memoryMb: 16,
        passedTests: 6,
        totalTests: 6,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      } as Response);

      const res = await apiService.submitCode('1', 'python', 'code');
      expect(res).toEqual(mockResult);
    });

    it('submitCode throws login required on 401', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      await expect(apiService.submitCode('1', 'python', 'code')).rejects.toThrow(
        'Please sign in or register to submit code.'
      );
    });

    it('getSubmissions sends GET with auth header and returns submissions', async () => {
      localStorage.setItem('algoplace_token', 'token-abc');
      const mockSubmissions = [
        {
          id: 1,
          problemId: 'two-sum',
          language: 'cpp',
          code: 'int main(){}',
          status: 'Accepted',
          runtimeMs: 4,
          memoryMb: 8,
          passedTests: 5,
          totalTests: 5,
          createdAt: '2026-01-01T00:00:00Z',
        },
      ];

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubmissions,
      } as Response);

      const res = await apiService.getSubmissions('two-sum');
      expect(res).toEqual(mockSubmissions);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/problems/two-sum/submissions'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token-abc',
          }),
        })
      );
    });

    it('getSubmissions throws error when unauthorized', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      await expect(apiService.getSubmissions('two-sum')).rejects.toThrow(
        'Please sign in to view submission history.'
      );
    });
  });

  describe('admin methods', () => {
    it('createProblem sends POST and returns status', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'created', id: '10' }),
      } as Response);

      const res = await apiService.createProblem({ id: '10', title: 'New' } as Problem);
      expect(res).toEqual({ status: 'created', id: '10' });
    });

    it('updateProblem sends PUT and returns status', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'updated' }),
      } as Response);

      const res = await apiService.updateProblem('10', { id: '10', title: 'Updated' } as Problem);
      expect(res).toEqual({ status: 'updated' });
    });

    it('deleteProblem sends DELETE and returns status', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'deleted' }),
      } as Response);

      const res = await apiService.deleteProblem('10');
      expect(res).toEqual({ status: 'deleted' });
    });
  });
});
