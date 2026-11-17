import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminPanel } from './AdminPanel';
import { apiService } from '../services/api';
import type { Problem } from '../types/problem';

const mockProblems: Problem[] = [
  {
    id: '1',
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays',
    description: 'Solve two sum',
    constraints: [],
    examples: [],
    starterCode: { cpp: '', python: '', javascript: '' },
    sampleTestCases: [],
    hiddenTestCases: [],
  },
];

describe('AdminPanel Component', () => {
  it('renders problem list in admin mode', () => {
    render(
      <AdminPanel
        problems={mockProblems}
        onBack={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('Admin Problem Management')).toBeInTheDocument();
    expect(screen.getByText('Two Sum')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add New Problem/i })).toBeInTheDocument();
  });

  it('can open Create Problem form and submit new problem', async () => {
    vi.spyOn(apiService, 'createProblem').mockResolvedValueOnce({
      status: 'created',
      id: '5',
    });

    const handleRefresh = vi.fn();
    render(
      <AdminPanel
        problems={mockProblems}
        onBack={vi.fn()}
        onRefresh={handleRefresh}
      />
    );

    const addBtn = screen.getByRole('button', { name: /Add New Problem/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Create New Problem')).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText('e.g. Reverse Linked List');
    fireEvent.change(titleInput, { target: { value: 'Reverse String' } });

    const saveBtn = screen.getByRole('button', { name: 'Save Problem' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(apiService.createProblem).toHaveBeenCalled();
      expect(handleRefresh).toHaveBeenCalled();
      expect(screen.getByText('Problem created successfully!')).toBeInTheDocument();
    });
  });

  it('can open Edit Problem form and submit update', async () => {
    vi.spyOn(apiService, 'updateProblem').mockResolvedValueOnce({
      status: 'updated',
    });

    const handleRefresh = vi.fn();
    render(
      <AdminPanel
        problems={mockProblems}
        onBack={vi.fn()}
        onRefresh={handleRefresh}
      />
    );

    const editBtn = screen.getByTitle('Edit Problem');
    fireEvent.click(editBtn);

    expect(screen.getByText(/Edit Problem #1: Two Sum/i)).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText('e.g. Reverse Linked List');
    fireEvent.change(titleInput, { target: { value: 'Two Sum II' } });

    const saveBtn = screen.getByRole('button', { name: 'Save Problem' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(apiService.updateProblem).toHaveBeenCalled();
      expect(handleRefresh).toHaveBeenCalled();
      expect(screen.getByText('Problem updated successfully!')).toBeInTheDocument();
    });
  });

  it('confirms and calls delete problem', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(apiService, 'deleteProblem').mockResolvedValueOnce({
      status: 'deleted',
    });

    const handleRefresh = vi.fn();
    render(
      <AdminPanel
        problems={mockProblems}
        onBack={vi.fn()}
        onRefresh={handleRefresh}
      />
    );

    const deleteBtn = screen.getByTitle('Delete Problem');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(apiService.deleteProblem).toHaveBeenCalledWith('1');
      expect(handleRefresh).toHaveBeenCalled();
      expect(screen.getByText(/deleted successfully/i)).toBeInTheDocument();
    });
  });
});
