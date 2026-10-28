# Отчет по Практике 5: Spec-Driven Development (GitHub Spec Kit)

Этот отчет описывает выполнение Практики 5 по курсу «Инструменты AI-инжиниринга» в рамках сквозного проекта **AlgoPlace** (платформа для алгоритмических тренировок и онлайн-судейства).

В соответствии с требованиями домашнего задания (слайд 16 презентации) вместо OpenSpec был использован альтернативный SDD-фреймворк — **GitHub Spec Kit** (`specify`), и была проведена эмуляция двух изолированных команд (UI и Backend) с предварительным согласованием общего контракта до генерации кода.

---

## 1. Выбранный инструмент и фича

* **SDD-фреймворк:** [GitHub Spec Kit](https://github.com/github/spec-kit) (`specify` CLI), официально рекомендованный и рассмотренный в лекции 5 (слайд 33).
* **Фича:** **Поиск задач по названию в каталоге (Problem Search by Title)**.
  > **User Story:** *«Как пользователь платформы AlgoPlace, я хочу быстро находить нужные задачи по подстроке в названии прямо в каталоге, чтобы не тратить время на скролл всего списка»*.

---

## 2. Эмуляция работы двух команд

Разработка велась в двух изолированных контекстах (чатах), эмулирующих две команды разработки:

### 2.1 Команда 1: Frontend UI (`specs/001-problem-search-ui`)
* **Область ответственности:** Пользовательский интерфейс, экраны, состояния и обработка взаимодействия.
* **Артефакты:**
  - [`specs/001-problem-search-ui/spec.md`](specs/001-problem-search-ui/spec.md) — сценарии в формате Given/When/Then (P1: поиск по подстроке, P2: сброс строки поиска, P3: индикация пустого списка).
  - [`specs/001-problem-search-ui/plan.md`](specs/001-problem-search-ui/plan.md) — компонентная архитектура (поле поиска с иконкой `Search`, дебаунс 300 мс, сохранение поисковой строки в URL/стейт).
  - [`specs/001-problem-search-ui/tasks.md`](specs/001-problem-search-ui/tasks.md) — чеклист задач для фронтендера.
  - Первоначальное видение UI-команды по API: запрос `GET /api/problems?query=...`, ожидание объекта с метаданными `{ items: [...], total: N }`, локальный fallback при обрыве связи.

### 2.2 Команда 2: Backend Logic (`specs/002-problem-search-backend`)
* **Область ответственности:** Бизнес-логика, хранилище данных, DTO и HTTP API на Go.
* **Артефакты:**
  - [`specs/002-problem-search-backend/spec.md`](specs/002-problem-search-backend/spec.md) — спецификация серверной логики (валидация параметров, регистронезависимый поиск `ILIKE %q%` / `strings.Contains`).
  - [`specs/002-problem-search-backend/plan.md`](specs/002-problem-search-backend/plan.md) — слои хэндлера, интерфейса репозитория и Go-моделей.
  - [`specs/002-problem-search-backend/tasks.md`](specs/002-problem-search-backend/tasks.md) — чеклист задач для бэкендера.
  - Первоначальное видение Backend-команды: параметр `GET /api/problems?q=...`, возврат плоского массива `[]Problem` для сохранения обратной совместимости, изначальная идея возвращать 404 при отсутствии совпадений.

---

## 3. Согласование общего контракта (Contract Harmonization)

До начала генерации кода команды провели сессию согласования и зафиксировали единые контракты:
* Фронтенд-контракт: [`specs/001-problem-search-ui/contracts/problem-list-search.md`](specs/001-problem-search-ui/contracts/problem-list-search.md)
* Бэкенд-контракт: [`specs/002-problem-search-backend/contracts/problems-search-api.md`](specs/002-problem-search-backend/contracts/problems-search-api.md)

### Таблица согласования расхождений:

| Вопрос / Конфликт | Позиция Команды 1 (UI) | Позиция Команды 2 (Backend) | Согласованное решение |
|---|---|---|---|
| **Имя параметра** | `?query=` | `?q=` | Принят `?q=` как основной REST-параметр, с поддержкой `?query=` как алиаса для гибкости. |
| **Формат ответа** | `{ items: [], total: N }` | Плоский массив `[]Problem` | **Плоский массив `[]Problem`** — чтобы не ломать обратную совместимость с другими частями системы. |
| **Пустой результат** | HTTP 200 + `[]` | HTTP 404 Not Found | **Строго HTTP 200 OK и пустой массив `[]`** (пустая выборка поиска не является ошибкой ресурса). |
| **Регистр поиска** | Ожидание нечувствительности | Точное совпадение | **Регистронезависимый поиск** (`strings.ToLower` в Go). |
| **Сетевые сбои** | Требовался fallback | Не относится к бэкенду | Фронтенд при ошибках сети прозрачно фильтрует `MOCK_PROBLEMS` локально. |

---

## 4. Артефакты GitHub Spec Kit

В репозитории зафиксирована структура Spec Kit:
* [`.specify/memory/constitution.md`](.specify/memory/constitution.md) — фундаментальные правила проекта (Go 1.22+, React 19 + TypeScript, обратная совместимость API, обязательный прогон верификации).
* [`.specify/feature.json`](.specify/feature.json) и конфигурации интеграций.
* Папки спецификаций `specs/001-problem-search-ui` и `specs/002-problem-search-backend`.

---

## 5. Реализация и автоматическая верификация

После утверждения контракта была выполнена реализация строго по таскам:
1. **Бэкенд (Go):**
   - Модель `ProblemFilter` и юнит-тесты в `backend/internal/models/`.
   - Поддержка поиска в репозитории `SearchProblems(query string)` в `backend/internal/repository/`.
   - Хэндлер `GetProblems` с извлечением `r.URL.Query().Get("q")` и тесты в `backend/internal/handlers/api_test.go`.
2. **Фронтенд (React 19 + TypeScript):**
   - Метод `getProblems(query?: string)` в `frontend/src/services/api.ts` с поддержкой offline mock fallback.
   - Компонент `ProblemList.tsx` с полем ввода поиска, дебаунсом и плашкой «Задачи не найдены».
   - Тесты на фильтрацию и рендер в `ProblemList.test.tsx` и `api.test.ts`.

### Лог обязательного хука `./scripts/verify-tests.sh`:
```bash
==========================================
 [HOOK] Running AlgoPlace Verification Suite
==========================================
--> 1. Verifying Frontend (TypeScript & Vite production build)...

> frontend@0.0.0 build
> tsc -b && vite build

vite v8.3.2 building client environment for production...
transforming (1372) node_modules/lucide-react/dist/esm/icons/folder-search.mjs✓ 1906 modules transformed.
rendering chunks (1)...computing gzip size...
dist/index.html                   0.49 kB │ gzip:  0.32 kB
dist/assets/index-njZlFB_-.css   37.72 kB │ gzip:  7.06 kB
dist/assets/index-Cg0WB1EY.js   300.54 kB │ gzip: 89.51 kB

✓ built in 354ms
--> 2. Verifying Backend (Go Unit & Runner Tests)...
?   	algoplace-backend/cmd/server	[no test files]
=== RUN   TestGenerateAndValidateToken
--- PASS: TestGenerateAndValidateToken (0.00s)
=== RUN   TestValidateInvalidToken
--- PASS: TestValidateInvalidToken (0.00s)
=== RUN   TestPasswordHashing
--- PASS: TestPasswordHashing (0.00s)
PASS
ok  	algoplace-backend/internal/auth	(cached)
=== RUN   TestHealthCheck
--- PASS: TestHealthCheck (0.00s)
=== RUN   TestRegister_Success
--- PASS: TestRegister_Success (0.07s)
=== RUN   TestRegister_ValidationErrors
--- PASS: TestRegister_ValidationErrors (0.04s)
=== RUN   TestLogin_SuccessAndFailure
--- PASS: TestLogin_SuccessAndFailure (0.13s)
=== RUN   TestGetMe
--- PASS: TestGetMe (0.04s)
=== RUN   TestGetProblems_And_GetProblemBySlug
--- PASS: TestGetProblems_And_GetProblemBySlug (0.00s)
=== RUN   TestGetProblems_Search
--- PASS: TestGetProblems_Search (0.00s)
=== RUN   TestRunCode
--- PASS: TestRunCode (0.00s)
=== RUN   TestSubmitCode
--- PASS: TestSubmitCode (0.00s)
=== RUN   TestAdminHandlers
--- PASS: TestAdminHandlers (0.00s)
=== RUN   TestGetProblemSubmissions
--- PASS: TestGetProblemSubmissions (0.00s)
PASS
ok  	algoplace-backend/internal/handlers	(cached)
=== RUN   TestUserJSONSerialization
--- PASS: TestUserJSONSerialization (0.00s)
=== RUN   TestProblemJSONSerialization
--- PASS: TestProblemJSONSerialization (0.00s)
=== RUN   TestSubmissionRecordJSONSerialization
--- PASS: TestSubmissionRecordJSONSerialization (0.00s)
=== RUN   TestProblemFilter
--- PASS: TestProblemFilter (0.00s)
PASS
ok  	algoplace-backend/internal/models	(cached)
=== RUN   TestDefaultRepository
--- PASS: TestDefaultRepository (0.00s)
=== RUN   TestProblemSearch
--- PASS: TestProblemSearch (0.00s)
PASS
ok  	algoplace-backend/internal/repository	(cached)
=== RUN   TestExecuteEmptyCode
--- PASS: TestExecuteEmptyCode (0.00s)
=== RUN   TestExecutePythonSuccess
--- PASS: TestExecutePythonSuccess (0.02s)
=== RUN   TestExecutePythonWrongAnswer
--- PASS: TestExecutePythonWrongAnswer (0.01s)
=== RUN   TestExecuteTimeout
--- PASS: TestExecuteTimeout (4.00s)
PASS
ok  	algoplace-backend/internal/runner	(cached)
==========================================
 [HOOK PASSED] All tests & builds passed!
==========================================
```

---

## 6. Демонстрация сценариев (Короткое демо)

1. **Базовый сценарий:** При открытии страницы отображаются все задачи каталога (`/api/problems`).
2. **Поиск по подстроке:** Пользователь вводит `"Two"` $\rightarrow$ список динамически отфильтровывается до задачи `"Two Sum"`.
3. **Регистронезависимость:** Пользователь вводит `"reverse"` $\rightarrow$ находятся `"Reverse Linked List"`, независимо от регистра.
4. **Граничный случай (нет совпадений):** Пользователь вводит `"NonExistent"` $\rightarrow$ сервер возвращает HTTP 200 и `[]`, на интерфейсе отображается понятная плашка: *«Задачи не найдены. Попробуйте изменить поисковый запрос»*.
5. **Сброс поиска:** Очистка инпута мгновенно восстанавливает полный список задач.
