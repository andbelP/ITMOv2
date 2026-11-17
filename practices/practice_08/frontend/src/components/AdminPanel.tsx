import React, { useState } from 'react';
import type { Problem, Difficulty } from '../types/problem';
import { apiService } from '../services/api';
import { Plus, Trash2, Edit3, ArrowLeft, Check, AlertCircle } from 'lucide-react';

interface AdminPanelProps {
  problems: Problem[];
  onBack: () => void;
  onRefresh: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ problems, onBack, onRefresh }) => {
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [constraintsText, setConstraintsText] = useState('');
  const [cppCode, setCppCode] = useState('');
  const [pythonCode, setPythonCode] = useState('');
  const [jsCode, setJsCode] = useState('');
  const [sampleCasesText, setSampleCasesText] = useState('');
  const [hiddenCasesText, setHiddenCasesText] = useState('');

  const startCreate = () => {
    setIsCreating(true);
    setEditingProblem(null);
    setId('');
    setTitle('');
    setSlug('');
    setDifficulty('Easy');
    setCategory('Arrays & Hashing');
    setDescription('');
    setConstraintsText('1 <= nums.length <= 10^4');
    setCppCode(`#include <iostream>\n\nint main() {\n    // Solution\n    return 0;\n}`);
    setPythonCode(`import sys\n\ndef solve():\n    pass\n\nif __name__ == '__main__':\n    solve()`);
    setJsCode(`const fs = require('fs');\n\nfunction solve() {}\nsolve();`);
    setSampleCasesText(JSON.stringify([{ id: 'tc-1', input: 'sample', expectedOutput: 'sample' }], null, 2));
    setHiddenCasesText(JSON.stringify([{ id: 'htc-1', input: 'hidden', expectedOutput: 'hidden', isHidden: true }], null, 2));
    setMessage(null);
  };

  const startEdit = (p: Problem) => {
    setIsCreating(false);
    setEditingProblem(p);
    setId(p.id);
    setTitle(p.title);
    setSlug(p.slug);
    setDifficulty(p.difficulty);
    setCategory(p.category);
    setDescription(p.description);
    setConstraintsText((p.constraints || []).join('\n'));
    setCppCode(p.starterCode?.cpp || '');
    setPythonCode(p.starterCode?.python || '');
    setJsCode(p.starterCode?.javascript || '');
    setSampleCasesText(JSON.stringify(p.sampleTestCases || [], null, 2));
    setHiddenCasesText(JSON.stringify(p.hiddenTestCases || [], null, 2));
    setMessage(null);
  };

  const handleDelete = async (probId: string) => {
    if (!window.confirm(`Are you sure you want to delete problem #${probId}?`)) return;
    try {
      await apiService.deleteProblem(probId);
      setMessage({ text: `Problem #${probId} deleted successfully.`, type: 'success' });
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to delete problem', type: 'error' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      let sampleCases = [];
      let hiddenCases = [];
      try {
        sampleCases = JSON.parse(sampleCasesText);
      } catch {
        throw new Error('Invalid JSON in Sample Test Cases');
      }
      try {
        hiddenCases = hiddenCasesText ? JSON.parse(hiddenCasesText) : [];
      } catch {
        throw new Error('Invalid JSON in Hidden Test Cases');
      }

      const problemData: Problem = {
        id: id.trim(),
        title: title.trim(),
        slug: slug.trim() || title.toLowerCase().replace(/\s+/g, '-'),
        difficulty,
        category: category.trim(),
        description: description.trim(),
        constraints: constraintsText.split('\n').map((s) => s.trim()).filter(Boolean),
        examples: [],
        starterCode: {
          cpp: cppCode,
          python: pythonCode,
          javascript: jsCode
        },
        sampleTestCases: sampleCases,
        hiddenTestCases: hiddenCases
      };

      if (isCreating) {
        await apiService.createProblem(problemData);
        setMessage({ text: 'Problem created successfully!', type: 'success' });
      } else {
        await apiService.updateProblem(id, problemData);
        setMessage({ text: 'Problem updated successfully!', type: 'success' });
      }

      setEditingProblem(null);
      setIsCreating(false);
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to save problem', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-5 mb-6">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to problemset</span>
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>Admin Problem Management</span>
            <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
              PostgreSQL
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Create, edit, or delete problems and configure sample/hidden test cases.
          </p>
        </div>

        {!isCreating && !editingProblem && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Problem</span>
          </button>
        )}
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs mb-6 flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-800 text-rose-300'
          }`}
        >
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Editor Form Modal / Inline */}
      {(isCreating || editingProblem) ? (
        <form onSubmit={handleSave} className="bg-[#161b22] border border-gray-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h2 className="text-lg font-bold text-white">
              {isCreating ? 'Create New Problem' : `Edit Problem #${id}: ${title}`}
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingProblem(null);
              }}
              className="text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">ID (leave blank to auto-increment)</label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                disabled={!isCreating}
                placeholder="e.g. 5"
                className="w-full px-3 py-1.5 bg-[#0d1117] border border-gray-800 rounded text-xs text-gray-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Reverse Linked List"
                className="w-full px-3 py-1.5 bg-[#0d1117] border border-gray-800 rounded text-xs text-gray-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="reverse-linked-list"
                className="w-full px-3 py-1.5 bg-[#0d1117] border border-gray-800 rounded text-xs text-gray-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full px-3 py-1.5 bg-[#0d1117] border border-gray-800 rounded text-xs text-gray-200"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Dynamic Programming"
                className="w-full px-3 py-1.5 bg-[#0d1117] border border-gray-800 rounded text-xs text-gray-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Description (Markdown supported)</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#0d1117] border border-gray-800 rounded text-xs text-gray-200 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Constraints (1 per line)</label>
            <textarea
              rows={2}
              value={constraintsText}
              onChange={(e) => setConstraintsText(e.target.value)}
              className="w-full px-3 py-2 bg-[#0d1117] border border-gray-800 rounded text-xs text-gray-200 font-mono"
            />
          </div>

          {/* Starter code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">C++ Starter Code</label>
              <textarea
                rows={6}
                value={cppCode}
                onChange={(e) => setCppCode(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d1117] border border-gray-800 rounded text-xs text-gray-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Python Starter Code</label>
              <textarea
                rows={6}
                value={pythonCode}
                onChange={(e) => setPythonCode(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d1117] border border-gray-800 rounded text-xs text-gray-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">JavaScript Starter Code</label>
              <textarea
                rows={6}
                value={jsCode}
                onChange={(e) => setJsCode(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d1117] border border-gray-800 rounded text-xs text-gray-200 font-mono"
              />
            </div>
          </div>

          {/* Test cases */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Sample Test Cases (JSON array)</label>
              <textarea
                rows={6}
                value={sampleCasesText}
                onChange={(e) => setSampleCasesText(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d1117] border border-gray-800 rounded text-xs text-gray-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Hidden Test Cases (JSON array)</label>
              <textarea
                rows={6}
                value={hiddenCasesText}
                onChange={(e) => setHiddenCasesText(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d1117] border border-gray-800 rounded text-xs text-gray-200 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingProblem(null);
              }}
              className="px-4 py-2 border border-gray-700 rounded text-xs text-gray-300 hover:text-white hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded text-xs"
            >
              {saving ? 'Saving...' : 'Save Problem'}
            </button>
          </div>
        </form>
      ) : (
        /* Problem list for admin */
        <div className="overflow-hidden border border-gray-800 rounded-xl bg-[#161b22]/70 shadow-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs font-semibold text-gray-400 bg-gray-900/50">
                <th className="py-3 px-4 w-16">ID</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 w-28">Difficulty</th>
                <th className="py-3 px-4 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {problems.map((p) => (
                <tr key={p.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-gray-400">{p.id}</td>
                  <td className="py-3 px-4 font-medium text-gray-200">
                    {p.title}
                    <span className="block text-[11px] text-gray-500 font-mono">/{p.slug}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{p.category}</td>
                  <td className="py-3 px-4 text-xs font-semibold text-emerald-400">{p.difficulty}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => startEdit(p)}
                      title="Edit Problem"
                      className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      title="Delete Problem"
                      className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-gray-800 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
