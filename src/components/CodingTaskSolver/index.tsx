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
import {st} from "./styles"
import {
  buildCSharpTestSuite,
  buildJavaTestSuite,
  buildTestCode,
  formatArgsForDynamicLang,
  formatArgsForGolang,
  formatArgsForJavaOrCSharp,
  formatArgsForRust,
  generateObjectClasses,
  getDisplayInput,
  resolveTargetFunctionName,
} from "@/code";
import CodeEditor from "@/components/CodeEditor";
import type { ArgumentSchema, TestCaseArgument } from "@/components/Lesson/types";
import { type CodeLanguage,CodeService } from "@/http/codeService";
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

  const funcName = resolveTargetFunctionName(task.functionName, userCode, language);

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
        {task.functionName ? (
          <Text style={[st.descText, { marginTop: 10 }]}>
            Целевая функция: {task.functionName}
          </Text>
        ) : null}
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
            height={400}
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
            (navigation as any).navigate("Solutions", {
              taskId: task.id,
              taskTitle: task.title,
            })
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
                        r.passed ? st.resultItemPassed : st.resultItemFailed,
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
 
export default CodingTaskSolver;
