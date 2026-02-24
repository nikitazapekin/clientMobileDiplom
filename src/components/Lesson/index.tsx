// app/lesson/[id]/index.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "./styled";
import CustomButton from "@/components/Button";
import CodeEditor from "@/components/CodeEditor";
import { LessonDetailsService } from "@/http/lessonDetails";
import { CodeService } from "@/http/codeService";
import type { CodeLanguage } from "./types";
import type {
  Slide,
  SlideBlock,
  CodeTaskBlock,
  TheoryQuestionBlock,
  SourceBlock,
  TableBlock,
  ImageBlock,
  CodeExampleBlock,
  TextBlock,
  CodeConstraintType,
} from "./types";
import { COLORS } from "appStyles";

// Генерация уникального ID (для локального использования)
const genId = () => `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// Константы языков
const LANGUAGES: { value: CodeLanguage; label: string }[] = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "csharp", label: "C#" },
  { value: "java", label: "Java" },
  { value: "golang", label: "Go" },
];

// Функция для удаления main метода из отображаемого кода
const stripMainMethod = (code: string, language: CodeLanguage): string => {
  if (language === "java") {
    return code
      .replace(
        /public\s+static\s+void\s+main\s*\(String\[\]\s*args\)\s*\{[\s\S]*?\}\s*\n?/g,
        ""
      )
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      .trim();
  }
  if (language === "csharp") {
    return code
      .replace(
        /public\s+static\s+void\s+Main\s*\(string\[\]\s*args\)\s*\{[\s\S]*?\}\s*\n?/g,
        ""
      )
      .trim();
  }
  return code;
};

// Функция для добавления main метода в Java
const addJavaMainMethod = (
  code: string,
  funcName: string | null,
  input: string = "5"
): string => {
  if (!funcName) return code;

  if (code.includes("public static void main")) {
    return code.replace(
      /public\s+static\s+void\s+main\(String\[\]\s*args\)\s*\{[\s\S]*?\}/,
      `public static void main(String[] args) {
        try {
            System.out.println(${funcName}(${input}));
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
        }
    }`
    );
  } else {
    const codeWithoutLastBrace = code.trim().replace(/\}\s*$/, "");
    return `${codeWithoutLastBrace}

    public static void main(String[] args) {
        try {
            System.out.println(${funcName}(${input}));
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
        }
    }
}`;
  }
};

// Функция для создания тестового набора Java
const buildJavaTestSuite = (
  userCode: string,
  testCases: { input: string; expectedOutput: string }[],
  funcName: string | null
): string => {
  if (!funcName) return userCode;

  const testCasesCode = testCases
    .map((tc, index) => {
      let input = tc.input;

      let parsedInput;
      try {
        parsedInput = JSON.parse(input);
      } catch {
        parsedInput = input;
      }

      let argsStr: string;
      if (Array.isArray(parsedInput)) {
        argsStr = parsedInput
          .map((arg) => {
            if (typeof arg === "string") return `"${arg}"`;
            if (typeof arg === "boolean") return arg;
            if (typeof arg === "object") return JSON.stringify(arg);
            return arg;
          })
          .join(", ");
      } else {
        argsStr =
          typeof parsedInput === "string" ? `"${parsedInput}"` : String(parsedInput);
      }

      return `
        // Тест ${index + 1}
        try {
            Object result = ${funcName}(${argsStr});
            System.out.println("===TEST_START_" + ${index + 1} + "===");
            if (result == null) {
                System.out.print("null");
            } else if (result instanceof String) {
                System.out.print("\\"");
                System.out.print(result);
                System.out.print("\\"");
            } else if (result.getClass().isArray()) {
                if (result instanceof int[]) {
                    System.out.print(java.util.Arrays.toString((int[])result));
                } else if (result instanceof Integer[]) {
                    System.out.print(java.util.Arrays.toString((Integer[])result));
                } else if (result instanceof String[]) {
                    System.out.print(java.util.Arrays.toString((String[])result));
                } else {
                    System.out.print(java.util.Arrays.toString((Object[])result));
                }
            } else {
                System.out.print(result);
            }
            System.out.println("===TEST_END_" + ${index + 1} + "===");
        } catch (Exception e) {
            System.out.println("===TEST_START_" + ${index + 1} + "===");
            System.out.println("ERROR: " + e.getMessage());
            System.out.println("===TEST_END_" + ${index + 1} + "===");
        }`;
    })
    .join("\n");

  if (userCode.includes("public static void main")) {
    return userCode.replace(
      /public\s+static\s+void\s+main\(String\[\]\s*args\)\s*\{[\s\S]*?\}/,
      `public static void main(String[] args) {
${testCasesCode}
    }`
    );
  } else {
    const codeWithoutLastBrace = userCode.trim().replace(/\}\s*$/, "");
    return `${codeWithoutLastBrace}

    public static void main(String[] args) {
${testCasesCode}
    }
}`;
  }
};

// Функция для получения стартового кода по умолчанию
const getDefaultStarterCode = (language: CodeLanguage): string => {
  switch (language) {
    case "csharp":
      return `using System;

public class Program
{
    public static int YourFunction(int n)
    {
        // Ваш код здесь
        return n + 1;
    }
}`;
    case "java":
      return `public class Main {
    public static int yourFunction(int n) {
        // Ваш код здесь
        return n + 1;
    }
}`;
    case "python":
      return "def your_function(n):\n    # Ваш код здесь\n    return 0";
    case "golang":
      return `package main

func yourFunction(n int) int {
    // Ваш код здесь
    return 0
}`;
    default:
      return "function yourFunction(n) {\n    // Ваш код здесь\n    return 0;\n}";
  }
};

// Функция для сортировки блоков
const sortBlocks = (blocks: SlideBlock[]): SlideBlock[] => {
  return [...blocks].sort((a, b) => a.order - b.order);
};

// Функция для извлечения имени функции
const extractFunctionName = (code: string, lang: CodeLanguage): string | null => {
  if (!code) return null;

  try {
    switch (lang) {
      case "javascript":
        const jsMatch = code.match(
          /function\s+(\w+)|const\s+(\w+)\s*=\s*\([^)]*\)\s*=>|let\s+(\w+)\s*=\s*\([^)]*\)\s*=>|var\s+(\w+)\s*=\s*\([^)]*\)\s*=>/
        );
        return jsMatch
          ? jsMatch[1] || jsMatch[2] || jsMatch[3] || jsMatch[4]
          : null;

      case "python":
        const pyMatch = code.match(/def\s+(\w+)\s*\(/);
        return pyMatch ? pyMatch[1] : null;

      case "golang":
        const goMatch = code.match(/func\s+(\w+)\s*\(/);
        return goMatch ? goMatch[1] : null;

      case "csharp":
        const csMatch = code.match(
          /public\s+static\s+[\w<>\[\]]+\s+(\w+)\s*\([^)]*\)/
        );
        return csMatch ? csMatch[1] : null;

      case "java":
        const javaMatch = code.match(
          /public\s+static\s+[\w<>\[\]]+\s+(\w+)\s*\([^)]*\)/
        );
        return javaMatch ? javaMatch[1] : null;

      default:
        return null;
    }
  } catch (e) {
    console.error("Error extracting function name:", e);
    return null;
  }
};

// Функция для построения тестового кода
const buildTestCode = (
  userCode: string,
  input: string,
  lang: CodeLanguage,
  funcName: string | null
): string => {
  if (!funcName) return userCode;

  let parsedInput: any;
  try {
    parsedInput = JSON.parse(input);
  } catch {
    parsedInput = input;
  }

  const isArrayInput = input.trim().startsWith("[") && input.trim().endsWith("]");

  switch (lang) {
    case "javascript":
      if (isArrayInput) {
        return `${userCode}\nconsole.log(JSON.stringify(${funcName}(${input})));`;
      } else {
        const args = Array.isArray(parsedInput) ? parsedInput : [parsedInput];
        const argsStr = args.map((arg: any) => JSON.stringify(arg)).join(", ");
        return `${userCode}\nconsole.log(JSON.stringify(${funcName}(${argsStr})));`;
      }

    case "python":
      if (isArrayInput) {
        return `${userCode}\nimport json\nprint(json.dumps(${funcName}(${input})))`;
      } else {
        const args = Array.isArray(parsedInput) ? parsedInput : [parsedInput];
        const argsStr = args.map((arg: any) => JSON.stringify(arg)).join(", ");
        return `${userCode}\nimport json\nprint(json.dumps(${funcName}(${argsStr})))`;
      }

    case "csharp":
      if (isArrayInput) {
        const arrayValues = parsedInput.map((v: any) => v).join(", ");
        return `${userCode}\n\npublic class Runner {\n    public static void Main() {\n        Console.WriteLine(JsonSerializer.Serialize(Program.${funcName}(new int[] { ${arrayValues} })));\n    }\n}`;
      } else {
        return `${userCode}\n\npublic class Runner {\n    public static void Main() {\n        Console.WriteLine(JsonSerializer.Serialize(Program.${funcName}(${input})));\n    }\n}`;
      }

    case "java":
      return addJavaMainMethod(userCode, funcName, input);

    case "golang":
      if (isArrayInput) {
        const arrayValues = parsedInput.map((v: any) => v).join(", ");
        return `${userCode}\n\nfunc main() { result := ${funcName}([]int{${arrayValues}}); jsonResult, _ := json.Marshal(result); fmt.Println(string(jsonResult)) }`;
      } else {
        return `${userCode}\n\nfunc main() { result := ${funcName}(${input}); jsonResult, _ := json.Marshal(result); fmt.Println(string(jsonResult)) }`;
      }

    default:
      return userCode;
  }
};

// Функция для сравнения выводов
const compareOutputs = (actual: any, expected: any): boolean => {
  if (actual == null && expected == null) return true;
  if (actual == null || expected == null) return false;

  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return false;
    return actual.every(
      (item, index) => JSON.stringify(item) === JSON.stringify(expected[index])
    );
  }

  if (typeof actual === "object" && typeof expected === "object") {
    return JSON.stringify(actual) === JSON.stringify(expected);
  }

  return String(actual).trim() === String(expected).trim();
};

// Модальное окно с источниками
const SourcesModal = ({
  visible,
  onClose,
  sources,
}: {
  visible: boolean;
  onClose: () => void;
  sources: { url: string; note?: string }[];
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Источники</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {sources.length === 0 ? (
              <Text style={styles.noSourcesText}>Нет источников</Text>
            ) : (
              sources.map((source, index) => (
                <View key={index} style={styles.sourceItem}>
                  <Text style={styles.sourceUrl}>{source.url}</Text>
                  {source.note && (
                    <Text style={styles.sourceNote}>{source.note}</Text>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Компонент для отображения текстового блока
const TextBlockView = ({ block }: { block: TextBlock }) => {
  return <Text style={styles.textBlock}>{block.content}</Text>;
};

// Компонент для отображения блока с примером кода
const CodeExampleBlockView = ({
  block,
  onRun,
  output,
  isLoading,
}: {
  block: CodeExampleBlock;
  onRun: () => void;
  output?: string;
  isLoading?: boolean;
}) => {
  return (
    <View style={styles.codeExampleBlock}>
      <CodeEditor
        value={block.code}
        onChange={() => {}}
        language={block.language}
        readOnly
        height={200}
      />
      {block.runnable && (
        <>
          <CustomButton
            text={isLoading ? "Запуск..." : "Запустить"}
        handler={onRun}
            disabled={isLoading}
            backgroundColor={COLORS.BLACK}
            maxWidth={120}
          />
          {output !== undefined && (
            <View style={styles.codeOutput}>
              <Text style={styles.codeOutputText}>{output}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

// Компонент для отображения таблицы
const TableBlockView = ({ block }: { block: TableBlock }) => {
  return (
    <View style={styles.tableWrapper}>
      {block.cells.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.tableRow}>
          {row.map((cell, cellIndex) => (
            <View key={cellIndex} style={styles.tableCell}>
              <Text style={styles.tableCellText}>{cell}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

// Компонент для отображения изображения
const ImageBlockView = ({ block }: { block: ImageBlock }) => {
  if (!block.url) return null;
  return (
    <View style={styles.imageBlock}>
      <Text>Изображение: {block.url}</Text>
    </View>
  );
};

// Компонент для отображения задачи с кодом
const CodeTaskBlockView = ({
  block,
  userCode,
  onCodeChange,
  onRun,
  onCheck,
  isRunning,
  output,
  testResults,
  constraintResults,
  testError,
}: {
  block: CodeTaskBlock;
  userCode: string;
  onCodeChange: (code: string) => void;
  onRun: () => void;
  onCheck: () => void;
  isRunning: boolean;
  output?: string;
  testResults?: { input: string; expected: string; actual: string; passed: boolean }[];
  constraintResults?: {
    type: CodeConstraintType;
    name: string;
    passed: boolean;
    expected: string;
    actual: string;
  }[];
  testError?: string;
}) => {
  const displayCode = stripMainMethod(
    userCode || block.startCode || getDefaultStarterCode(block.language),
    block.language
  );

  return (
    <View style={styles.codeTaskBlock}>
      {block.description && (
        <Text style={styles.taskDescription}>{block.description}</Text>
      )}

      <CodeEditor
        value={displayCode}
        onChange={onCodeChange}
        language={block.language}
        height={250}
      />

      <View style={styles.buttonRow}>
        <CustomButton
          text={isRunning ? "Запуск..." : "Запустить"}
          handler={onRun}
          disabled={isRunning}
          backgroundColor={COLORS.BLACK}
          maxWidth={120}
        />
        <CustomButton
          text="Проверить"
          handler={onCheck}
          disabled={isRunning}
          backgroundColor={COLORS.BLACK}
          maxWidth={120}
        />
      </View>

      {testResults && testResults.length > 0 && (
        <View style={styles.testResults}>
          <Text style={styles.resultsTitle}>
            Результаты тестов:{" "}
            {testResults.filter((r) => r.passed).length}/{testResults.length}
          </Text>
          {testResults.map((result, index) => (
            <View
              key={index}
              style={[
                styles.testCaseResult,
                result.passed ? styles.passedTest : styles.failedTest,
              ]}
            >
              <Text style={styles.testCaseTitle}>Тест #{index + 1}</Text>
              <Text>Вход: {result.input}</Text>
              <Text>Ожидалось: {result.expected}</Text>
              <Text>Получено: {result.actual}</Text>
              <Text>{result.passed ? "✅ Пройден" : "❌ Провален"}</Text>
            </View>
          ))}
        </View>
      )}

      {constraintResults && constraintResults.length > 0 && (
        <View style={styles.constraintResults}>
          <Text style={styles.resultsTitle}>
            Ограничения:{" "}
            {constraintResults.filter((c) => c.passed).length}/{constraintResults.length}
          </Text>
          {constraintResults.map((constraint, index) => (
            <View
              key={index}
              style={[
                styles.constraintResult,
                constraint.passed ? styles.passedConstraint : styles.failedConstraint,
              ]}
            >
              <Text style={styles.constraintName}>{constraint.name}</Text>
              <Text>Ожидалось: {constraint.expected}</Text>
              <Text>Получено: {constraint.actual}</Text>
              <Text>{constraint.passed ? "✅ Выполнено" : "❌ Не выполнено"}</Text>
            </View>
          ))}
        </View>
      )}

      {output !== undefined && (
        <View style={styles.consoleOutput}>
          <Text style={styles.consoleTitle}>Консоль</Text>
          <Text style={styles.consoleText}>{output}</Text>
        </View>
      )}

      {testError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{testError}</Text>
        </View>
      )}
    </View>
  );
};

// Компонент для отображения теоретического вопроса
const TheoryQuestionBlockView = ({
  block,
  selectedOption,
  onSelectOption,
  onSubmit,
  isCorrect,
}: {
  block: TheoryQuestionBlock;
  selectedOption?: number;
  onSelectOption: (index: number) => void;
  onSubmit: () => void;
  isCorrect?: boolean;
}) => {
  return (
    <View style={styles.theoryQuestionBlock}>
      {block.text && <Text style={styles.questionText}>{block.text}</Text>}
      
      {block.code && (
        <CodeEditor
          value={block.code}
          onChange={() => {}}
          language="javascript"
          readOnly
          height={120}
        />
      )}

      {block.imageUrl && (
        <View style={styles.imageBlock}>
          <Text>Изображение: {block.imageUrl}</Text>
        </View>
      )}

      <View style={styles.optionsList}>
        {block.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionItem,
              selectedOption === index && styles.selectedOption,
            ]}
            onPress={() => onSelectOption(index)}
          >
            <View style={styles.optionRadio}>
              {selectedOption === index && <View style={styles.optionRadioSelected} />}
            </View>
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <CustomButton
        text="Ответить"
        handler={onSubmit}
        disabled={selectedOption === undefined}
        backgroundColor={COLORS.BLACK}
        maxWidth={120}
      />

      {isCorrect !== undefined && (
        <Text style={isCorrect ? styles.correctText : styles.incorrectText}>
          {isCorrect ? "  Правильно!" : "  Неправильно"}
        </Text>
      )}
    </View>
  );
};

// Основной компонент
const Lesson  = ({id}: {id: string}) => {
 

  console.log("Lesson IDddddddddddddddddddddd:", id);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sourcesModalVisible, setSourcesModalVisible] = useState(false);
  const [currentSources, setCurrentSources] = useState<{ url: string; note?: string }[]>(
    []
  );

  // Состояния для тестов и ответов
  const [testAnswers, setTestAnswers] = useState<{ [slideId: string]: string | number }>(
    {}
  );
  const [testErrors, setTestErrors] = useState<{ [slideId: string]: string }>({});
  const [testResults, setTestResults] = useState<{
    [slideId: string]: { input: string; expected: string; actual: string; passed: boolean }[];
  }>({});
  const [constraintResults, setConstraintResults] = useState<{
    [slideId: string]: {
      type: CodeConstraintType;
      name: string;
      passed: boolean;
      expected: string;
      actual: string;
    }[];
  }>({});
  const [isCorrectAnswers, setIsCorrectAnswers] = useState<{ [slideId: string]: boolean }>(
    {}
  );
  const [codeRunOutput, setCodeRunOutput] = useState<{ [blockId: string]: string }>({});
  const [codeRunLoading, setCodeRunLoading] = useState<{ [blockId: string]: boolean }>(
    {}
  );

  // Загрузка данных урока
  useEffect(() => {
    if (id) {
      loadLessonDetails();
    }
  }, [id]);

  const loadLessonDetails = async () => {
    setLoading(true);
    console.log("🔄 Loading lesson details, ID:", id);
    try {
      if (!id) {
        throw new Error("Lesson ID is required");
      }

      const data = await LessonDetailsService.getLessonDetailsByLessonId(id);
      console.log("✅ Lesson details loaded:", data);

      const allSlides: Slide[] = [
        ...data.slides.map((slide) => ({
          id: slide.id,
          title: slide.title,
          type: slide.type as "lesson" | "test",
          order: slide.orderIndex,
          blocks: (slide.blocks || []) as unknown as SlideBlock[],
        })),
        ...data.tests.map((test) => ({
          id: test.id,
          title: test.title,
          type: "test" as const,
          order: test.orderIndex,
          blocks: (test.blocks || []) as unknown as SlideBlock[],
        })),
      ].sort((a, b) => a.order - b.order);

      console.log("📚 Total slides:", allSlides.length);
      setSlides(allSlides);
    } catch (error: any) {
      console.error("❌ Error loading lesson:", error);
      Alert.alert(
        "Ошибка",
        error.message || "Не удалось загрузить урок"
      );
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const currentSlide = slides[currentIndex];

  const goToNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      Alert.alert("Поздравляем!", "Вы завершили урок!");
      router.back();
    }
  }, [currentIndex, slides.length, router]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const openSourcesModal = useCallback((sources: { url: string; note?: string }[]) => {
    setCurrentSources(sources);
    setSourcesModalVisible(true);
  }, []);

  const runCode = useCallback(
    async (blockId: string, language: CodeLanguage, code: string) => {
      setCodeRunLoading((prev) => ({ ...prev, [blockId]: true }));
      setCodeRunOutput((prev) => ({ ...prev, [blockId]: "" }));

      try {
        const res = await CodeService.executeCode({ language, code });
        const text = res.error ? `Ошибка: ${res.error}` : res.output || "";
        setCodeRunOutput((prev) => ({ ...prev, [blockId]: text }));
      } catch (error) {
        setCodeRunOutput((prev) => ({
          ...prev,
          [blockId]: `Ошибка: ${error}`,
        }));
      } finally {
        setCodeRunLoading((prev) => ({ ...prev, [blockId]: false }));
      }
    },
    []
  );

  const setTestAnswer = useCallback(
    (slideId: string, value: string | number) => {
      setTestAnswers((prev) => ({ ...prev, [slideId]: value }));
      setTestErrors((prev) => ({ ...prev, [slideId]: "" }));
      setTestResults((prev) => ({ ...prev, [slideId]: [] }));
      setConstraintResults((prev) => ({ ...prev, [slideId]: [] }));
      setIsCorrectAnswers((prev) => ({ ...prev, [slideId]: false }));
    },
    []
  );

  const setTestError = useCallback((slideId: string, error: string) => {
    setTestErrors((prev) => ({ ...prev, [slideId]: error }));
  }, []);

  // Сбор источников для текущего слайда
  const slideSources = currentSlide?.blocks
    .filter((block): block is SourceBlock => block.type === "source")
    .map((block) => ({ url: block.url, note: block.note }));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.BLACK} />
          <Text style={styles.loadingText}>Загрузка урока...   {id}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentSlide) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Слайд не найден</Text>
          <CustomButton
            text="Назад"
            handler={() => router.back()}
            backgroundColor={COLORS.BLACK}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{currentSlide.title}</Text>
          {slideSources && slideSources.length > 0 && (
            <TouchableOpacity
              style={styles.sourcesButton}
              onPress={() => openSourcesModal(slideSources)}
            >
              <Text style={styles.sourcesButtonText}>?</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.progress}>
          {currentIndex + 1} / {slides.length}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sortBlocks(currentSlide.blocks).map((block) => {
          switch (block.type) {
            case "text":
              return <TextBlockView key={block.id} block={block} />;

            case "codeExample":
              return (
                <CodeExampleBlockView
                  key={block.id}
                  block={block}
                  onRun={() => runCode(block.id, block.language, block.code)}
                  output={codeRunOutput[block.id]}
                  isLoading={codeRunLoading[block.id]}
                />
              );

            case "source":
              return null;

            case "table":
              return <TableBlockView key={block.id} block={block} />;

            case "image":
              return <ImageBlockView key={block.id} block={block} />;

            case "codeTask":
              return (
                <CodeTaskBlockView
                  key={block.id}
                  block={block}
                  userCode={
                    typeof testAnswers[currentSlide.id] === "string"
                      ? (testAnswers[currentSlide.id] as string)
                      : ""
                  }
                  onCodeChange={(code) => setTestAnswer(currentSlide.id, code)}
                  onRun={() => {
                    const code =
                      (testAnswers[currentSlide.id] as string) ||
                      block.startCode ||
                      getDefaultStarterCode(block.language);
                    runCode(block.id, block.language, code);
                  }}
                  onCheck={() => {
                    // Функция проверки будет реализована в компоненте
                  }}
                  isRunning={codeRunLoading[block.id]}
                  output={codeRunOutput[block.id]}
                  testResults={testResults[currentSlide.id]}
                  constraintResults={constraintResults[currentSlide.id]}
                  testError={testErrors[currentSlide.id]}
                />
              );

            case "theoryQuestion":
              return (
                <TheoryQuestionBlockView
                  key={block.id}
                  block={block}
                  selectedOption={
                    typeof testAnswers[currentSlide.id] === "number"
                      ? (testAnswers[currentSlide.id] as number)
                      : undefined
                  }
                  onSelectOption={(index) => setTestAnswer(currentSlide.id, index)}
                  onSubmit={() => {
                    const selected = testAnswers[currentSlide.id] as number;
                    if (selected === block.correctIndex) {
                      setIsCorrectAnswers((prev) => ({
                        ...prev,
                        [currentSlide.id]: true,
                      }));
                      setTimeout(() => {
                        goToNext();
                      }, 1000);
                    } else {
                      setIsCorrectAnswers((prev) => ({
                        ...prev,
                        [currentSlide.id]: false,
                      }));
                      setTestError(currentSlide.id, "Неверный ответ");
                    }
                  }}
                  isCorrect={isCorrectAnswers[currentSlide.id]}
                />
              );

            default:
              return null;
          }
        })}
      </ScrollView>

      <View style={styles.navigation}>
        <CustomButton
          text="Назад"
        handler={goToPrev}
          disabled={currentIndex === 0}
          backgroundColor={COLORS.BLACK}
          maxWidth={100}
        />
        <CustomButton
          text={currentIndex === slides.length - 1 ? "Завершить" : "Вперёд"}
          handler={goToNext}
          backgroundColor={COLORS.BLACK}
          maxWidth={100}
        />
      </View>

      <SourcesModal
        visible={sourcesModalVisible}
        onClose={() => setSourcesModalVisible(false)}
        sources={currentSources}
      />
    </SafeAreaView>
  );
};

export default Lesson;

/* import { Text, View } from "react-native";

const Lesson = () => {
    return (
        <View>
            <Text>Lesson</Text>
        </View>
    );
};
export default Lesson; */