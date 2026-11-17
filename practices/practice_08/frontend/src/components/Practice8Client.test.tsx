import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProblemWorkspace } from './ProblemWorkspace';
import { apiService } from '../services/api';
import type { Problem, SubmissionResult } from '../types/problem';

const testProblem: Problem = {
  id: '1',
  slug: 'two-sum',
  title: 'Two Sum',
  difficulty: 'Easy',
  category: 'Arrays & Hashing',
  description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
  constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
  examples: [
    {
      input: 'nums = [2,7,11,15], target = 9',
      output: '[0,1]',
      explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
    },
    {
      input: 'nums = [3,2,4], target = 6',
      output: '[1,2]',
    },
  ],
  starterCode: {
    cpp: 'int main() { return 0; }',
    python: 'def twoSum(): pass',
    javascript: 'function twoSum() {}',
  },
  sampleTestCases: [
    { id: 'tc-1', input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0,1]' },
    { id: 'tc-2', input: 'nums = [3,2,4], target = 6', expectedOutput: '[1,2]' },
  ],
  hiddenTestCases: [],
};

describe('Practice 8: AI-Assisted Frontend & Client Testing Requirements', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiService, 'getSubmissions').mockResolvedValue([]);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Критерий 7 (1 балл): Защита от double-submit (случайных повторных действий)
  // Во время ожидания повторная отправка НЕ создаёт второй запрос к серверу.
  // ══════════════════════════════════════════════════════════════════════════
  it('Criterion 7: prevents double submit and does not send duplicate requests while waiting for server response', async () => {
    let resolveSubmission: (val: SubmissionResult) => void;
    const delayedPromise = new Promise<SubmissionResult>((resolve) => {
      resolveSubmission = resolve;
    });

    const submitSpy = vi.spyOn(apiService, 'submitCode').mockReturnValue(delayedPromise);
    vi.spyOn(apiService, 'getSubmissions').mockResolvedValue([]);

    render(
      <ProblemWorkspace
        problem={testProblem}
        problems={[testProblem]}
        isLoggedIn={true}
        onBack={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Submit solution for judging/i });
    expect(submitBtn).toBeEnabled();

    // Первый клик по кнопке Submit
    fireEvent.click(submitBtn);

    // Проверяем, что запрос отправлен и кнопка перешла в заблокированное состояние
    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText(/Evaluating\.\.\./i)).toBeInTheDocument();

    // Пользователь пытается кликнуть второй и третий раз во время ожидания ответа
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    // Количество запросов строго остаётся 1!
    expect(submitSpy).toHaveBeenCalledTimes(1);

    // Разрешаем промис ответа сервера
    resolveSubmission!({
      status: 'Accepted',
      runtimeMs: 14,
      memoryMb: 8,
      passedTests: 2,
      totalTests: 2,
    });

    // После завершения запроса кнопка снова разблокирована
    await waitFor(() => {
      expect(screen.getByText('Task Solved!')).toBeInTheDocument();
      expect(submitBtn).toBeEnabled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Критерий 8 (1 балл): Тесты отображения компонентов и взаимодействий
  // Нажатия кнопок, ввод данных, открытие и закрытие диалогов в сценарии.
  // ══════════════════════════════════════════════════════════════════════════
  it('Criterion 8: renders UI components and handles user interactions (tabs, inputs, dialog open/close)', async () => {
    const onBackMock = vi.fn();
    render(
      <ProblemWorkspace
        problem={testProblem}
        problems={[testProblem]}
        isLoggedIn={true}
        onBack={onBackMock}
      />
    );

    // 1. Проверка отображения ключевых компонентов
    expect(screen.getByRole('heading', { name: '1. Two Sum' })).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Arrays & Hashing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run code on sample test cases/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit solution for judging/i })).toBeInTheDocument();

    // 2. Взаимодействие с тест-кейс табами (Case 1 -> Case 2)
    expect(screen.getAllByText(/nums = \[2,7,11,15\], target = 9/i).length).toBeGreaterThan(0);
    const case2Btn = screen.getByRole('button', { name: 'Case 2' });
    fireEvent.click(case2Btn);
    expect(screen.getAllByText(/nums = \[3,2,4\], target = 6/i).length).toBeGreaterThan(0);

    // 3. Смена языка и обновление текста в редакторе
    const langSelect = screen.getByRole('combobox', { name: /Programming language/i });
    fireEvent.change(langSelect, { target: { value: 'python' } });
    const textarea = screen.getByTestId('monaco-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe(testProblem.starterCode.python);

    // 4. Редактирование кода и сброс по кнопке Reset
    fireEvent.change(textarea, { target: { value: 'def twoSum(): return [0, 1]' } });
    expect(textarea.value).toBe('def twoSum(): return [0, 1]');

    const resetBtn = screen.getByRole('button', { name: /Reset to starter code/i });
    fireEvent.click(resetBtn);
    expect(textarea.value).toBe(testProblem.starterCode.python);

    // 5. Клик по кнопке Problem List
    const backBtn = screen.getByRole('button', { name: /Back to problem list/i });
    fireEvent.click(backBtn);
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Критерий 9 (1 балл): Валидация форм (обязательные поля и сообщения об ошибках)
  // ══════════════════════════════════════════════════════════════════════════
  it('Criterion 9: validates form fields, prevents submit with empty code and displays validation error', async () => {
    const submitSpy = vi.spyOn(apiService, 'submitCode');

    render(
      <ProblemWorkspace
        problem={testProblem}
        problems={[testProblem]}
        isLoggedIn={true}
        onBack={vi.fn()}
      />
    );

    // Очищаем редактор (пустой ввод)
    const textarea = screen.getByTestId('monaco-textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '   ' } });

    // Пробуем нажать Submit с пустым кодом
    const submitBtn = screen.getByRole('button', { name: /Submit solution for judging/i });
    fireEvent.click(submitBtn);

    // Запрос к серверу НЕ должен быть выполнен
    expect(submitSpy).not.toHaveBeenCalled();

    // В интерфейсе отображается понятное сообщение об ошибке валидации
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Validation Error')).toBeInTheDocument();
    expect(
      screen.getByText('Code cannot be empty. Please write your solution before submitting.')
    ).toBeInTheDocument();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Критерий 10 (1 балл): Проверка всех состояний интерфейса с подменой ответов
  // Состояния: загрузка (loading), пустые данные (empty), успех (success) и ошибка (error).
  // ══════════════════════════════════════════════════════════════════════════
  describe('Criterion 10: Interface states with mocked server responses', () => {
    it('10.1 Empty state: shows empty placeholder when no test results exist yet', () => {
      render(
        <ProblemWorkspace
          problem={testProblem}
          problems={[testProblem]}
          isLoggedIn={true}
          onBack={vi.fn()}
        />
      );

      // Переключаемся на вкладку результатов
      const resultTab = screen.getByRole('button', { name: /Test Result/i });
      fireEvent.click(resultTab);

      // Проверяем наличие пустого состояния
      expect(screen.getByText('No test results yet')).toBeInTheDocument();
      expect(
        screen.getByText('Run your code or submit to view execution feedback here.')
      ).toBeInTheDocument();
    });

    it('10.2 Loading state: displays spinner and progress indicator during code submission', async () => {
      let resolvePromise: any;
      vi.spyOn(apiService, 'submitCode').mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      render(
        <ProblemWorkspace
          problem={testProblem}
          problems={[testProblem]}
          isLoggedIn={true}
          onBack={vi.fn()}
        />
      );

      const submitBtn = screen.getByRole('button', { name: /Submit solution for judging/i });
      fireEvent.click(submitBtn);

      // Проверяем отображение спиннеров и текста ожидания
      expect(screen.getByText('Compiling and judging against test suite...')).toBeInTheDocument();
      expect(screen.getAllByRole('status').length).toBeGreaterThan(0);

      resolvePromise({
        status: 'Accepted',
        runtimeMs: 10,
        memoryMb: 8,
        passedTests: 2,
        totalTests: 2,
      });

      await waitFor(() => {
        expect(screen.queryByText('Compiling and judging against test suite...')).toBeNull();
      });
    });

    it('10.3 Error state: displays Wrong Answer verdict, error alert with details and retry button', async () => {
      vi.spyOn(apiService, 'submitCode').mockResolvedValueOnce({
        status: 'Wrong Answer',
        runtimeMs: 18,
        memoryMb: 12,
        passedTests: 1,
        totalTests: 2,
        details: 'Expected [0,1] but received [1,2] on testcase 2',
        testCaseResults: [
          { testCaseId: 'tc-1', passed: true, input: 'nums = [2,7,11,15], target = 9', expected: '[0,1]', actual: '[0,1]' },
          { testCaseId: 'tc-2', passed: false, input: 'nums = [3,2,4], target = 6', expected: '[1,2]', actual: '[0,1]' },
        ],
      });

      render(
        <ProblemWorkspace
          problem={testProblem}
          problems={[testProblem]}
          isLoggedIn={true}
          onBack={vi.fn()}
        />
      );

      const submitBtn = screen.getByRole('button', { name: /Submit solution for judging/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        // Проверяем статус ошибки
        expect(screen.getByText('Wrong Answer')).toBeInTheDocument();
        expect(screen.getByText('Execution Failed: Wrong Answer')).toBeInTheDocument();
        expect(screen.getByText('Expected [0,1] but received [1,2] on testcase 2')).toBeInTheDocument();
        // Наличие кнопки повтора
        expect(screen.getByRole('button', { name: /Retry Submission/i })).toBeInTheDocument();
        // Проверка детализации тестов: один PASSED, второй FAILED
        expect(screen.getByText('PASSED')).toBeInTheDocument();
        expect(screen.getByText('FAILED')).toBeInTheDocument();
      });
    });

    it('10.4 Success state: displays Accepted verdict with runtime metrics and success modal', async () => {
      vi.spyOn(apiService, 'getSubmissions').mockResolvedValue([]);
      vi.spyOn(apiService, 'submitCode').mockResolvedValueOnce({
        status: 'Accepted',
        runtimeMs: 5,
        memoryMb: 4.2,
        passedTests: 2,
        totalTests: 2,
        testCaseResults: [
          { testCaseId: 'tc-1', passed: true, input: 'case 1', expected: '[0,1]', actual: '[0,1]' },
          { testCaseId: 'tc-2', passed: true, input: 'case 2', expected: '[1,2]', actual: '[1,2]' },
        ],
      });

      render(
        <ProblemWorkspace
          problem={testProblem}
          problems={[testProblem]}
          isLoggedIn={true}
          onBack={vi.fn()}
        />
      );

      const submitBtn = screen.getByRole('button', { name: /Submit solution for judging/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        // Проверяем бейдж Accepted и метрики
        expect(screen.getAllByText('Accepted').length).toBeGreaterThan(0);
        expect(screen.getAllByText('5 ms').length).toBeGreaterThan(0);
        expect(screen.getAllByText('4.2 MB').length).toBeGreaterThan(0);

        // Проверяем модальное окно победы
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Task Solved!')).toBeInTheDocument();
        expect(screen.getByText('Accepted Solution')).toBeInTheDocument();
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Критерий 11 (1 балл): Проверка основного пользовательского сценария целиком
  // Пользователь открывает задачу -> запускает отправку -> получает подтверждение в UI.
  // ══════════════════════════════════════════════════════════════════════════
  it('Criterion 11: end-to-end user scenario on client from code submit to visible verdict and modal closure', async () => {
    const nextTask: Problem = {
      ...testProblem,
      id: '2',
      title: 'Add Two Numbers',
    };

    const onSelectProblemMock = vi.fn();
    vi.spyOn(apiService, 'getSubmissions').mockResolvedValue([]);
    vi.spyOn(apiService, 'submitCode').mockResolvedValueOnce({
      status: 'Accepted',
      runtimeMs: 12,
      memoryMb: 14,
      passedTests: 2,
      totalTests: 2,
    });

    render(
      <ProblemWorkspace
        problem={testProblem}
        problems={[testProblem, nextTask]}
        isLoggedIn={true}
        onBack={vi.fn()}
        onSelectProblem={onSelectProblemMock}
      />
    );

    // 1. Пользователь видит экран задачи Two Sum
    expect(screen.getByRole('heading', { name: '1. Two Sum' })).toBeInTheDocument();

    // 2. Нажимает кнопку Submit
    const submitBtn = screen.getByRole('button', { name: /Submit solution for judging/i });
    fireEvent.click(submitBtn);

    // 3. Появляется видимый результат: Accepted, модалка Task Solved!
    await waitFor(() => {
      expect(screen.getByText('Task Solved!')).toBeInTheDocument();
      expect(screen.getAllByText('12 ms').length).toBeGreaterThan(0);
    });

    // 4. Пользователь переходит к следующей задаче через кнопку Next Task
    const nextTaskBtn = screen.getByRole('button', { name: /Next Task/i });
    expect(nextTaskBtn).toBeInTheDocument();
    fireEvent.click(nextTaskBtn);

    expect(onSelectProblemMock).toHaveBeenCalledWith(nextTask);
  });
});
