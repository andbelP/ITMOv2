import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProblemList, isTitleMatch } from './ProblemList';
import type { Problem } from '../types/problem';

const mockProblems: Problem[] = [
  {
    id: '1',
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    description: 'Find indices',
    constraints: ['2 <= nums.length <= 104'],
    examples: [],
    starterCode: { cpp: '', python: '', javascript: '' },
    sampleTestCases: [{ id: '1', input: '1', expectedOutput: '1' }],
  },
  {
    id: '2',
    slug: 'valid-palindrome',
    title: 'Valid Palindrome',
    difficulty: 'Easy',
    category: 'Two Pointers',
    description: 'Check palindrome',
    constraints: [],
    examples: [],
    starterCode: { cpp: '', python: '', javascript: '' },
    sampleTestCases: [{ id: '1', input: 'aba', expectedOutput: 'true' }],
  },
  {
    id: '3',
    slug: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    difficulty: 'Hard',
    category: 'Two Pointers',
    description: 'Trap water',
    constraints: [],
    examples: [],
    starterCode: { cpp: '', python: '', javascript: '' },
    sampleTestCases: [],
  },
];

describe('ProblemList Component', () => {
  describe('isTitleMatch utility', () => {
    it('matches substrings regardless of casing', () => {
      expect(isTitleMatch('Two Sum', 'two')).toBe(true);
      expect(isTitleMatch('Two Sum', 'SUM')).toBe(true);
      expect(isTitleMatch('Two Sum', 'Two Sum')).toBe(true);
      expect(isTitleMatch('Two Sum', 'water')).toBe(false);
    });

    it('trims leading and trailing whitespace', () => {
      expect(isTitleMatch('Two Sum', '  Two  ')).toBe(true);
      expect(isTitleMatch('Two Sum', '   ')).toBe(true);
    });
  });

  describe('UI Rendering & Interactions', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('renders all problems initially', () => {
      const handleSelect = vi.fn();
      render(<ProblemList problems={mockProblems} onSelectProblem={handleSelect} />);

      expect(screen.getByText('1. Two Sum')).toBeInTheDocument();
      expect(screen.getByText('2. Valid Palindrome')).toBeInTheDocument();
      expect(screen.getByText('3. Trapping Rain Water')).toBeInTheDocument();
    });

    it('filters problems strictly by title (case-insensitive and trimmed)', () => {
      render(<ProblemList problems={mockProblems} onSelectProblem={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText('Search problems by title...');
      fireEvent.change(searchInput, { target: { value: '  palindrome  ' } });

      expect(screen.getByText('2. Valid Palindrome')).toBeInTheDocument();
      expect(screen.queryByText('1. Two Sum')).not.toBeInTheDocument();
      expect(screen.queryByText('3. Trapping Rain Water')).not.toBeInTheDocument();
    });

    it('does NOT match category names in search input', () => {
      render(<ProblemList problems={mockProblems} onSelectProblem={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText('Search problems by title...');
      // "Arrays & Hashing" is category of Two Sum, but not in its title
      fireEvent.change(searchInput, { target: { value: 'Arrays' } });

      expect(screen.queryByText('1. Two Sum')).not.toBeInTheDocument();
      expect(
        screen.getByText(/No problems found matching "Arrays"/i)
      ).toBeInTheDocument();
    });

    it('debounces onSearchChange callback', () => {
      const handleSearchChange = vi.fn();
      render(
        <ProblemList
          problems={mockProblems}
          onSelectProblem={vi.fn()}
          onSearchChange={handleSearchChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search problems by title...');
      fireEvent.change(searchInput, { target: { value: 'Two' } });

      // Before timer finishes, callback shouldn't be called
      expect(handleSearchChange).not.toHaveBeenCalled();

      // Fast-forward debounce delay (250ms)
      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(handleSearchChange).toHaveBeenCalledWith('Two');
    });

    it('clears search when clear (X) button is clicked', () => {
      const handleSearchChange = vi.fn();
      render(
        <ProblemList
          problems={mockProblems}
          onSelectProblem={vi.fn()}
          onSearchChange={handleSearchChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search problems by title...');
      fireEvent.change(searchInput, { target: { value: 'Two' } });

      const clearBtn = screen.getByRole('button', { name: 'Clear search' });
      expect(clearBtn).toBeInTheDocument();

      fireEvent.click(clearBtn);

      expect(searchInput).toHaveValue('');
      expect(handleSearchChange).toHaveBeenCalledWith('');
      expect(screen.getByText('1. Two Sum')).toBeInTheDocument();
      expect(screen.getByText('2. Valid Palindrome')).toBeInTheDocument();
    });

    it('clears search when Escape key is pressed in search input', () => {
      const handleSearchChange = vi.fn();
      render(
        <ProblemList
          problems={mockProblems}
          onSelectProblem={vi.fn()}
          onSearchChange={handleSearchChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search problems by title...');
      fireEvent.change(searchInput, { target: { value: 'Two' } });

      fireEvent.keyDown(searchInput, { key: 'Escape' });

      expect(searchInput).toHaveValue('');
      expect(handleSearchChange).toHaveBeenCalledWith('');
      expect(screen.getByText('1. Two Sum')).toBeInTheDocument();
    });

    it('shows informative empty state with clear button when search matches nothing', () => {
      render(<ProblemList problems={mockProblems} onSelectProblem={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText('Search problems by title...');
      fireEvent.change(searchInput, { target: { value: 'XYZ_NO_MATCH' } });

      expect(
        screen.getByText('No problems found matching "XYZ_NO_MATCH"')
      ).toBeInTheDocument();

      // Click clear search button inside empty state message
      const clearButtons = screen.getAllByRole('button', { name: 'Clear search' });
      fireEvent.click(clearButtons[clearButtons.length - 1]);

      expect(searchInput).toHaveValue('');
      expect(screen.getByText('1. Two Sum')).toBeInTheDocument();
    });

    it('filters problems by difficulty button', () => {
      render(<ProblemList problems={mockProblems} onSelectProblem={vi.fn()} />);

      const hardButton = screen.getByRole('button', { name: 'Hard' });
      fireEvent.click(hardButton);

      expect(screen.getByText('3. Trapping Rain Water')).toBeInTheDocument();
      expect(screen.queryByText('1. Two Sum')).not.toBeInTheDocument();
      expect(screen.queryByText('2. Valid Palindrome')).not.toBeInTheDocument();
    });

    it('filters problems by category dropdown', () => {
      render(<ProblemList problems={mockProblems} onSelectProblem={vi.fn()} />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'Arrays & Hashing' } });

      expect(screen.getByText('1. Two Sum')).toBeInTheDocument();
      expect(screen.queryByText('2. Valid Palindrome')).not.toBeInTheDocument();
      expect(screen.queryByText('3. Trapping Rain Water')).not.toBeInTheDocument();
    });

    it('calls onSelectProblem when problem row or Solve button is clicked', () => {
      const handleSelect = vi.fn();
      render(<ProblemList problems={mockProblems} onSelectProblem={handleSelect} />);

      const solveButtons = screen.getAllByRole('button', { name: 'Solve' });
      fireEvent.click(solveButtons[0]);

      expect(handleSelect).toHaveBeenCalledWith(mockProblems[0]);

      fireEvent.click(screen.getByText('2. Valid Palindrome'));
      expect(handleSelect).toHaveBeenCalledWith(mockProblems[1]);
    });
  });
});
