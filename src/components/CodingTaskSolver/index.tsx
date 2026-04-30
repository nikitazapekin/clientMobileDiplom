import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, SIZES } from "appStyles";

import {
  buildCSharpTestSuite,
  buildJavaTestSuite,
  buildTestCode,
  extractFunctionName,
  formatArgsForDynamicLang,
  formatArgsForGolang,
  formatArgsForJavaOrCSharp,
  formatArgsForRust,
  generateObjectClasses,
  getDisplayInput,
} from "@/code";
import CodeEditor from "@/components/CodeEditor";
import type { ArgumentSchema, TestCaseArgument } from "@/components/Lesson/types";
import { type CodeLanguage,CodeService } from "@/http/codeService";
import {
  CodeWithTimeService,
  type ExecuteCodeWithTimeResponse,
} from "@/http/codeWithTimeService";
import {
  type CodeTask,
  CodingTasksService,
  type SubmitSolutionResult,
  type TaskStatistics,
} from "@/http/codingTasksService";

interface Props {
  id: string;
}

const getConstraintDisplay = (constraint: { type: string; value: any }): string => {
  const typeMap: Record<string, string> = {
    maxTimeMs: "Время",
    maxLines: "Макс. строк",
    forbiddenTokens: "Запрещено",
    noComments: "Без комментариев",
    noConsoleLog: "Без console.log",
    maxComplexity: "Макс. сложность",
    memoryLimit: "Память",
    requiredKeywords: "Обязательно",
  };

  const typeLabel = typeMap[constraint.type] || constraint.type;

  switch (constraint.type) {
    case "maxTimeMs":
      return `${typeLabel}: ${constraint.value}мс`;

    case "maxLines":
      return `${typeLabel}: ${constraint.value}`;

    case "forbiddenTokens":
      return `${typeLabel}: ${(constraint.value as string[]).join(", ")}`;

    case "noComments":
      return typeLabel;

    case "noConsoleLog":
      return typeLabel;

    case "maxComplexity":
      return `${typeLabel}: ${constraint.value}`;

    case "memoryLimit":
      return `${typeLabel}: ${constraint.value} МБ`;

    case "requiredKeywords":
      return `${typeLabel}: ${(constraint.value as string[]).join(", ")}`;

    default:
      return `${typeLabel}: ${constraint.value}`;
  }
};

const DIFF_COLORS: Record<string, string> = {
  easy: "#4caf50",
  medium: "#ff9800",
  hard: "#f44336",
};

const DIFF_LABELS: Record<string, string> = {
  easy: "Легкий",
  medium: "Средний",
  hard: "Сложный",
};

const LANG_LABELS: Record<string, string> = {
  javascript: "JS",
  typescript: "TS",
  python: "Python",
  php: "PHP",
  ruby: "Ruby",
  rust: "Rust",
  csharp: "C#",
  java: "Java",
  golang: "Go",
  cpp: "C++",
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const countCodeLines = (code: string): number =>
  code
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 &&
        !line.startsWith("//") &&
        !line.startsWith("/*") &&
        !line.startsWith("*") &&
        !line.startsWith("#")
    ).length;

const hasComments = (code: string, language: CodeLanguage): boolean => {
  if (language === "python" || language === "ruby") {
    return /#.*/.test(code);
  }

  if (language === "php") {
    return /#.*/.test(code) || /\/\/.*|\/\*[\s\S]*?\*\//.test(code);
  }

  return /\/\/.*|\/\*[\s\S]*?\*\//.test(code);
};

