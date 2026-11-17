import React, { useState, useEffect } from 'react';
import type { Problem, Difficulty } from '../types/problem';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Search, Circle, Sparkles, X } from 'lucide-react';

export const isTitleMatch = (title: string, query: string): boolean => {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) return true;
  return title.toLowerCase().includes(normalized);
};

interface ProblemListProps {
  problems: Problem[];
  onSelectProblem: (problem: Problem) => void;
  onSearchChange?: (query: string) => void;
}

export const ProblemList: React.FC<ProblemListProps> = ({
  problems,
  onSelectProblem,
  onSearchChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Debounced callback to notify parent or trigger backend query
  useEffect(() => {
    if (!onSearchChange) return;
    const timer = setTimeout(() => {
      onSearchChange(searchTerm.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]);

  const handleClearSearch = () => {
    setSearchTerm('');
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClearSearch();
    }
  };

  const categories = ['All', ...Array.from(new Set(problems.map((p) => p.category)))];

  const filteredProblems = problems.filter((problem) => {
    const matchesTitle = isTitleMatch(problem.title, searchTerm);
    const matchesDifficulty =
      selectedDifficulty === 'All' || problem.difficulty === selectedDifficulty;
    const matchesCategory =
      selectedCategory === 'All' || problem.category === selectedCategory;
    return matchesTitle && matchesDifficulty && matchesCategory;
  });

  const getDifficultyVariant = (diff: Difficulty) => {
    switch (diff) {
      case 'Easy':
        return 'easy';
      case 'Medium':
        return 'medium';
      case 'Hard':
        return 'hard';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full">
      {/* Hero Banner with shadcn styling */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/30 via-zinc-950 to-indigo-950/30 border border-zinc-800 p-8 mb-8 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Code Execution Platform</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            Master Data Structures & Algorithms
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-6">
            Write, compile, and run algorithmic solutions directly in the browser with real-time feedback.
            Select any problem below to open the code workspace.
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>C++ 20</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span>Python 3.12</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>JavaScript (Node.js)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search problems by title..."
            aria-label="Search problems by title"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-9 py-2 bg-[#111113] border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
          {searchTerm.length > 0 && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Difficulty Filter */}
          <div className="flex items-center bg-[#111113] border border-zinc-800 rounded-lg p-1 text-xs">
            {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1 rounded-md transition-all font-medium ${
                  selectedDifficulty === diff
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#111113] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-zinc-900 text-zinc-200">
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Problem Table */}
      <div className="overflow-hidden border border-zinc-800 rounded-xl bg-[#111113] shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-xs font-semibold text-zinc-400 bg-zinc-900/60">
              <th className="py-3 px-4 w-12 text-center">Status</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 w-28">Difficulty</th>
              <th className="py-3 px-4 w-24 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-sm">
            {filteredProblems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-sm font-medium text-zinc-300">
                      {searchTerm.trim().length > 0
                        ? `No problems found matching "${searchTerm.trim()}"`
                        : 'No problems match your search criteria.'}
                    </p>
                    {searchTerm.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="mt-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 hover:text-emerald-300 border border-zinc-700 rounded text-xs font-medium transition-colors"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredProblems.map((problem) => (
                <tr
                  key={problem.id}
                  onClick={() => onSelectProblem(problem)}
                  className="hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-4 text-center">
                    <Circle className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors">
                    {problem.id}. {problem.title}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 text-xs">
                    <span className="bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
                      {problem.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={getDifficultyVariant(problem.difficulty)}>
                      {problem.difficulty}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProblem(problem);
                      }}
                      className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/40 hover:text-emerald-300 text-xs"
                    >
                      Solve
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
