# Отчёт 2. Повторные атаки после исправлений и верификация защиты

В данном отчёте задокументированы результаты повторного тестирования безопасности сервиса `Mini Shop` после внедрения многоуровневой системы защиты (Defense-in-Depth) в `practices/practice_06/lab/service.py` и добавления регрессионных тестов в `test_service.py`.

---

## 1. Сводная таблица результатов повторного тестирования

| № | Уязвимость (из Отчёта 1) | Метод защиты | Исходный статус | Новый статус | Результат проверки |
|---|---|---|:---:|:---:|---|
| 1 | SQLi в `GET /profile` | Валидация целочисленного ID + параметризация `?` | 200 (Leaked) | **400 / 403** | **Устранена.** Инъекция отклоняется, не доходя до БД |
| 2 | SQLi в `GET /search` | Параметризованный поиск `LIKE ?` + изоляция по сессии | 200 (Leaked) | **200 (Empty)** | **Устранена.** Спецсимволы воспринимаются как литералы |
| 3 | IDOR в `GET /profile` и `GET /orders` | Обязательная проверка `X-Token` + фильтрация по `owner = session['id']` | 200 (All data) | **401 / 403** | **Устранена.** Клиент видит строго свои заказы и профиль |
| 4 | Спуфинг роли администратора | Проверка роли исключительно по серверной сессии (игнорирование `X-Role`) | 200 (Bypass) | **403 Forbidden** | **Устранена.** Подделка заголовка больше не дает прав |
| 5 | Манипуляция ценой (Price Tampering) | Принудительная установка каталожной цены `self.products[product]` | 201 (0.01 RUB) | **201 (Catalog price)** | **Устранена.** Клиентская цена игнорируется |
| 6 | Path Traversal в `GET /files` | Валидация пути (`Path(req_path).parts`), запрет `..`, ограничение `files/{user}/` | 200 (Secret leaked) | **400 / 403** | **Устранена.** Выход за пределы папки пользователя заблокирован |
| 7 | Stored XSS в отзывах | Экранирование вывода через `html.escape()` в `/reviews/view` | 200 (Raw HTML) | **200 (Escaped)** | **Устранена.** Скрипты отображаются как безопасный текст |
| 8 | Утечка паролей/токенов в логах | Маскирование чувствительных полей (`***`) + доступ к логам только для `staff` | 200 (Cleartext) | **403 / Masked** | **Устранена.** Пароли и токены скрыты |
| 9 | Неконтролируемый `delete_tree` в execute | Полный запрет деструктивного инструмента `delete_tree` для клиентов | 200 (Deleted) | **403 Forbidden** | **Устранена.** Опасный инструмент заблокирован |
| 10| Неавторизованный `/assistant/execute` | Обязательная сессия + проверка прав на чтение только своих файлов | 200 (Bypass) | **401 / 403** | **Устранена.** Межпользовательский доступ через AI невозможен |

---

## 2. Протокол повторных атак (PoC Re-testing)

### 2.1. SQL-инъекция в `GET /profile`
* **Запрос атаки:**
  ```bash
  curl -s -H "X-Token: <alice_token>" "http://127.0.0.1:8066/profile?id=1%20UNION%20SELECT%20999,'INJECTED','leak@ex','secret_addr'"
  ```
* **Ответ сервера:** `HTTP 400 Bad Request`
  ```json
  {"error": "invalid profile id"}
  ```
* **Вердикт:** Атака заблокирована на этапе валидации типа параметра.

---

### 2.2. SQL-инъекция в `GET /search`
* **Запрос атаки:**
  ```bash
  curl -s -H "X-Token: <alice_token>" "http://127.0.0.1:8066/search?q='%20OR%201=1%20--"
  ```
* **Ответ сервера:** `HTTP 200 OK`
  ```json
  []
  ```
* **Вердикт:** Строка `%27%20OR%201=1%20--` передана в SQL-драйвер как экранированный литерал. Чужие профили не раскрыты.

---

### 2.3. IDOR: Доступ к чужому профилю и заказам
* **Запрос атаки (Alice запрашивает профиль Bob `id=2`):**
  ```bash
  curl -s -H "X-Token: <alice_token>" "http://127.0.0.1:8066/profile?id=2"
  ```
* **Ответ сервера:** `HTTP 403 Forbidden`
  ```json
  {"error": "access denied"}
  ```
* **Запрос атаки (Запрос заказов без аутентификации):**
  ```bash
  curl -s "http://127.0.0.1:8066/orders"
  ```
* **Ответ сервера:** `HTTP 401 Unauthorized`
  ```json
  {"error": "login required"}
  ```
* **Вердикт:** Горизонтальная эскалация привилегий и неавторизованный доступ ликвидированы.

---

### 2.4. Спуфинг роли администратора через `X-Role`
* **Запрос атаки (С фейковым заголовком без сессии):**
  ```bash
  curl -s -H "X-Role: staff" "http://127.0.0.1:8066/admin/export"
  ```
