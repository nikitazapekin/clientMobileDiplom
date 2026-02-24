// app/lesson/[id]/index.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from "react-native";
import { useRouter } from "expo-router";
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
  SourceBlock,
  TextBlock,
  CodeExampleBlock,
  TableBlock,
  ImageBlock,
  CodeTaskBlock,
  TheoryQuestionBlock,
  CodeConstraintType,
} from "./types";
import { COLORS } from "appStyles";

// Функция для сортировки блоков
const sortBlocks = (blocks: any[]) => {
  return [...blocks].sort((a, b) => (a.order || 0) - (b.order || 0));
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

// Функция для добавления main метода в Java
const addJavaMainMethod = (
  code: string,
  funcName: string | null,
  input: string = "5"
): string => {
  if (!funcName || !code) return code;

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
  if (!funcName || !userCode) return userCode;

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

// Функция для построения тестового кода
const buildTestCode = (
  userCode: string,
  input: string,
  lang: CodeLanguage,
  funcName: string | null
): string => {
  if (!funcName || !userCode) return userCode;

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

// Компонент для текстового блока
const TextBlockView = ({ block }: { block: TextBlock }) => {
  return <Text style={styles.textBlock}>{block.content}</Text>;
};

// Компонент для блока с примером кода
const CodeExampleBlockView = ({ block }: { block: CodeExampleBlock }) => {
  return (
    <View style={styles.codeExampleBlock}>
      <CodeEditor
        value={block.code || ""}
        onChange={() => {}}
        language={block.language || "javascript"}
        readOnly
        height={200}
      />
      {block.runnable && (
        <Text >* Этот код можно запустить</Text>
      )}
    </View>
  );
};

// Компонент для таблицы
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

// Компонент для изображения
const ImageBlockView = ({ block }: { block: ImageBlock }) => {
  if (!block.url) return null;
  
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.imageBlock}>
      {loading && !imageError && (
        <View style={styles.imageLoading}>
          <ActivityIndicator size="small" color={COLORS.BLACK} />
        </View>
      )}
      
      {!imageError ? (
        <Image
          source={{ uri: block.url }}
          style={styles.image}
          resizeMode="contain"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setImageError(true);
            setLoading(false);
          }}
        />
      ) : (
        <View style={styles.imageError}>
          <Text style={styles.imageErrorText}>❌ Не удалось загрузить изображение</Text>
          <Text style={styles.imageUrl}>{block.url}</Text>
        </View>
      )}
    </View>
  );
};

