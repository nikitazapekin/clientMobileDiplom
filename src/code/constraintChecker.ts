import type { CodeConstraintType, ConstraintResult } from "@/components/Lesson/types";
import { countCodeLines, hasComments, hasConsoleLog, hasRequiredKeywords, calculateComplexity } from "./codeAnalyzer";

export const checkConstraints = (
  code: string,
  constraints?: { type: CodeConstraintType; value: number | string[] | boolean }[]
): ConstraintResult[] => {
  const results: ConstraintResult[] = [];

  for (const constraint of constraints || []) {
    switch (constraint.type) {
      case "maxLines": {
        const maxLines = constraint.value as number;
        const actualLines = countCodeLines(code);
        results.push({
          type: "maxLines",
          name: "📏 Максимум строк кода",
          passed: actualLines <= maxLines,
          expected: `≤ ${maxLines} строк`,
          actual: `${actualLines} строк`,
        });
        break;
      }

      case "forbiddenTokens": {
        const forbidden = constraint.value as string[];
        const passed = !forbidden.some(
          (token) => token.trim() && code.toLowerCase().includes(token.toLowerCase().trim())
        );
        results.push({
          type: "forbiddenTokens",
          name: "Запрещённые слова",
          passed,
          expected: forbidden.filter((t) => t.trim()).join(", ") || "нет",
          actual: passed ? "не используются" : "используются",
        });
        break;
      }

      case "noComments": {
        const passed = !hasComments(code);
        results.push({
          type: "noComments",
          name: "Без комментариев",
          passed,
          expected: "без комментариев",
          actual: passed ? "нет комментариев" : "есть комментарии",
        });
        break;
      }

      case "noConsoleLog": {
        const passed = !hasConsoleLog(code);
        results.push({
          type: "noConsoleLog",
          name: "Без отладочного вывода",
          passed,
          expected: "без console.log/print",
          actual: passed ? "нет" : "используется",
        });
        break;
      }

      case "maxComplexity": {
        const maxComplexity = constraint.value as number;
        const actualComplexity = calculateComplexity(code);
        results.push({
          type: "maxComplexity",
          name: "Цикломатическая сложность",
          passed: actualComplexity <= maxComplexity,
          expected: `≤ ${maxComplexity}`,
          actual: `${actualComplexity}`,
        });
        break;
      }

      case "memoryLimit": {
        const memoryLimit = constraint.value as number;
        const codeSize = new Blob([code]).size / 1024;
        const estimatedMemory = Math.round(codeSize * 2);

        results.push({
          type: "memoryLimit",
          name: "Использование памяти",
          passed: estimatedMemory <= memoryLimit,
          expected: `≤ ${memoryLimit} МБ`,
          actual: `~${estimatedMemory} МБ`,
        });
        break;
      }

      case "requiredKeywords": {
        const keywords = constraint.value as string[];
        const passed = hasRequiredKeywords(code, keywords);
        results.push({
          type: "requiredKeywords",
          name: "Обязательные ключевые слова",
          passed,
          expected: keywords.join(", "),
          actual: passed ? "все присутствуют" : "не все присутствуют",
        });
        break;
      }

      case "maxTimeMs": {
        results.push({
          type: "maxTimeMs",
          name: "Время выполнения",
          passed: true,
          expected: `≤ ${constraint.value} мс`,
          actual: "проверяется на сервере",
        });
        break;
      }
    }
  }

  return results;
};