const hasConsoleUsage = (code: string, language: CodeLanguage): boolean => {
  if (language === "javascript" || language === "typescript") {
    return /\bconsole\.(log|error|warn|info)\s*\(/.test(code);
  }

  if (language === "python") {
    return /\bprint\s*\(/.test(code);
  }

  if (language === "php") {
    return /\b(?:echo|print|print_r|var_dump)\b/.test(code);
  }

  if (language === "ruby") {
    return /\b(?:puts|print|p)\b/.test(code);
  }

  if (language === "rust") {
    return /\b(?:println!|print!|eprintln!|eprint!)\s*\(/.test(code);
  }

  if (language === "golang") {
    return /\bfmt\.Print(?:ln|f)?\s*\(/.test(code);
  }

  if (language === "java") {
    return /\bSystem\.out\.(print|println)\s*\(/.test(code);
  }

  if (language === "csharp") {
    return /\bConsole\.(WriteLine|Write)\s*\(/.test(code);
  }

  if (language === "cpp") {
    return /\bcout\s*<</.test(code);
  }

  return false;
};

const TIMED_EXECUTION_LANGUAGES: CodeLanguage[] = ["javascript", "python", "csharp", "java"];

const calculateComplexity = (code: string): number => {
  let complexity = 1;
  const complexityKeywords = [
    "if ",
    "else if",
    "else",
    "for ",
    "while ",
    "do ",
    "case ",
    "catch ",
    "||",
    "&&",
    "? :",
    "??",
    "switch",
    "?",
  ];

  complexityKeywords.forEach((keyword) => {
    const regex = new RegExp(keyword, "g");
    const matches = code.match(regex);

    if (matches) {
      complexity += matches.length;
    }
  });

  return complexity;
};

const hasRequiredKeywords = (code: string, keywords: string[]): boolean =>
  keywords.every(
    (keyword) => keyword.trim() && code.toLowerCase().includes(keyword.toLowerCase().trim())
  );

type ConstraintCheckResult = {
  passed: boolean;
  errors: string[];
};

const evaluateCodeConstraints = (
  code: string,
  language: CodeLanguage,
  constraints: CodeTask["constraints"] = [],
  executionTimeMs?: number
): ConstraintCheckResult => {
  const errors: string[] = [];

  for (const constraint of constraints) {
    switch (constraint.type) {
      case "maxLines": {
        const maxLines = constraint.value as number;
        const actualLines = countCodeLines(code);

        if (actualLines > maxLines) {
          errors.push(`Превышено максимальное количество строк: ${actualLines} > ${maxLines}`);
        }

        break;
      }

      case "forbiddenTokens": {
        const tokens = constraint.value as string[];

        tokens.forEach((token) => {
          const regex = new RegExp(`\\b${escapeRegExp(token)}\\b`, "g");

          if (regex.test(code)) {
            errors.push(`Использование запрещенного токена: "${token}"`);
          }
        });
        break;
      }

      case "noComments": {
        if (constraint.value === true && hasComments(code, language)) {
          errors.push("Использование комментариев запрещено");
        }

        break;
      }

      case "noConsoleLog": {
        if (constraint.value === true && hasConsoleUsage(code, language)) {
          if (language === "javascript" || language === "typescript") {
            errors.push("Использование console.log запрещено");
          } else if (language === "python") {
            errors.push("Использование print запрещено");
          } else {
            errors.push("Вывод в консоль запрещен");
          }
        }

        break;
      }

      case "requiredKeywords": {
        const keywords = constraint.value as string[];

        if (!hasRequiredKeywords(code, keywords)) {
          errors.push(`Отсутствуют обязательные ключевые слова: ${keywords.join(", ")}`);
        }

        break;
      }

      case "maxTimeMs": {
        if (
          typeof executionTimeMs === "number" &&
          executionTimeMs > (constraint.value as number)
        ) {
          errors.push(
            `Превышено допустимое время выполнения: ${executionTimeMs}мс > ${constraint.value}мс`
          );
        }

        break;
      }

      case "maxComplexity": {
        const maxComplexity = constraint.value as number;

        if (calculateComplexity(code) > maxComplexity) {
          errors.push("Превышена допустимая сложность кода");
        }

        break;
      }

      default:
        break;
    }
  }

  return { passed: errors.length === 0, errors };
};

const parseExecutionMarkers = (output: string) => {
  const lines = output.split(/\r?\n/);
  const logs: string[] = [];
  const results: string[] = [];
  let inLogs = false;
  let inResult = false;
  let currentLogs: string[] = [];
  let currentResult: string[] = [];

  const pushLogs = () => {
    if (currentLogs.length) {
      logs.push(currentLogs.join("\n"));
      currentLogs = [];
    }
  };

  const pushResult = () => {
    if (currentResult.length) {
      results.push(currentResult.join("\n").trim());
      currentResult = [];
    }
  };

  for (const line of lines) {
    if (line.includes("===LOGS_START")) {
      inLogs = true;
      currentLogs = [];
      continue;
    }

    if (line.includes("===LOGS_END")) {
      inLogs = false;
      pushLogs();
      continue;
    }

    if (line.includes("===RESULT_START")) {
      inResult = true;
      currentResult = [];
      continue;
    }

    if (line.includes("===RESULT_END")) {
      inResult = false;
      pushResult();
      continue;
    }

    if (inLogs) {
      currentLogs.push(line);
    } else if (inResult) {
      currentResult.push(line);
    }
  }

  pushLogs();
  pushResult();

  return { logs, results, hasMarkers: logs.length > 0 || results.length > 0 };
};

const formatExecutionResponse = (response: ExecuteCodeWithTimeResponse): string => {
  const parts: string[] = [];

  if (response.error) {
    parts.push(`Ошибка: ${response.error}`);
  }

  const output = response.output ?? "";
  const parsed = parseExecutionMarkers(output);

  if (parsed.hasMarkers) {
    if (parsed.logs.length) {
      parts.push(
        parsed.logs
          .map((log, idx) => `Логи ${idx + 1}:\n${log}`)
          .join("\n\n")
      );
    }

    if (parsed.results.length) {
      parts.push(
        parsed.results
          .map((result, idx) => `Результат ${idx + 1}:\n${result}`)
          .join("\n\n")
      );
    }
  } else if (output.trim()) {
    parts.push(output.trim());
  } else if (!response.error) {
    parts.push("Нет вывода");
  }

  parts.push(`Время выполнения: ${response.executionTimeMs}мс`);

  return parts.filter(Boolean).join("\n\n");
};

const formatBasicExecutionResponse = (response: { output?: string; error?: string }): string => {
  const parts: string[] = [];

  if (response.error) {
    parts.push(`Ошибка: ${response.error}`);
  }

  const output = response.output ?? "";
  const parsed = parseExecutionMarkers(output);

  if (parsed.hasMarkers) {
    if (parsed.logs.length) {
      parts.push(
        parsed.logs
          .map((log, idx) => `Логи ${idx + 1}:\n${log}`)
          .join("\n\n")
      );
    }

    if (parsed.results.length) {
      parts.push(
        parsed.results
          .map((result, idx) => `Результат ${idx + 1}:\n${result}`)
          .join("\n\n")
      );
    }
  } else if (output.trim()) {
    parts.push(output.trim());
  } else if (!response.error) {
    parts.push("Нет вывода");
  }

  return parts.filter(Boolean).join("\n\n");
};

type TaskTestCase = CodeTask["testCases"][number] & {
  args?: TestCaseArgument[];
};

type CodeTaskWithMetadata = CodeTask & {
  testCasesByLanguage?: Record<string, TaskTestCase[]>;
  argumentScheme?: ArgumentSchema[];
};

const getTaskTestCases = (task: CodeTaskWithMetadata, language: CodeLanguage): TaskTestCase[] =>
  task.testCasesByLanguage?.[language] || (task.testCases as TaskTestCase[]) || [];

const parseTestOutput = (
  output: string,
  testNum: number
): { logs: string[]; result: string } => {
  if (!output) return { logs: [], result: "" };

  const lines = output.split(/\r?\n/);
  let inLogs = false;
  let inResult = false;
  const logs: string[] = [];
  const result: string[] = [];

  for (const line of lines) {
    if (line.includes(`===LOGS_START_${testNum}===`) || line.includes("===LOGS_START===")) {
      inLogs = true;
      continue;
    }

    if (line.includes(`===LOGS_END_${testNum}===`) || line.includes("===LOGS_END===")) {
      inLogs = false;
      continue;
    }

    if (line.includes(`===RESULT_START_${testNum}===`) || line.includes("===RESULT_START===")) {
      inResult = true;
      continue;
    }

    if (line.includes(`===RESULT_END_${testNum}===`) || line.includes("===RESULT_END===")) {
      inResult = false;
      continue;
    }

    if (inLogs) {
      logs.push(line);
    }

    if (inResult) {
      result.push(line);
    }
  }

  return { logs, result: result.join("\n").trim() };
};

const formatTestLogs = (
  testCase: TaskTestCase,
  testIndex: number,
  language: CodeLanguage,
  argumentScheme?: ArgumentSchema[]
): string => {
  const input = getDisplayInput(testCase, argumentScheme, language);

  return `Логи теста #${testIndex + 1} (вход: ${input}):`;
};

const collectCheckLogs = async (
  task: CodeTaskWithMetadata,
  userCode: string,
  language: CodeLanguage
): Promise<string> => {
  const testCases = getTaskTestCases(task, language);

  if (testCases.length === 0) {
    return "";
  }

  const funcName = extractFunctionName(userCode, language);

  if (!funcName) {
    return "";
  }

  const parts: string[] = [];
  const argumentScheme = task.argumentScheme;

  if (language === "java" || language === "csharp") {
    const formattedTestCases = testCases.map((testCase) => ({
      input:
        testCase.args && argumentScheme && argumentScheme.length > 0
          ? formatArgsForJavaOrCSharp(testCase.args, argumentScheme, language)
          : testCase.input || "",
      expectedOutput: testCase.expectedOutput,
    }));

    const codeWithTests =
      language === "java"
        ? buildJavaTestSuite(userCode, formattedTestCases, funcName)
        : buildCSharpTestSuite(userCode, formattedTestCases, funcName);

    const objectClasses =
      argumentScheme && argumentScheme.length > 0
        ? generateObjectClasses(argumentScheme, language)
        : "";

    const res = await CodeService.executeCode({
      language,
      code: objectClasses ? `${codeWithTests}\n\n${objectClasses}` : codeWithTests,
    });

    if (res.error || !res.output) {
      return "";
    }

    testCases.forEach((testCase, index) => {
      const { logs } = parseTestOutput(res.output, index + 1);

      if (logs.length === 0) {
        return;
      }

      parts.push(formatTestLogs(testCase, index, language, argumentScheme));
      parts.push(logs.join("\n"));
    });

    return parts.join("\n\n");
  }

  for (let index = 0; index < testCases.length; index += 1) {
    const testCase = testCases[index];
    let preformattedArgs: string | undefined;

    if (testCase.args && argumentScheme && argumentScheme.length > 0) {
      if (language === "golang") {
        preformattedArgs = formatArgsForGolang(testCase.args, argumentScheme);
      } else if (language === "rust") {
        preformattedArgs = formatArgsForRust(testCase.args, argumentScheme);
      } else {
        preformattedArgs = formatArgsForDynamicLang(testCase.args, argumentScheme, language);
      }
    }

    const inputToUse = preformattedArgs ?? testCase.input ?? "";
    const objectClasses =
      language === "typescript" && argumentScheme && argumentScheme.length > 0
        ? generateObjectClasses(argumentScheme, "typescript")
        : "";
    const codeToRun = buildTestCode(
      language === "typescript" && objectClasses ? `${objectClasses}\n\n${userCode}` : userCode,
      inputToUse,
      language,
      funcName,
      preformattedArgs
    );

    const res = await CodeService.executeCode({
      language,
      code: codeToRun,
    });

    if (res.error || !res.output) {
      continue;
    }

    const { logs } = parseTestOutput(res.output, index + 1);

    if (logs.length === 0) {
      continue;
    }

    parts.push(formatTestLogs(testCase, index, language, argumentScheme));
    parts.push(logs.join("\n"));
  }

  return parts.join("\n\n");
};

const CodingTaskSolver = ({ id }: Props) => {
  const navigation = useNavigation();
  const [task, setTask] = useState<CodeTask | null>(null);
  const [selectedLang, setSelectedLang] = useState<CodeLanguage>("javascript");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [runLoading, setRunLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState("");
  const [constraintErrors, setConstraintErrors] = useState<string[]>([]);
  const [result, setResult] = useState<SubmitSolutionResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [statistics, setStatistics] = useState<TaskStatistics | null>(null);
  const [showStatistics, setShowStatistics] = useState(false);
  const [userRank, setUserRank] = useState<{ rank: number; executionTimeMs: number; totalParticipants: number } | null>(null);
  const [hasSolvedTask, setHasSolvedTask] = useState(false);

  const loadSolvedStatus = useCallback(async () => {
    try {
      const userSolutions = await CodingTasksService.getUserSolutions();

      setHasSolvedTask(
        userSolutions.some((solution) => solution.taskId === id && solution.allPassed),
      );
    } catch (error) {
      console.error("Failed to load solved task status:", error);
      setHasSolvedTask(false);
    }
  }, [id]);

  const loadTask = useCallback(async () => {
    try {
      const data = await CodingTasksService.getTask(id);

      setTask(data);
      const firstLang = (data.languages?.[0] || "javascript") as CodeLanguage;

      setSelectedLang(firstLang);
      setCode(data.startCodes?.[firstLang] || "");
    } catch (e) {
      console.error("Failed to load task:", e);
      Alert.alert("Ошибка", "Не удалось загрузить задачу");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setHasSolvedTask(false);
    void loadTask();
    void loadSolvedStatus();
  }, [loadSolvedStatus, loadTask]);

  const handleLangChange = (lang: CodeLanguage) => {
    setSelectedLang(lang);
    setCode(task?.startCodes?.[lang] || "");
    setConsoleOutput("");
    setResult(null);
  };

  const handleRun = async () => {
    if (!task) return;

    setRunLoading(true);
    setConsoleOutput("");
    try {
      if (TIMED_EXECUTION_LANGUAGES.includes(selectedLang)) {
        const res = await CodeWithTimeService.executeCodeWithTime({
          language: selectedLang as "javascript" | "python" | "csharp" | "java",
          code,
        });

        setConsoleOutput(formatExecutionResponse(res));
      } else {
        const res = await CodeService.executeCode({ language: selectedLang, code });

        setConsoleOutput(formatBasicExecutionResponse(res));
      }
    } catch (error: any) {
      setConsoleOutput(`Ошибка выполнения: ${error?.message || "Не удалось выполнить код"}`);
    } finally {
      setRunLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!task) return;

    const taskWithMetadata = task as CodeTaskWithMetadata;

    setSubmitLoading(true);
    setResult(null);
    setUserRank(null);
    setConstraintErrors([]);
    setConsoleOutput("");

    void collectCheckLogs(taskWithMetadata, code, selectedLang)
      .then((logs) => {
        if (logs) {
          setConsoleOutput(logs);
        }
      })
      .catch((error) => {
        console.error("Failed to collect check logs:", error);
      });

    try {
      const res = await CodingTasksService.submitSolution(task.id, code, selectedLang);
      const { errors } = evaluateCodeConstraints(code, selectedLang, task.constraints, res.executionTimeMs);
      const combinedConstraintErrors = [...(res.constraintErrors || []), ...errors];
      const constraintsPassed = combinedConstraintErrors.length === 0;
      const finalAllPassed = res.allPassed && constraintsPassed;

      const enrichedResult: SubmitSolutionResult = {
        ...res,
        allPassed: finalAllPassed,
        constraintsPassed,
        constraintErrors: combinedConstraintErrors,
      };

      setResult(enrichedResult);
      setConstraintErrors(combinedConstraintErrors);

      if (finalAllPassed) {
        setHasSolvedTask(true);

        try {
          const [stats, rank] = await Promise.all([
            CodingTasksService.getTaskStatistics(task.id),
            CodingTasksService.getUserRank(task.id, selectedLang),
          ]);

          setStatistics(stats);
          setUserRank(rank);
        } catch (e) {
          console.error("Failed to fetch statistics:", e);
        }
      }

      setShowResult(true);
    } catch (e: any) {
      Alert.alert("Ошибка", e?.message || "Не удалось отправить решение");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading || !task) {
    return (
      <View style={st.center}>
        <ActivityIndicator size="large" color={COLORS.ACCENT} />
      </View>
    );
  }

  const diffColor = DIFF_COLORS[task.difficulty] || DIFF_COLORS.easy;
  const diffLabel = DIFF_LABELS[task.difficulty] || task.difficulty;
  const passedCount = result?.results?.filter((r) => r.passed).length ?? 0;
  const totalCount = result?.results?.length ?? 0;
  const taskWithMetadata = task as CodeTaskWithMetadata;
  const visibleTestCases = getTaskTestCases(taskWithMetadata, selectedLang).slice(0, 3);
  const hiddenTestCasesCount = Math.max(
    0,
    getTaskTestCases(taskWithMetadata, selectedLang).length - visibleTestCases.length
  );
  const visibleResults = (result?.results || []).slice(0, 3);
  const hiddenResultsCount = Math.max(0, totalCount - visibleResults.length);

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>
      <View style={st.taskHeader}>
        <Text style={st.taskTitle}>{task.title}</Text>
        <View style={st.metaRow}>
          <View style={[st.badge, { backgroundColor: diffColor }]}>
            <Text style={st.badgeText}>{diffLabel}</Text>
          </View>
          <View style={st.xpBadge}>
            <Text style={st.xpBadgeText}>+{task.experienceReward} XP</Text>
          </View>
        </View>
        {(task.tags || []).length > 0 && (
          <View style={st.taskTags}>
            {(task.tags || []).map((tag) => (
              <View key={tag} style={st.taskTag}>
                <Text style={st.taskTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={st.descriptionCard}>
        <Text style={st.descTitle}>Описание</Text>
        <Text style={st.descText}>{task.description}</Text>
      </View>

      {visibleTestCases.length > 0 && (
        <View style={st.examplesCard}>
          <Text style={st.examplesTitle}>Примеры тест-кейсов</Text>
          {visibleTestCases.map((testCase, index) => (
            <View key={`${index}-${testCase.input}`} style={st.exampleItem}>
              <Text style={st.exampleLabel}>
                Тест #{index + 1}
              </Text>
              <Text style={st.exampleText}>
                Вход: {getDisplayInput(testCase, taskWithMetadata.argumentScheme, selectedLang)}
              </Text>
              <Text style={st.exampleText}>Выход: {String(testCase.expectedOutput)}</Text>
            </View>
          ))}
          {hiddenTestCasesCount > 0 && (
            <Text style={st.hiddenExamplesText}>
              Ещё {hiddenTestCasesCount} тестов скрыто
            </Text>
          )}
        </View>
      )}

      {task.constraints && task.constraints.length > 0 && (
        <View style={st.constraintsCard}>
          <Text style={st.constraintsTitle}>Ограничения</Text>
          {task.constraints.map((c, i) => (
            <Text key={i} style={st.constraintItem}>
              {getConstraintDisplay(c)}
            </Text>
          ))}
        </View>
      )}

      <View style={st.langSection}>
        <Text style={st.langSectionLabel}>Язык решения</Text>
        <View style={st.langRow}>
          {(task.languages || []).map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[st.langBtn, selectedLang === lang && st.langBtnActive]}
              onPress={() => handleLangChange(lang as CodeLanguage)}
            >
              <Text style={[st.langBtnText, selectedLang === lang && st.langBtnTextActive]}>
                {LANG_LABELS[lang] || lang}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={st.editorSection}>
        <Text style={st.editorLabel}>Ваше решение</Text>
        <View style={st.editorWrap}>
          <CodeEditor
            key={selectedLang}
            value={code}
            onChange={setCode}
            language={selectedLang}
            height={300}
            onRun={handleRun}
            runLoading={runLoading}
          />
        </View>
      </View>

      <View style={st.actions}>
        <TouchableOpacity
          style={[st.actionBtn, st.submitBtn]}
          onPress={handleSubmit}
          disabled={submitLoading}
        >
          {submitLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={st.actionBtnText}>Проверить решение</Text>
          )}
        </TouchableOpacity>
      </View>

      {consoleOutput !== "" && (
        <View style={st.consoleCard}>
          <Text style={st.consoleTitle}>Консоль</Text>
          <Text style={st.consoleText}>{consoleOutput}</Text>
        </View>
      )}

      {constraintErrors.length > 0 && (
        <View style={st.constraintErrorsCard}>
          <Text style={st.constraintErrorsTitle}>Ограничения</Text>
          {constraintErrors.map((error, index) => (
            <Text key={`${error}-${index}`} style={st.constraintErrorText}>
              {error}
            </Text>
          ))}
        </View>
      )}

      {hasSolvedTask && (
        <TouchableOpacity
          style={st.solutionsBtn}
          onPress={() =>
            navigation.navigate("Solutions" as never, {
              taskId: task.id,
              taskTitle: task.title,
            } as never)
          }
        >
          <Text style={st.solutionsBtnText}>Посмотреть решения других студентов</Text>
        </TouchableOpacity>
      )}

      {result && !showResult && (
        <TouchableOpacity onPress={() => setShowResult(true)}>
          <Text style={st.showResultLink}>Показать результаты</Text>
        </TouchableOpacity>
      )}

      <Modal visible={showResult} transparent animationType="slide">
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>
                {result?.allPassed ? "Все тесты пройдены!" : "Есть ошибки"}
              </Text>
              <TouchableOpacity onPress={() => setShowResult(false)}>
                <Text style={st.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {result && (
              <>
                <View style={st.summary}>
                  <View style={st.summaryItem}>
                    <Text style={st.summaryLabel}>Пройдено</Text>
                    <Text
                      style={[
                        st.summaryValue,
                        { color: result.allPassed ? "#4caf50" : "#f44336" },
                      ]}
                    >
                      {passedCount}/{totalCount}
                    </Text>
                  </View>
                  {result.experienceGained > 0 && (
                    <View style={st.summaryItem}>
                      <Text style={st.summaryLabel}>Получено XP</Text>
                      <Text style={[st.summaryValue, { color: COLORS.ACCENT }]}>
                        +{result.experienceGained}
                      </Text>
                    </View>
                  )}
                  <View style={st.summaryItem}>
                    <Text style={st.summaryLabel}>Уровень</Text>
                    <Text style={st.summaryValue}>{result.newLevel}</Text>
                  </View>
                  <View style={st.summaryItem}>
                    <Text style={st.summaryLabel}>Время</Text>
                    <Text style={st.summaryValue}>{result.executionTimeMs}мс</Text>
                  </View>
                </View>

                {result.constraintErrors && result.constraintErrors.length > 0 && (
                  <>
                    {!result.constraintsPassed && (
                      <Text style={st.constraintFailLabel}>
                        Ограничения нарушены — задача не засчитывается
                      </Text>
                    )}
                    <View style={st.resultConstraintCard}>
                      <Text style={st.constraintErrorsTitle}>Ограничения</Text>
                      {result.constraintErrors.map((error, index) => (
                        <Text key={`${error}-${index}`} style={st.constraintErrorText}>
                          {error}
                        </Text>
                      ))}
                    </View>
                  </>
                )}

                {userRank && userRank.totalParticipants > 0 && (
                  <View style={st.rankSection}>
                    <Text style={st.rankTitle}>🏆 Ваш рейтинг по скорости</Text>
                    <View style={st.rankInfo}>
                      <Text style={st.rankText}>
                        Место: <Text style={st.rankValue}>{userRank.rank}</Text> из{" "}
                        {userRank.totalParticipants}
                      </Text>
                      <Text style={st.rankText}>
                        Время: <Text style={st.rankValue}>{userRank.executionTimeMs}мс</Text>
                      </Text>
                    </View>
                  </View>
                )}

                {statistics && statistics.passedSolutions > 0 && (
                  <TouchableOpacity
                    style={st.statisticsBtn}
                    onPress={() => setShowStatistics(true)}
                  >
                    <Text style={st.statisticsBtnText}>Статистика решений</Text>
                  </TouchableOpacity>
                )}

                <ScrollView style={st.resultsList}>
                  {visibleResults.map((r) => (
                    <View
                      key={r.index}
                      style={[
                        st.resultItem,
                        { borderLeftColor: r.passed ? "#4caf50" : "#f44336" },
                      ]}
                    >
                      <View style={st.resultHeader}>
                        <Text style={st.resultIndex}>Тест #{r.index + 1}</Text>
                        <Text style={[st.resultStatus, { color: r.passed ? "#4caf50" : "#f44336" }]}>
                          {r.passed ? "Пройден" : "Провален"}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
                {hiddenResultsCount > 0 && (
                  <Text style={st.hiddenExamplesText}>
                    Ещё {hiddenResultsCount} тестов скрыто
                  </Text>
                )}
              </>
            )}

            <TouchableOpacity
              style={st.modalCloseBtn}
              onPress={() => setShowResult(false)}
            >
              <Text style={st.modalCloseBtnText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showStatistics} transparent animationType="slide">
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}> Статистика решений</Text>
              <TouchableOpacity onPress={() => setShowStatistics(false)}>
                <Text style={st.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {statistics && (
              <ScrollView>
                <View style={st.statSection}>
                  <Text style={st.statSectionTitle}>Общая статистика</Text>
                  <View style={st.statRow}>
                    <Text style={st.statLabel}>Всего решений:</Text>
                    <Text style={st.statValue}>{statistics.totalSolutions}</Text>
                  </View>
                  <View style={st.statRow}>
                    <Text style={st.statLabel}>Успешных:</Text>
                    <Text style={[st.statValue, { color: "#4caf50" }]}>
                      {statistics.passedSolutions}
                    </Text>
                  </View>
                  <View style={st.statRow}>
                    <Text style={st.statLabel}>Среднее время:</Text>
                    <Text style={st.statValue}>{Math.round(statistics.averageExecutionTimeMs)}мс</Text>
                  </View>
                  <View style={st.statRow}>
                    <Text style={st.statLabel}>Быстрее всего:</Text>
                    <Text style={[st.statValue, { color: "#4caf50" }]}>
                      {statistics.fastestExecutionTimeMs}мс
                    </Text>
                  </View>
                  <View style={st.statRow}>
                    <Text style={st.statLabel}>Медленнее всего:</Text>
                    <Text style={[st.statValue, { color: "#f44336" }]}>
                      {statistics.slowestExecutionTimeMs}мс
                    </Text>
                  </View>
                </View>

                {statistics.languageStats && statistics.languageStats.length > 0 && (
                  <View style={st.statSection}>
                    <Text style={st.statSectionTitle}>По языкам программирования</Text>
                    {statistics.languageStats.map((stat) => (
                      <View key={stat.language} style={st.langStatCard}>
                        <View style={st.langStatHeader}>
                          <Text style={st.langStatLabel}>{stat.language.toUpperCase()}</Text>
                          <Text style={st.langStatCount}>{stat.count} решений</Text>
                        </View>
                        <Text style={st.langStatTime}>
                          Среднее время: {Math.round(stat.avgExecutionTimeMs)}мс
                        </Text>

                        {/* Гистограмма распределения времени */}
                        {stat.executionTimeDistribution && stat.executionTimeDistribution.length > 0 && (
                          <View style={st.histogramContainer}>
                            <Text style={st.histogramTitle}>Распределение времени:</Text>
                            <View style={st.histogramBars}>
                              {stat.executionTimeDistribution.map((dist, idx) => {
                                const maxCount = Math.max(...stat.executionTimeDistribution.map(d => d.count));
                                const barWidth = (dist.count / maxCount) * 100;
                                const barColor = idx === 0 ? '#4caf50' :
                                  idx < stat.executionTimeDistribution.length / 2 ? '#ff9800' : '#f44336';

                                return (
                                  <View key={idx} style={st.histogramBar}>
                                    <Text style={st.histogramBarLabel}>{dist.timeRange}</Text>
                                    <View style={st.histogramBarTrack}>
                                      <View
                                        style={[
                                          st.histogramBarFill,
                                          {
                                            width: `${Math.max(5, barWidth)}%`,
                                            backgroundColor: barColor,
                                          },
                                        ]}
                                      />
                                      <Text style={st.histogramBarCount}>{dist.count}</Text>
                                    </View>
                                  </View>
                                );
                              })}
                            </View>
                            <View style={st.histogramLegend}>
                              <View style={st.legendItem}>
                                <View style={[st.legendDot, { backgroundColor: '#4caf50' }]} />
                                <Text style={st.legendText}>Быстрые</Text>
                              </View>
                              <View style={st.legendItem}>
                                <View style={[st.legendDot, { backgroundColor: '#ff9800' }]} />
                                <Text style={st.legendText}>Средние</Text>
                              </View>
                              <View style={st.legendItem}>
                                <View style={[st.legendDot, { backgroundColor: '#f44336' }]} />
                                <Text style={st.legendText}>Медленные</Text>
                              </View>
                            </View>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={st.modalCloseBtn}
              onPress={() => setShowStatistics(false)}
            >
              <Text style={st.modalCloseBtnText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.GRAY_50 },
  content: { padding: SIZES.SPACING_MD, paddingBottom: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  taskHeader: { marginBottom: SIZES.SPACING_MD },
  taskTitle: { fontSize: 22, fontWeight: "700", color: COLORS.GRAY_900, marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  taskTags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  taskTag: {
    backgroundColor: "#FFF6DA",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  taskTagText: { color: "#836400", fontSize: 11, fontWeight: "600" },
  badge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 10 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  xpBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10, backgroundColor: "#667eea" },
  xpBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  descriptionCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: SIZES.SPACING_MD,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  descTitle: { fontSize: 15, fontWeight: "600", color: COLORS.GRAY_800, marginBottom: 6 },
  descText: { fontSize: 14, color: COLORS.GRAY_600, lineHeight: 20 },
  examplesCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: SIZES.SPACING_MD,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  examplesTitle: { fontSize: 15, fontWeight: "600", color: COLORS.GRAY_800, marginBottom: 10 },
  exampleItem: {
    backgroundColor: COLORS.GRAY_50,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    gap: 4,
  },
  exampleLabel: { fontSize: 13, fontWeight: "700", color: COLORS.GRAY_800 },
  exampleText: { fontSize: 13, color: COLORS.GRAY_600, lineHeight: 18 },
  hiddenExamplesText: { fontSize: 12, color: COLORS.GRAY_400, marginTop: 4 },

  constraintsCard: {
    backgroundColor: "#fff8e1",
    borderRadius: 12,
    padding: SIZES.SPACING_MD,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#ff9800",
  },
  constraintsTitle: { fontSize: 14, fontWeight: "600", color: "#e65100", marginBottom: 6 },
  constraintItem: { fontSize: 13, color: COLORS.GRAY_700, marginBottom: 4 },

  langSection: { marginBottom: 12 },
  langSectionLabel: { fontSize: 14, fontWeight: "600", color: COLORS.GRAY_700, marginBottom: 8 },
  langRow: { flexDirection: "row", gap: 0, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: COLORS.GRAY_200 },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderRightWidth: 1,
    borderRightColor: COLORS.GRAY_200,
  },
  langBtnActive: { backgroundColor: COLORS.ACCENT },
  langBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.GRAY_600 },
  langBtnTextActive: { color: COLORS.WHITE },

  editorSection: { marginBottom: 12 },
  editorLabel: { fontSize: 14, fontWeight: "600", color: COLORS.GRAY_700, marginBottom: 6 },
  editorWrap: { borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: COLORS.GRAY_200 },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  runBtn: { backgroundColor: COLORS.GRAY_700 },
  submitBtn: { backgroundColor: COLORS.ACCENT },
  actionBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  consoleCard: {
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  consoleTitle: { color: "#aaa", fontSize: 12, marginBottom: 6, fontWeight: "600" },
  consoleText: { color: "#d4d4d4", fontSize: 13, fontFamily: "monospace" },
  constraintErrorsCard: {
    backgroundColor: "#fff4f1",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  constraintErrorsTitle: { fontSize: 12, fontWeight: "600", color: "#c62828", marginBottom: 6 },
  constraintErrorText: { fontSize: 12, color: "#4b2c20", lineHeight: 18 },
  constraintFailLabel: {
    color: "#d32f2f",
    fontSize: 13,
    fontWeight: "600",
    marginVertical: 6,
  },
  resultConstraintCard: {
    backgroundColor: "#fff8eb",
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
  },

  solutionsBtn: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.ACCENT,
    alignItems: "center",
    marginBottom: 12,
  },
  solutionsBtnText: { color: COLORS.ACCENT, fontWeight: "600", fontSize: 14 },

  showResultLink: {
    color: COLORS.ACCENT,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: SIZES.SPACING_LG,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.GRAY_900 },
  modalClose: { fontSize: 20, color: COLORS.GRAY_400, padding: 4 },

  summary: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: COLORS.GRAY_50,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  summaryItem: { alignItems: "center", gap: 4 },
  summaryLabel: { fontSize: 12, color: COLORS.GRAY_500 },
  summaryValue: { fontSize: 20, fontWeight: "700", color: COLORS.GRAY_900 },

  resultsList: { maxHeight: 300 },
  resultItem: {
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: COLORS.GRAY_50,
    borderLeftWidth: 4,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  resultIndex: { fontSize: 13, fontWeight: "600", color: COLORS.GRAY_800 },
  resultStatus: { fontSize: 13, fontWeight: "600" },

  modalCloseBtn: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.ACCENT,
    borderRadius: 10,
    alignItems: "center",
  },
  modalCloseBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },

  rankSection: {
    backgroundColor: "#fff8e1",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  rankTitle: { fontSize: 14, fontWeight: "700", color: "#e65100", marginBottom: 8 },
  rankInfo: { flexDirection: "row", justifyContent: "space-around" },
  rankText: { fontSize: 13, color: COLORS.GRAY_700 },
  rankValue: { fontSize: 18, fontWeight: "700", color: "#e65100" },

  statisticsBtn: {
    backgroundColor: COLORS.ACCENT,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 12,
  },
  statisticsBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  statSection: {
    backgroundColor: COLORS.GRAY_50,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  statSectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.GRAY_800, marginBottom: 8 },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  statLabel: { fontSize: 13, color: COLORS.GRAY_600 },
  statValue: { fontSize: 13, fontWeight: "600", color: COLORS.GRAY_800 },

  langStatCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
  },
  langStatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  langStatLabel: { fontSize: 12, fontWeight: "700", color: COLORS.GRAY_800 },
  langStatCount: { fontSize: 11, color: COLORS.GRAY_500 },
  langStatTime: { fontSize: 11, color: COLORS.GRAY_600, marginBottom: 6 },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.GRAY_200,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.ACCENT,
    borderRadius: 3,
  },

  histogramContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
  },
  histogramTitle: { fontSize: 11, fontWeight: "600", color: COLORS.GRAY_700, marginBottom: 8 },
  histogramBars: { gap: 4 },
  histogramBar: { alignItems: "center" },
  histogramBarLabel: {
    fontSize: 9,
    color: COLORS.GRAY_500,
    width: 80,
  },
  histogramBarTrack: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  histogramBarFill: {
    height: 16,
    borderRadius: 2,
    minWidth: 2,
  },
  histogramBarCount: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.GRAY_700,
    minWidth: 16,
  },
  histogramLegend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: COLORS.GRAY_600 },
});

export default CodingTaskSolver;
