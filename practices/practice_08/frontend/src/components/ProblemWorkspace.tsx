import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { Problem, SupportedLanguage, SubmissionResult, Submission } from '../types/problem';
import { apiService } from '../services/api';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Spinner } from './ui/spinner';
import {
  Play,
  Send,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Cpu,
  ChevronLeft,
  Terminal,
  FileText,
  AlertTriangle,
  PartyPopper,
  ArrowRight,
  ListOrdered,
  History,
  Inbox
} from 'lucide-react';

export interface ProblemWorkspaceProps {
  problem: Problem;
  problems?: Problem[];
  isLoggedIn?: boolean;
  onRequireAuth?: () => void;
  onBack: () => void;
  onSelectProblem?: (problem: Problem) => void;
}

export const ProblemWorkspace: React.FC<ProblemWorkspaceProps> = ({
  problem,
  problems = [],
  isLoggedIn = false,
  onRequireAuth,
  onBack,
  onSelectProblem
}) => {
  const [language, setLanguage] = useState<SupportedLanguage>('cpp');
  const [code, setCode] = useState<string>(problem.starterCode.cpp);
  const [activeTab, setActiveTab] = useState<'description' | 'submissions'>('description');
  const [testCaseTab, setTestCaseTab] = useState<number>(0);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'testcase' | 'result'>('testcase');

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState<boolean>(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const fetchSubmissions = async () => {
    if (!isLoggedIn) return;
    setIsLoadingSubmissions(true);
    try {
      const list = await apiService.getSubmissions(problem.id);
      setSubmissions(list);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  // Sync state if selected problem changes
  useEffect(() => {
    setCode(problem.starterCode[language]);
    setResult(null);
    setValidationError(null);
    setShowSuccessModal(false);
    setTestCaseTab(0);
    setActiveConsoleTab('testcase');
    setSelectedSubmission(null);
    if (isLoggedIn && activeTab === 'submissions') {
      fetchSubmissions();
    } else {
      setSubmissions([]);
    }
  }, [problem.id, isLoggedIn]);

  const currentIndex = problems.findIndex((p) => p.id === problem.id);
  const nextProblem = currentIndex >= 0 && currentIndex < problems.length - 1 ? problems[currentIndex + 1] : null;

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    setCode(problem.starterCode[newLang]);
    setResult(null);
    setValidationError(null);
  };

  const handleResetCode = () => {
    setCode(problem.starterCode[language]);
    setValidationError(null);
  };

  const handleRun = async () => {
    if (isRunning || isSubmitting) return;

    if (!code || code.trim().length === 0) {
      setValidationError('Code cannot be empty. Please write your solution before running.');
      setActiveConsoleTab('result');
      return;
    }
    setValidationError(null);

    if (!isLoggedIn) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    setIsRunning(true);
    setActiveConsoleTab('result');
    try {
      const res = await apiService.runCode(problem.id, language, code);
      setResult(res);
    } catch (err: any) {
      setResult({
        status: 'Runtime Error',
        runtimeMs: 0,
        memoryMb: 0,
        passedTests: 0,
        totalTests: problem.sampleTestCases.length,
        details: err?.message || 'Error occurred while running tests.'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    // CRITICAL: Double-submit protection guard
    if (isSubmitting || isRunning) {
      return;
    }

    if (!code || code.trim().length === 0) {
      setValidationError('Code cannot be empty. Please write your solution before submitting.');
      setActiveConsoleTab('result');
      return;
    }
    setValidationError(null);

    if (!isLoggedIn) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    setIsSubmitting(true);
    setActiveConsoleTab('result');
    try {
      const res = await apiService.submitCode(problem.id, language, code);
      setResult(res);
      fetchSubmissions();
      if (res.status === 'Accepted') {
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      setResult({
        status: 'Runtime Error',
        runtimeMs: 0,
        memoryMb: 0,
        passedTests: 0,
        totalTests: 0,
        details: err?.message || 'Submission failed.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMonacoLang = (lang: SupportedLanguage) => {
    if (lang === 'cpp') return 'cpp';
    if (lang === 'python') return 'python';
    return 'javascript';
  };

  const getDifficultyVariant = (difficulty: Problem['difficulty']) => {
    switch (difficulty) {
      case 'Easy':
        return 'easy';
      case 'Medium':
        return 'medium';
      case 'Hard':
        return 'hard';
      default:
        return 'default';
    }
  };

  const getStatusBadge = (status: SubmissionResult['status']) => {
    switch (status) {
      case 'Accepted':
        return (
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Accepted</span>
          </div>
        );
      case 'Wrong Answer':
        return (
          <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-sm">
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Wrong Answer</span>
          </div>
        );
      case 'Compilation Error':
      case 'Runtime Error':
        return (
          <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{status}</span>
          </div>
        );
      case 'Time Limit Exceeded':
        return (
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-sm">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Time Limit Exceeded</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0a0a0b] text-zinc-100">
      {/* Top action toolbar */}
      <header className="h-11 border-b border-zinc-800 bg-[#111113] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            aria-label="Back to problem list"
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Problem List</span>
          </Button>
          <div className="h-4 w-[1px] bg-zinc-800"></div>
          <span className="text-xs font-semibold text-zinc-200 truncate max-w-xs">
            {problem.id}. {problem.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language selector with accessible label */}
          <label htmlFor="language-select" className="sr-only">
            Programming language
          </label>
          <select
            id="language-select"
            aria-label="Programming language"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
            className="bg-zinc-900 border border-zinc-700/80 rounded px-2.5 py-1 text-xs text-emerald-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="cpp">C++ (GCC 13)</option>
            <option value="python">Python 3.12</option>
            <option value="javascript">JavaScript (Node.js)</option>
          </select>

          {/* Reset starter code */}
          <button
            onClick={handleResetCode}
            title="Reset to starter code"
            aria-label="Reset to starter code"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Run Code Button */}
          <Button
            variant="default"
            size="sm"
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            aria-label="Run code on sample test cases"
            className="flex items-center gap-1.5"
          >
            {isRunning ? (
              <Spinner size="sm" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunning ? 'Running...' : 'Run'}</span>
          </Button>

          {/* Submit Button with Double-Submit Prevention */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            aria-label="Submit solution for judging"
            className="flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <Spinner size="sm" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{isSubmitting ? 'Evaluating...' : 'Submit'}</span>
          </Button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800 overflow-hidden">
        {/* Left pane: Problem Details */}
        <div className="flex flex-col h-full overflow-hidden bg-[#0a0a0b]">
          {/* Tabs header */}
          <div className="flex items-center gap-2 border-b border-zinc-800 bg-[#111113]/80 px-4 pt-2 shrink-0">
            <button
              onClick={() => setActiveTab('description')}
              className={`flex items-center gap-2 pb-2 px-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'description'
                  ? 'border-emerald-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Description</span>
            </button>

            {isLoggedIn && (
              <button
                onClick={() => {
                  setActiveTab('submissions');
                  fetchSubmissions();
                }}
                className={`flex items-center gap-2 pb-2 px-2 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'submissions'
                    ? 'border-emerald-500 text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Submissions</span>
              </button>
            )}
          </div>

          {/* Content tab */}
          {activeTab === 'description' ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-zinc-300">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-xl font-bold text-white">
                    {problem.id}. {problem.title}
                  </h1>
                  <Badge variant={getDifficultyVariant(problem.difficulty)}>
                    {problem.difficulty}
                  </Badge>
                </div>
                <span className="text-xs text-zinc-500">{problem.category}</span>
              </div>

              <div className="prose prose-invert max-w-none text-zinc-300 whitespace-pre-line leading-relaxed text-sm">
                {problem.description}
              </div>

              {/* Examples */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Examples
                </h3>
                {problem.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="bg-[#111113] border border-zinc-800 rounded-lg p-3 text-xs space-y-2 font-mono"
                  >
                    <div>
                      <span className="text-zinc-500 font-sans font-semibold">Input: </span>
                      <span className="text-zinc-200">{ex.input}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-sans font-semibold">Output: </span>
                      <span className="text-emerald-400">{ex.output}</span>
                    </div>
                    {ex.explanation && (
                      <div className="text-zinc-400 font-sans text-xs border-t border-zinc-800 pt-1.5 mt-1.5">
                        <span className="font-semibold text-zinc-500">Explanation: </span>
                        {ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Constraints */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Constraints
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400 font-mono">
                  {problem.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm text-zinc-300">
              {isLoadingSubmissions ? (
                <div className="flex items-center justify-center py-12 text-zinc-500 gap-2">
                  <Spinner size="default" />
                  <span>Loading submissions...</span>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <History className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                  <p className="text-sm font-medium text-zinc-400">No submissions yet</p>
                  <p className="text-xs text-zinc-600 mt-1">Submit your code to view submission history.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSubmission(sub)}
                      className="p-3 bg-[#111113] hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-lg cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={sub.status === 'Accepted' ? 'easy' : 'destructive'}
                          >
                            {sub.status}
                          </Badge>
                          <span className="text-[11px] uppercase font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                            {sub.language}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-500 flex items-center gap-3">
                          <span>{sub.passedTests}/{sub.totalTests} passed</span>
                          <span>•</span>
                          <span>{sub.runtimeMs} ms</span>
                          <span>•</span>
                          <span>{sub.memoryMb} MB</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-zinc-500">
                          {new Date(sub.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <span className="text-xs text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          View &rarr;
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right pane: Monaco Editor + Console / Results */}
        <div className="flex flex-col h-full overflow-hidden bg-[#0a0a0b]">
          {/* Editor Area */}
          <div className="flex-[3] min-h-[300px] border-b border-zinc-800 relative">
            <Editor
              height="100%"
              language={getMonacoLang(language)}
              value={code}
              theme="vs-dark"
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                padding: { top: 12, bottom: 12 }
              }}
            />
          </div>

          {/* Console / Test runner output panel */}
          <div className="flex-[2] flex flex-col min-h-[200px] bg-[#111113]/60 overflow-hidden">
            {/* Console tab header */}
            <div className="h-9 border-b border-zinc-800 bg-[#111113] px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4 text-xs font-medium">
                <button
                  onClick={() => setActiveConsoleTab('testcase')}
                  className={`flex items-center gap-1.5 py-2 border-b-2 transition-colors ${
                    activeConsoleTab === 'testcase'
                      ? 'border-emerald-500 text-white'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Testcase</span>
                </button>
                <button
                  onClick={() => setActiveConsoleTab('result')}
                  className={`flex items-center gap-1.5 py-2 border-b-2 transition-colors ${
                    activeConsoleTab === 'result'
                      ? 'border-emerald-500 text-white'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>Test Result</span>
                  {result && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        result.status === 'Accepted' ? 'bg-emerald-400' : 'bg-rose-500'
                      }`}
                    ></span>
                  )}
                </button>
              </div>
            </div>

            {/* Console tab body */}
            <div className="flex-1 overflow-y-auto p-4 text-xs">
              {activeConsoleTab === 'testcase' && (
                <div className="space-y-4">
                  {/* Test case buttons */}
                  <div className="flex items-center gap-2">
                    {problem.sampleTestCases.map((tc, index) => (
                      <button
                        key={tc.id || index}
                        onClick={() => setTestCaseTab(index)}
                        className={`px-3 py-1 rounded text-xs transition-colors font-medium ${
                          testCaseTab === index
                            ? 'bg-zinc-800 text-white border border-zinc-700'
                            : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                        }`}
                      >
                        Case {index + 1}
                      </button>
                    ))}
                  </div>

                  {/* Selected test case input */}
                  {problem.sampleTestCases[testCaseTab] && (
                    <div className="space-y-3 font-mono">
                      <div>
                        <div className="text-zinc-500 mb-1 font-sans font-semibold">Input:</div>
                        <div className="bg-[#0a0a0b] p-2.5 rounded border border-zinc-800 text-zinc-200">
                          {problem.sampleTestCases[testCaseTab].input}
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500 mb-1 font-sans font-semibold">Expected Output:</div>
                        <div className="bg-[#0a0a0b] p-2.5 rounded border border-zinc-800 text-emerald-400">
                          {problem.sampleTestCases[testCaseTab].expectedOutput}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeConsoleTab === 'result' && (
                <div>
                  {/* Form validation alert */}
                  {validationError && (
                    <div className="mb-4">
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Validation Error</AlertTitle>
                        <AlertDescription>{validationError}</AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Loading state */}
                  {isRunning || isSubmitting ? (
                    <div className="flex flex-col items-center justify-center py-8 text-zinc-400 space-y-3">
                      <Spinner size="lg" />
                      <p className="text-xs">
                        {isSubmitting
                          ? 'Compiling and judging against test suite...'
                          : 'Running sample test cases...'}
                      </p>
                    </div>
                  ) : !result && !validationError ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-8 text-zinc-500 text-center space-y-2">
                      <Inbox className="w-8 h-8 text-zinc-600 opacity-60" />
                      <p className="text-xs font-medium text-zinc-400">No test results yet</p>
                      <p className="text-xs text-zinc-600 max-w-xs">
                        Run your code or submit to view execution feedback here.
                      </p>
                    </div>
                  ) : result ? (
                    /* Results state */
                    <div className="space-y-4">
                      {/* Verdict Banner */}
                      <div className="flex items-center justify-between bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                        <div>{getStatusBadge(result.status)}</div>
                        <div className="flex items-center gap-4 text-zinc-400 font-mono text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{result.runtimeMs} ms</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Cpu className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{result.memoryMb} MB</span>
                          </div>
                        </div>
                      </div>

                      {/* Error Alert if not Accepted */}
                      {result.status !== 'Accepted' && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Execution Failed: {result.status}</AlertTitle>
                          <AlertDescription className="mt-1 space-y-2">
                            <p>
                              {result.details ||
                                'Your solution did not produce the expected output on all test cases.'}
                            </p>
                            <div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSubmit}
                                disabled={isSubmitting || isRunning}
                                className="mt-2 text-rose-300 border-rose-800 hover:bg-rose-950/40"
                              >
                                ↻ Retry Submission
                              </Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Test case breakdown if available */}
                      {result.testCaseResults && result.testCaseResults.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-zinc-400 font-sans text-xs font-medium">
                            Test Cases Passed: {result.passedTests} / {result.totalTests}
                          </div>
                          {result.testCaseResults.map((tc, idx) => (
                            <div
                              key={tc.testCaseId || idx}
                              className="bg-[#0a0a0b] p-2.5 rounded border border-zinc-800 text-xs space-y-1 font-mono"
                            >
                              <div className="flex items-center justify-between font-sans">
                                <span className="font-semibold text-zinc-300">Case {idx + 1}</span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                    tc.passed
                                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                                  }`}
                                >
                                  {tc.passed ? 'PASSED' : 'FAILED'}
                                </span>
                              </div>
                              <div className="text-zinc-400">Input: {tc.input}</div>
                              <div className="text-emerald-400">Expected: {tc.expected}</div>
                              <div className={tc.passed ? 'text-zinc-200' : 'text-rose-400'}>
                                Output: {tc.actual}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal using shadcn/ui Dialog */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent onClose={() => setShowSuccessModal(false)} className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-lg shadow-emerald-500/20">
            <CheckCircle className="w-9 h-9" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-800 mb-2">
            <PartyPopper className="w-3.5 h-3.5" />
            <span>Accepted Solution</span>
          </div>

          <DialogTitle className="text-2xl font-bold text-white mb-2 text-center">
            Task Solved!
          </DialogTitle>

          <DialogDescription className="text-zinc-300 text-xs mb-6 text-center">
            Congratulations! Your solution for <strong className="text-white">{problem.title}</strong> passed all test cases.
          </DialogDescription>

          {/* Metrics */}
          {result && (
            <div className="grid grid-cols-2 gap-3 mb-6 bg-[#0a0a0b] p-3 rounded-xl border border-zinc-800">
              <div className="text-center">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Runtime</div>
                <div className="text-emerald-400 font-bold text-sm font-mono mt-0.5">{result.runtimeMs} ms</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Memory</div>
                <div className="text-emerald-400 font-bold text-sm font-mono mt-0.5">{result.memoryMb} MB</div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setShowSuccessModal(false);
                onBack();
              }}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <ListOrdered className="w-4 h-4" />
              <span>All Problems</span>
            </Button>

            {nextProblem && onSelectProblem ? (
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  setShowSuccessModal(false);
                  onSelectProblem(nextProblem);
                }}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <span>Next Task</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowSuccessModal(false)}
                className="flex-1"
              >
                <span>Close</span>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
          <DialogContent onClose={() => setSelectedSubmission(null)} className="max-w-2xl p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant={selectedSubmission.status === 'Accepted' ? 'easy' : 'destructive'}>
                  {selectedSubmission.status}
                </Badge>
                <span className="text-sm font-semibold text-zinc-200">
                  Submission #{selectedSubmission.id}
                </span>
              </div>
            </div>

            <div className="px-6 py-3 bg-[#0a0a0b] border-b border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-zinc-500 block">Language</span>
                <span className="text-zinc-200 font-mono font-medium uppercase">{selectedSubmission.language}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Runtime</span>
                <span className="text-emerald-400 font-mono font-medium">{selectedSubmission.runtimeMs} ms</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Memory</span>
                <span className="text-emerald-400 font-mono font-medium">{selectedSubmission.memoryMb} MB</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Passed Tests</span>
                <span className="text-zinc-200 font-mono font-medium">{selectedSubmission.passedTests}/{selectedSubmission.totalTests}</span>
              </div>
            </div>

            <div className="min-h-[250px] max-h-[380px] border-b border-zinc-800">
              <Editor
                height="100%"
                language={getMonacoLang(selectedSubmission.language)}
                value={selectedSubmission.code}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  padding: { top: 8, bottom: 8 }
                }}
              />
            </div>

            <div className="px-6 py-3 bg-[#111113] flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSubmission(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setLanguage(selectedSubmission.language);
                  setCode(selectedSubmission.code);
                  setSelectedSubmission(null);
                }}
                className="flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore to editor</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
