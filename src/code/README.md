# Code Language Utilities

Этот модуль содержит всю логику по работе с языками программирования, анализом кода и проверкой ограничений.

## Структура

- **`argumentParser.ts`** - Парсинг аргументов из строкового формата
  - `parseArguments` - Парсит массив аргументов из строки
  - `formatArgumentsForCode` - Форматирует аргументы для вставки в код

- **`argumentFormatter.ts`** - Форматирование аргументов для разных языков
  - `formatArgsForDynamicLang` - Форматирует для JavaScript/Python/Go
  - `formatArgsForJavaOrCSharp` - Форматирует для Java/C#
  - `getDisplayInput` - Получает отображаемое значение аргументов

- **`objectGenerator.ts`** - Генерация классов объектов для Java/C#
  - `getCSharpType` - Маппинг типов для C#
  - `getJavaType` - Маппинг типов для Java
  - `generateObjectClasses` - Генерирует классы объектов
  - `generateObjectClassesForPreview` - Генерирует классы для превью
  - `getArgumentTypeDescription` - Описание типа аргумента
  - `renderArgumentScheme` - Отображает схему аргументов

- **`functionExtractor.ts`** - Извлечение информации о функциях
  - `stripMainMethod` - Удаляет main метод из кода
  - `addJavaMainMethod` - Добавляет main метод для Java
  - `extractFunctionName` - Извлекает имя функции из кода

- **`testCodeBuilder.ts`** - Сборка тестового кода
  - `buildJavaTestSuite` - Создает тест-сьют для Java
  - `buildCSharpTestSuite` - Создает тест-сьют для C#
  - `buildTestCode` - Создает тестовый код для любого языка

- **`outputComparer.ts`** - Сравнение выводов
  - `compareOutputs` - Сравнивает фактический и ожидаемый вывод

- **`codeAnalyzer.ts`** - Анализ кода
  - `countCodeLines` - Считает строки кода
  - `hasComments` - Проверяет наличие комментариев
  - `hasConsoleLog` - Проверяет наличие console.log/print
  - `hasRequiredKeywords` - Проверяет наличие обязательных ключевых слов
  - `calculateComplexity` - Вычисляет цикломатическую сложность

- **`constraintChecker.ts`** - Проверка ограничений кода
  - `checkConstraints` - Проверяет все ограничения кода

## Использование

```typescript
// Импорт всех функций
import {
  parseArguments,
  formatArgumentsForCode,
  formatArgsForDynamicLang,
  formatArgsForJavaOrCSharp,
  getDisplayInput,
  generateObjectClasses,
  generateObjectClassesForPreview,
  getArgumentTypeDescription,
  renderArgumentScheme,
  stripMainMethod,
  addJavaMainMethod,
  extractFunctionName,
  buildJavaTestSuite,
  buildCSharpTestSuite,
  buildTestCode,
  compareOutputs,
  checkConstraints
} from "@/code";

// Или импорт отдельных модулей
import { parseArguments, formatArgumentsForCode } from "@/code/argumentParser";
import { checkConstraints } from "@/code/constraintChecker";
```

## Поддерживаемые языки

- JavaScript
- Python
- Java
- C#
- Go (Golang)
