import sys
import json

def read_input():
    try:
        line = sys.stdin.readline()
        if not line:
            return None
        return json.loads(line)
    except Exception:
        return None

def write_output(data):
    sys.stdout.write(json.dumps(data) + "\n")
    sys.stdout.flush()

def main():
    # Наш собственный полезный MCP-сервер для AlgoPlace
    # Предоставляет инструмент: get_problem_complexity
    # На вход принимает название алгоритма или slug задачи, на выходе дает Time & Space Complexity
    
    # При старте (согласно протоколу MCP JSON-RPC или простому взаимодействию)
    # Так как это простой JSON-RPC/STDIO MCP сервер, мы поддерживаем:
    # 1. initialize
    # 2. tools/list
    # 3. tools/call
    
    complexities = {
        "two-sum": {
            "time_complexity": "O(N)",
            "space_complexity": "O(N)",
            "description": "Использование Hash Map для быстрого поиска дополнения числа."
        },
        "valid-parentheses": {
            "time_complexity": "O(N)",
            "space_complexity": "O(N)",
            "description": "Классическая задача на использование структуры данных стек (Stack)."
        },
        "merge-sort": {
            "time_complexity": "O(N log N)",
            "space_complexity": "O(N)",
            "description": "Алгоритм сортировки слиянием на основе разделяй-и-властвуй."
        },
        "binary-search": {
            "time_complexity": "O(log N)",
            "space_complexity": "O(1)",
            "description": "Поиск элемента в отсортированном массиве делением пополам."
        }
    }

    while True:
        request = read_input()
        if request is None:
            break
            
        req_id = request.get("id")
        method = request.get("method")
        params = request.get("params", {})

        if method == "initialize":
            write_output({
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {}
                    },
                    "serverInfo": {
                        "name": "algoplace-helper",
                        "version": "1.0.0"
                    }
                }
            })
        elif method == "tools/list":
            write_output({
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "tools": [
                        {
                            "name": "get_problem_complexity",
                            "description": "Возвращает временную (Time) и пространственную (Space) сложность алгоритма по его slug-имени для AlgoPlace.",
                            "inputSchema": {
                                "type": "object",
                                "properties": {
                                    "slug": {
                                        "type": "string",
                                        "description": "Slug-имя задачи (например, 'two-sum', 'binary-search')"
                                    }
                                },
                                "required": ["slug"]
                            }
                        }
                    ]
                }
            })
        elif method == "tools/call":
            tool_name = params.get("name")
            arguments = params.get("arguments", {})
            
            if tool_name == "get_problem_complexity":
                slug = arguments.get("slug")
                if not slug:
                    write_output({
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "error": {
                            "code": -32602,
                            "message": "Ошибка: Обязательный параметр 'slug' отсутствует или пуст."
                        }
                    })
                    continue
                
                # Обработка ошибочного входа
                if slug not in complexities:
                    write_output({
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {
                            "content": [
                                {
                                    "type": "text",
                                    "text": f"Ошибка: Алгоритм с именем '{slug}' не найден в базе знаний AlgoPlace Complexity Helper."
                                }
                            ],
                            "isError": True
                        }
                    })
                else:
                    info = complexities[slug]
                    response_text = (
                        f"Алгоритм: {slug}\n"
                        f"- Временная сложность (Time Complexity): {info['time_complexity']}\n"
                        f"- Пространственная сложность (Space Complexity): {info['space_complexity']}\n"
                        f"- Описание: {info['description']}"
                    )
                    write_output({
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {
                            "content": [
                                {
                                    "type": "text",
                                    "text": response_text
                                }
                            ],
                            "isError": False
                        }
                    })
            else:
                write_output({
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {
                        "code": -32601,
                        "message": f"Метод/Инструмент '{tool_name}' не поддерживается."
                    }
                })
        else:
            # Ответ по умолчанию на неизвестные jsonrpc-методы
            write_output({
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {}
            })

if __name__ == "__main__":
    main()