* **Ответ сервера:** `HTTP 403 Forbidden` (`{"error": "staff only"}`)
* **Запрос атаки (С сессией клиента Alice и заголовком `X-Role: staff`):**
  ```bash
  curl -s -H "X-Token: <alice_token>" -H "X-Role: staff" "http://127.0.0.1:8066/admin/export"
  ```
* **Ответ сервера:** `HTTP 403 Forbidden` (`{"error": "staff only"}`)
* **Вердикт:** Заголовок `X-Role` полностью игнорируется сервером. Авторизация происходит строго по серверной сессии.

---

### 2.5. Манипуляция ценой (Price Tampering) в `POST /orders`
* **Запрос атаки:**
  ```bash
  curl -s -X POST -H "Content-Type: application/json" \
       -H "X-Token: <alice_token>" \
       -d '{"product": "chair", "price": 0.01}' \
       "http://127.0.0.1:8066/orders"
  ```
* **Ответ сервера:** `HTTP 201 Created`
  ```json
  {"id": 3, "owner": 1, "product": "chair", "price": 5000}
  ```
* **Вердикт:** Значение `price: 0.01` проигнорировано; зафиксирована честная цена каталога (5000 руб.).

---

### 2.6. Path Traversal и чтение закрытых файлов в `GET /files`
* **Запрос атаки (Попытка выхода в корень песочницы через `user=..`):**
  ```bash
  curl -s -H "X-Token: <alice_token>" "http://127.0.0.1:8066/files?user=..&path=private/operator-note.txt"
  ```
* **Ответ сервера:** `HTTP 403 Forbidden` (`{"error": "access denied to other user files"}`)
* **Запрос атаки (Попытка обхода через `path=../`):**
  ```bash
  curl -s -H "X-Token: <alice_token>" "http://127.0.0.1:8066/files?path=../operator-note.txt"
  ```
* **Ответ сервера:** `HTTP 400 Bad Request` (`{"error": "invalid file path"}`)
* **Вердикт:** Доступ к секрету оператора (`private/operator-note.txt`) заблокирован намертво.

---

### 2.7. Хранимый XSS в отзывах
* **Запрос:** Сохранен отзыв с `<script>alert('xss')</script>`. Запрос `GET /reviews/view`.
* **HTML-ответ сервера:**
  ```html
  <html><body><p>&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;</p></body></html>
  ```
* **Вердикт:** Все специальные HTML-символы экранированы. XSS-пейлоад обезврежен.

---

### 2.8. Утечка учетных данных в `GET /debug/logs`
* **Запрос от клиента Alice:** `HTTP 403 Forbidden`
* **Запрос от сотрудника Staff:**
  ```json
  [
    {"method": "POST", "target": "/login", "body": {"username": "alice", "password": "***"}, "headers": {"X-Token": "***"}}
  ]
  ```
* **Вердикт:** Пароли и токены замаскированы маской `***`; доступ открыт исключительно для роли `staff`.

---

### 2.9. Исполнение деструктивных тулов в `POST /assistant/execute`
* **Запрос атаки (Попытка вызова `delete_tree` от имени клиента):**
  ```bash
  curl -s -X POST -H "Content-Type: application/json" \
       -H "X-Token: <alice_token>" \
       -d '{"decision": {"tool": "delete_tree", "arguments": {"path": "files"}}}' \
       "http://127.0.0.1:8066/assistant/execute"
  ```
* **Ответ сервера:** `HTTP 403 Forbidden`
  ```json
  {"error": "tool delete_tree is forbidden"}
  ```
* **Запрос атаки (Попытка прочитать чек чужого пользователя `files/bob/receipt.txt`):**
  ```bash
  curl -s -X POST -H "Content-Type: application/json" \
       -H "X-Token: <alice_token>" \
       -d '{"decision": {"tool": "read_file", "arguments": {"path": "files/bob/receipt.txt"}}}' \
       "http://127.0.0.1:8066/assistant/execute"
  ```
* **Ответ сервера:** `HTTP 403 Forbidden`
  ```json
  {"error": "forbidden: can only access own files"}
  ```
* **Вердикт:** Серверный обработчик жестко валидирует права субъекта, блокируя любые попытки эскалации через AI-инструменты.

---

## 3. Результаты автоматизированного тестирования

В репозиторий добавлен комплексный пакет тестов безопасности (12 новых тестов) в [`test_service.py`](lab/test_service.py).

Запуск полного набора тестов сервиса:
```bash
$ make step6
Standard library only: ready
Ran 28 tests in 0.557s
OK
```

Запуск глобального набора тестов репозитория:
```bash
$ make test
Practice 1 artifacts: OK
Practice 2 artifacts: OK
Ran 3 tests in 0.000s (Practice 3: OK)
Ran 28 tests in 0.551s (Practice 6: OK)
OK
```

Все 28 тестов (функциональные + регрессионные тесты безопасности) успешно проходят.
Легитимная функциональность клиентов (покупка, чтение собственного чека, отправка отзывов) и сотрудников (экспорт базы, просмотр журналов) полностью сохранена.
