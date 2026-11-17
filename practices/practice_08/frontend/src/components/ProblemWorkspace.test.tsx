import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProblemWorkspace } from './ProblemWorkspace';
import { apiService } from '../services/api';
import type { Problem } from '../types/problem';

const sampleProblem: Problem = {
  id: '1',
  slug: 'two-sum',
  title: 'Two Sum',
  difficulty: 'Easy',
  category: 'Arrays & Hashing',
  description: 'Given an array of integers `nums` and an integer `target`...',
  constraints: ['2 <= nums.length <= 10^4'],
  examples: [
    {
      input: 'nums = [2,7,11,15], target = 9',
      output: '[0,1]',
      explanation: 'Because 2 + 7 == 9',
    },
  ],
  starterCode: {
    cpp: 'int main() { /* cpp code */ }',
    python: 'def solve(): pass',
    javascript: 'function solve() {}',
  },
  sampleTestCases: [
    { id: 'tc-1', input: '4\n2 7 11 15\n9', ExpectedOutput: '[0,1]' } as any,
  ],
  hiddenTestCases: [],
};

describe('ProblemWorkspace Component', () => {
  it('renders problem header, description, and editor', () => {
    render(
      <ProblemWorkspace
        problem={sampleProblem}
        problems={[sampleProblem]}
        isLoggedIn={true}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: '1. Two Sum' })).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Arrays & Hashing')).toBeInTheDocument();
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('allows switching languages and updates starter code', () => {
    render(
      <ProblemWorkspace
        problem={sampleProblem}
        problems={[sampleProblem]}
        isLoggedIn={true}
        onBack={vi.fn()}
      />
    );

    const textarea = screen.getByTestId('monaco-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe(sampleProblem.starterCode.cpp);

    const langSelect = screen.getByRole('combobox');
    fireEvent.change(langSelect, { target: { value: 'python' } });

    expect(textarea.value).toBe(sampleProblem.starterCode.python);
  });

  it('triggers onRequireAuth when Run is clicked while not logged in', () => {
    const handleRequireAuth = vi.fn();
    render(
      <ProblemWorkspace
        problem={sampleProblem}
        problems={[sampleProblem]}
        isLoggedIn={false}
        onRequireAuth={handleRequireAuth}
        onBack={vi.fn()}
      />
    );

    const runBtn = screen.getByRole('button', { name: /Run/i });
    fireEvent.click(runBtn);

    expect(handleRequireAuth).toHaveBeenCalledTimes(1);
  });

  it('runs code and displays execution results when logged in', async () => {
    vi.spyOn(apiService, 'runCode').mockResolvedValueOnce({
      status: 'Accepted',
      runtimeMs: 42,
      memoryMb: 16,
      passedTests: 1,
      totalTests: 1,
      testCaseResults: [
        {
          testCaseId: 'tc-1',
          passed: true,
          input: '4\n2 7 11 15\n9',
          expected: '[0,1]',
          actual: '[0,1]',
        },
      ],
    });

    render(
      <ProblemWorkspace
        problem={sampleProblem}
        problems={[sampleProblem]}
        isLoggedIn={true}
        onBack={vi.fn()}
      />
    );

    const runBtn = screen.getByRole('button', { name: /Run/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText('Accepted')).toBeInTheDocument();
      expect(screen.getByText('42 ms')).toBeInTheDocument();
    });
  });

  it('submits code and displays success modal on Accepted status', async () => {
    vi.spyOn(apiService, 'getSubmissions').mockResolvedValue([]);
    vi.spyOn(apiService, 'submitCode').mockResolvedValueOnce({
      status: 'Accepted',
      runtimeMs: 35,
      memoryMb: 16,
      passedTests: 4,
      totalTests: 4,
      testCaseResults: [],
    });

    render(
      <ProblemWorkspace
        problem={sampleProblem}
        problems={[sampleProblem]}
        isLoggedIn={true}
        onBack={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Task Solved!')).toBeInTheDocument();
    });
  });

  it('hides Submissions tab when not logged in', () => {
    render(
      <ProblemWorkspace
        problem={sampleProblem}
        problems={[sampleProblem]}
        isLoggedIn={false}
        onBack={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /Submissions/i })).toBeNull();
  });

  it('shows Submissions tab, lists past attempts and restores code into editor', async () => {
    const mockSubmission = {
      id: 101,
      problemId: '1',
      language: 'python' as const,
      code: 'print("restored solution")',
      status: 'Accepted' as const,
      runtimeMs: 12,
      memoryMb: 14,
      passedTests: 5,
      totalTests: 5,
      createdAt: '2026-01-01T12:00:00Z',
    };

    const getSubmissionsSpy = vi.spyOn(apiService, 'getSubmissions').mockResolvedValueOnce([mockSubmission]);

    render(
      <ProblemWorkspace
        problem={sampleProblem}
        problems={[sampleProblem]}
        isLoggedIn={true}
        onBack={vi.fn()}
      />
    );

    const submissionsTab = screen.getByRole('button', { name: /Submissions/i });
    expect(submissionsTab).toBeInTheDocument();

    fireEvent.click(submissionsTab);
    expect(getSubmissionsSpy).toHaveBeenCalledWith('1');

    await waitFor(() => {
      expect(screen.getByText('5/5 passed')).toBeInTheDocument();
      expect(screen.getByText('12 ms')).toBeInTheDocument();
    });

    // Click on the submission to open details modal
    fireEvent.click(screen.getByText('5/5 passed'));

    await waitFor(() => {
      expect(screen.getByText('Submission #101')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Restore to editor/i })).toBeInTheDocument();
    });

    // Click Restore to editor
    fireEvent.click(screen.getByRole('button', { name: /Restore to editor/i }));

    // Verify modal is closed and Monaco editor has restored python code
    await waitFor(() => {
      expect(screen.queryByText('Submission #101')).toBeNull();
    });

    const textarea = screen.getByTestId('monaco-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('print("restored solution")');
  });
});
