import { describe, it, expect } from 'vitest';
import { MOCK_PROBLEMS } from './mockProblems';

describe('mockProblems dataset', () => {
  it('contains expected default problems', () => {
    expect(MOCK_PROBLEMS.length).toBeGreaterThanOrEqual(4);
  });

  it('each problem has required fields, test cases, and starter code for all 3 languages', () => {
    MOCK_PROBLEMS.forEach((problem) => {
      expect(problem.id).toBeTruthy();
      expect(problem.slug).toBeTruthy();
      expect(problem.title).toBeTruthy();
      expect(['Easy', 'Medium', 'Hard']).toContain(problem.difficulty);
      expect(problem.category).toBeTruthy();
      expect(problem.description).toBeTruthy();

      expect(problem.starterCode.cpp).toBeTruthy();
      expect(problem.starterCode.python).toBeTruthy();
      expect(problem.starterCode.javascript).toBeTruthy();

      expect(problem.sampleTestCases.length).toBeGreaterThan(0);
      problem.sampleTestCases.forEach((tc) => {
        expect(tc.id).toBeTruthy();
        expect(typeof tc.input).toBe('string');
        expect(typeof tc.expectedOutput).toBe('string');
      });
    });
  });
});
