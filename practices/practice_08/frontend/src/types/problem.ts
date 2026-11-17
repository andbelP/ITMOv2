export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: string;
  description: string;
  constraints: string[];
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  starterCode: {
    cpp: string;
    python: string;
    javascript: string;
  };
  sampleTestCases: TestCase[];
  hiddenTestCases?: TestCase[];
}

export type SupportedLanguage = 'cpp' | 'python' | 'javascript';

export interface SubmissionResult {
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Compilation Error' | 'Runtime Error';
  runtimeMs: number;
  memoryMb: number;
  passedTests: number;
  totalTests: number;
  details?: string;
  testCaseResults?: {
    testCaseId: string;
    passed: boolean;
    input: string;
    expected: string;
    actual: string;
    stderr?: string;
  }[];
}

export interface Submission {
  id: number;
  userId?: number;
  problemId: string;
  language: SupportedLanguage;
  code: string;
  status: SubmissionResult['status'] | string;
  runtimeMs: number;
  memoryMb: number;
  passedTests: number;
  totalTests: number;
  createdAt: string;
}

export interface User {
  id: number;
  username: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