// Компонент для задачи с кодом (полная версия)
const CodeTaskBlockView = ({ 
  block, 
  slideId,
  codeValue,
  onCodeChange,
  onRun,
  onCheck,
  isRunning,
  output,
  testResults,
  constraintResults,
  testError 
}: { 
  block: CodeTaskBlock;
  slideId: string;
  codeValue: string;
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
  return (
    <View style={styles.codeTaskBlock}>
      {block.description && (
        <Text style={styles.taskDescription}>{block.description}</Text>
      )}

      <CodeEditor
        value={codeValue}
        onChange={onCodeChange}
        language={block.language || "javascript"}
        height={200}
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

      {output !== "" && output !== undefined && (
        <View style={styles.consoleOutput}>
          <Text style={styles.consoleTitle}>Результат запуска:</Text>
          <Text style={styles.consoleText}>{output}</Text>
        </View>
      )}

      {testResults && testResults.length > 0 && (
        <View style={styles.testResults}>
          <Text style={styles.resultsTitle}>
            Результаты тестов: {testResults.filter(r => r.passed).length}/{testResults.length}
          </Text>
          {testResults.map((result, index) => (
            <View 
              key={index} 
              style={[
                styles.testCaseResult,
                result.passed ? styles.passedTest : styles.failedTest
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
            Ограничения: {constraintResults.filter(c => c.passed).length}/{constraintResults.length}
          </Text>
          {constraintResults.map((constraint, index) => (
            <View 
              key={index} 
              style={[
             
                constraint.passed ? styles.passedConstraint : styles.failedConstraint
              ]}
            >
              <Text style={styles.constraintName}>{constraint.name}</Text>
              <Text>Ожидалось: {constraint.expected}</Text>
              <Text>Получено: {constraint.actual}</Text>
            </View>
          ))}
        </View>
      )}

      {testError && testError !== "" && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{testError}</Text>
        </View>
      )}
    </View>
  );
};

// Компонент для теоретического вопроса
const TheoryQuestionBlockView = ({ block }: { block: TheoryQuestionBlock }) => {
  const [selected, setSelected] = useState<number | undefined>(undefined);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = () => {
    setShowResult(true);
  };

  return (
    <View style={styles.theoryQuestionBlock}>
      {block.text && <Text style={styles.questionText}>{block.text}</Text>}
      
      {block.code && (
        <CodeEditor
          value={block.code}
          onChange={() => {}}
          language="javascript"
          readOnly
          height={100}
        />
      )}

      <View style={styles.optionsList}>
        {block.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionItem,
              selected === index && styles.selectedOption,
              
            ]}
            onPress={() => !showResult && setSelected(index)}
            disabled={showResult}
          >
            <View style={styles.optionRadio}>
              {selected === index && <View style={styles.optionRadioSelected} />}
            </View>
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {!showResult && (
        <CustomButton
          text="Ответить"
          handler={handleSubmit}
          disabled={selected === undefined}
          backgroundColor={COLORS.BLACK}
          maxWidth={120}
        />
      )}

      {showResult && (
        <Text style={selected === block.correctIndex ? styles.correctText : styles.incorrectText}>
          {selected === block.correctIndex ? "✅ Правильно!" : "❌ Неправильно"}
        </Text>
      )}
    </View>
  );
};

// Модальное окно для источников
const SourcesModal = ({ visible, onClose, sources }: { 
  visible: boolean; 
  onClose: () => void; 
  sources: { url: string; note?: string }[] 
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent}>
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
                  {source.note && <Text style={styles.sourceNote}>{source.note}</Text>}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Основной компонент
const Lesson = ({ id }: { id: string }) => {
  console.log("🎯 Lesson mounted with ID:", id);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sourcesModalVisible, setSourcesModalVisible] = useState(false);
  const [currentSources, setCurrentSources] = useState<{ url: string; note?: string }[]>([]);

  // Состояния для тестов и ответов
  const [testAnswers, setTestAnswers] = useState<{ [slideId: string]: string }>({});
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
  const [codeRunOutput, setCodeRunOutput] = useState<{ [blockId: string]: string }>({});
  const [codeRunLoading, setCodeRunLoading] = useState<{ [blockId: string]: boolean }>({});

  useEffect(() => {
    loadLessonDetails();
  }, [id]);

  const loadLessonDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!id) throw new Error("Lesson ID is required");

      const data = await LessonDetailsService.getLessonDetailsByLessonId(id);
      
      const allSlides: Slide[] = [];
      
      if (Array.isArray(data.slides)) {
        data.slides.forEach((slide, index) => {
          allSlides.push({
            id: slide.id || `slide_${index}`,
            title: slide.title || "Урок",
            type: "lesson",
            order: slide.orderIndex || index,
            blocks: Array.isArray(slide.blocks) ? (slide.blocks as any) : [],
          });
        });
      }

      if (Array.isArray(data.tests)) {
        data.tests.forEach((test, index) => {
          allSlides.push({
            id: test.id || `test_${index}`,
            title: test.title || "Тест",
            type: "test",
            order: test.orderIndex || (data.slides?.length || 0) + index,
            blocks: Array.isArray(test.blocks) ? (test.blocks as any) : [],
          });
        });
      }

      allSlides.sort((a, b) => a.order - b.order);
      
      if (allSlides.length === 0) {
        setError("В уроке нет слайдов");
      } else {
        setSlides(allSlides);
      }
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  const goToNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      Alert.alert("Поздравляем!", "Вы завершили урок!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    }
  }, [currentIndex, slides.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const openSourcesModal = useCallback((sources: { url: string; note?: string }[]) => {
    setCurrentSources(sources);
    setSourcesModalVisible(true);
  }, []);

  const runCode = useCallback(async (blockId: string, language: CodeLanguage, code: string) => {
    setCodeRunLoading(prev => ({ ...prev, [blockId]: true }));
    setCodeRunOutput(prev => ({ ...prev, [blockId]: "" }));

    try {
      const res = await CodeService.executeCode({ language, code });
      const text = res.error ? `Ошибка: ${res.error}` : res.output || "Код выполнен успешно";
      setCodeRunOutput(prev => ({ ...prev, [blockId]: text }));
    } catch (error: any) {
      setCodeRunOutput(prev => ({ ...prev, [blockId]: `Ошибка: ${error.message}` }));
    } finally {
      setCodeRunLoading(prev => ({ ...prev, [blockId]: false }));
    }
  }, []);

  const checkCodeTask = useCallback(async (block: CodeTaskBlock, slideId: string) => {
    const userCode = testAnswers[slideId] || block.startCode || "";
    
    setTestErrors(prev => ({ ...prev, [slideId]: "" }));
    setTestResults(prev => ({ ...prev, [slideId]: [] }));
    setConstraintResults(prev => ({ ...prev, [slideId]: [] }));

    if (!block.testCases || block.testCases.length === 0) {
      setTestErrors(prev => ({ ...prev, [slideId]: "Нет тест-кейсов для проверки" }));
      return;
    }

    const funcName = extractFunctionName(userCode, block.language || "javascript");
    
    if (!funcName) {
      setTestErrors(prev => ({ 
        ...prev, 
        [slideId]: `Не удалось найти имя функции в коде. Убедитесь, что функция определена правильно.` 
      }));
      return;
    }

    try {
      const results: any = [];
      
      for (const tc of block.testCases) {
        if (!tc.input || !tc.expectedOutput) {
          setTestErrors(prev => ({ 
            ...prev, 
            [slideId]: "Заполните все тест-кейсы" 
          }));
          return;
        }

        const codeToRun = buildTestCode(
          userCode,
          tc.input,
          block.language || "javascript",
          funcName
        );

        const res = await CodeService.executeCode({
          language: block.language || "javascript",
          code: codeToRun,
        });

        if (res.error) {
          setTestErrors(prev => ({ 
            ...prev, 
            [slideId]: `Ошибка выполнения: ${res.error}` 
          }));
          return;
        }

        const actualOutput = (res.output || "").trim();
        let expectedOutput = (tc.expectedOutput || "").trim();

        let actualParsed: any;
        let expectedParsed: any;

        try {
          actualParsed = JSON.parse(actualOutput);
        } catch {
          actualParsed = actualOutput;
        }

        try {
          expectedParsed = JSON.parse(expectedOutput);
        } catch {
          expectedParsed = expectedOutput;
        }

        const passed = compareOutputs(actualParsed, expectedParsed);

        results.push({
          input: tc.input,
          expected: expectedOutput,
          actual: actualOutput,
          passed,
        });
      }

      setTestResults(prev => ({ ...prev, [slideId]: results }));

      const allPassed = results.every((r: any) => r.passed);
      
      if (allPassed) {
        Alert.alert("Отлично!", "Все тесты пройдены!");
      } else {
        const failedCount = results.filter((r: any) => !r.passed).length;
        setTestErrors(prev => ({ 
          ...prev, 
          [slideId]: `Провалено тестов: ${failedCount} из ${results.length}` 
        }));
      }

    } catch (error: any) {
      setTestErrors(prev => ({ 
        ...prev, 
        [slideId]: `Ошибка проверки: ${error.message}` 
      }));
    }
  }, [testAnswers]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.BLACK} />
          <Text style={styles.loadingText}>Загрузка урока...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <CustomButton text="Назад" handler={() => router.back()} backgroundColor={COLORS.BLACK} />
        </View>
      </SafeAreaView>
    );
  }

  if (slides.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text>Нет слайдов</Text>
          <CustomButton text="Назад" handler={() => router.back()} backgroundColor={COLORS.BLACK} />
        </View>
      </SafeAreaView>
    );
  }

  const currentSlide = slides[currentIndex];
  
  // Собираем источники для текущего слайда
  const slideSources = currentSlide.blocks
    .filter((block): block is SourceBlock => block.type === "source")
    .map((block) => ({ url: block.url, note: block.note }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{currentSlide.title}</Text>
          {slideSources.length > 0 && (
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
          console.log("🔍 Rendering block type:", block.type);
          
          switch (block.type) {
            case "text":
              return <TextBlockView key={block.id} block={block} />;
            
            case "codeExample":
              return <CodeExampleBlockView key={block.id} block={block} />; 
            
            case "table":
              return <TableBlockView key={block.id} block={block} />;
                      
            case "image":
              return <ImageBlockView key={block.id} block={block} />;
            
            case "codeTask":
              return (
                <CodeTaskBlockView
                  key={block.id}
                  block={block}
                  slideId={currentSlide.id}
                  codeValue={testAnswers[currentSlide.id] || block.startCode || ""}
                  onCodeChange={(code) => setTestAnswers(prev => ({ ...prev, [currentSlide.id]: code }))}
                  onRun={() => {
                    const code = testAnswers[currentSlide.id] || block.startCode || "";
                    runCode(block.id, block.language || "javascript", code);
                  }}
                  onCheck={() => checkCodeTask(block, currentSlide.id)}
                  isRunning={codeRunLoading[block.id]}
                  output={codeRunOutput[block.id]}
                  testResults={testResults[currentSlide.id]}
                  constraintResults={constraintResults[currentSlide.id]}
                  testError={testErrors[currentSlide.id]}
                />
              );
            
            case "theoryQuestion":
              return <TheoryQuestionBlockView key={block.id} block={block} />;
            
            case "source":
              return null;
              
            default:
              return (
                <View key={block.id} style={styles.unknownBlock}>
                  <Text>Неизвестный тип блока: "{block.type}"</Text>
                </View>
              );
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