import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "appStyles";
import { useRouter } from "expo-router";

import { styles } from "./styled";
import type { CodeLanguage } from "./types";
import type {
  CodeConstraintType,
  CodeExampleBlock,
  CodeTaskBlock,
  ImageBlock,
  Slide,
  SlideBlock,
  SourceBlock,
  TableBlock,
  TextBlock,
  TheoryQuestionBlock,
} from "./types";

import CustomButton from "@/components/Button";
import CodeEditor from "@/components/CodeEditor";
import { CodeService } from "@/http/codeService";
import { LessonDetailsService } from "@/http/lessonDetails";

// Функция для сортировки блоков
const sortBlocks = (blocks: any[]) => {
  return [...blocks].sort((a, b) => (a.order || 0) - (b.order || 0));
};

// Функция для парсинга аргументов
const parseArguments = (input: string): any[] => {
  if (!input.trim()) return [];

  try {
    if (input.trim().startsWith("[") && input.trim().endsWith("]")) {
      return JSON.parse(input);
    }
  } catch {
    // Не JSON, продолжаем
  }

  const args: any[] = [];
  let current = "";
  let inString = false;
  let stringChar = "";
  let braceCount = 0;
  let bracketCount = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if ((char === '"' || char === "'" || char === "`") && input[i - 1] !== "\\") {
      if (!inString) {
        inString = true;
        stringChar = char;
        current += char;
      } else if (char === stringChar) {
        inString = false;
        current += char;
      } else {
        current += char;
      }
    } else if (char === "{" && !inString) {
      braceCount++;
      current += char;
    } else if (char === "}" && !inString) {
      braceCount--;
      current += char;
    } else if (char === "[" && !inString) {
      bracketCount++;
      current += char;
    } else if (char === "]" && !inString) {
      bracketCount--;
      current += char;
    } else if (char === "," && !inString && braceCount === 0 && bracketCount === 0) {
      const trimmed = current.trim();

      if (trimmed) {
        args.push(parseValue(trimmed));
      }

      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    args.push(parseValue(current.trim()));
  }

  return args;
};

const parseValue = (value: string): any => {
  if (value === "") return "";

  try {
    return JSON.parse(value);
  } catch {
    // Не JSON
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  if (value === "true") return true;

  if (value === "false") return false;

  if (value === "null") return null;

  if (value === "undefined") return undefined;

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith("`") && value.endsWith("`"))
  ) {
    return value.slice(1, -1);
  }

  if (value.startsWith("{") && value.endsWith("}")) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
};

const formatArgumentsForCode = (args: any[]): string => {
  return args
    .map((arg) => {
      if (typeof arg === "string") {
        return `"${arg}"`;
      }

      if (typeof arg === "object") {
        return JSON.stringify(arg);
      }

      return String(arg);
    })
    .join(", ");
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

        return jsMatch ? jsMatch[1] || jsMatch[2] || jsMatch[3] || jsMatch[4] : null;

      case "python":
        const pyMatch = code.match(/def\s+(\w+)\s*\(/);

        return pyMatch ? pyMatch[1] : null;

      case "golang":
        const goMatch = code.match(/func\s+(\w+)\s*\(/);

        return goMatch ? goMatch[1] : null;

      case "csharp":
        const csMatch = code.match(/public\s+static\s+[\w<>\[\]]+\s+(\w+)\s*\([^)]*\)/);

        return csMatch ? csMatch[1] : null;

      case "java":
        const javaMatch = code.match(/public\s+static\s+[\w<>\[\]]+\s+(\w+)\s*\([^)]*\)/);

        return javaMatch ? javaMatch[1] : null;

      default:
        return null;
    }
  } catch (e) {
    console.error("Error extracting function name:", e);

    return null;
  }
};

// Функция для добавления main метода в Java с поддержкой логов
const addJavaMainMethod = (code: string, funcName: string | null, input: string = "5"): string => {
  if (!funcName) return code;

  const mainMethod = `
    public static void main(String[] args) {
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        java.io.PrintStream originalOut = System.out;
        System.setOut(new java.io.PrintStream(baos));
        
        try {
            Object result = ${funcName}(${input});
            
            System.setOut(originalOut);
            
            String logs = baos.toString();
            
            if (!logs.isEmpty()) {
                System.out.println("===LOGS_START===");
                System.out.print(logs);
                System.out.println("===LOGS_END===");
            }
            
            System.out.println("===RESULT_START===");
            if (result == null) {
                System.out.print("null");
            } else if (result instanceof String) {
                System.out.print("\\"" + result + "\\"");
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
            System.out.println("===RESULT_END===");
            
        } catch (Exception e) {
            System.setOut(originalOut);
            System.out.println("===RESULT_START===");
            System.out.print("{\\"error\\":\\"" + e.getMessage() + "\\"}");
            System.out.println("===RESULT_END===");
        }
    }`;

  if (code.includes("public static void main")) {
    return code.replace(
      /public\s+static\s+void\s+main\(String\[\]\s*args\)\s*\{[\s\S]*?\}/,
      mainMethod
    );
  } else {
    const codeWithoutLastBrace = code.trim().replace(/\}\s*$/, "");

    return `${codeWithoutLastBrace}\n${mainMethod}\n}`;
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
      const testNum = index + 1;
      const args = parseArguments(tc.input);
      const argsStr = formatArgumentsForCode(args);

      return `
        // Тест ${testNum}
        {
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            java.io.PrintStream originalOut = System.out;
            System.setOut(new java.io.PrintStream(baos));
            
            try {
                Object result = ${funcName}(${argsStr});
                
                System.setOut(originalOut);
                
                String logs = baos.toString();
                
                if (logs != null && !logs.isEmpty()) {
                    System.out.println("===LOGS_START_" + ${testNum} + "===");
                    System.out.print(logs);
                    if (!logs.endsWith("\\n")) {
                        System.out.println();
                    }
                    System.out.println("===LOGS_END_" + ${testNum} + "===");
                }
                
                System.out.println("===RESULT_START_" + ${testNum} + "===");
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
                System.out.println();
                System.out.println("===RESULT_END_" + ${testNum} + "===");
                
            } catch (Exception e) {
                System.setOut(originalOut);
                System.out.println("===RESULT_START_" + ${testNum} + "===");
                System.out.print("ERROR: " + e.getMessage());
                System.out.println();
                System.out.println("===RESULT_END_" + ${testNum} + "===");
            }
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

// Функция для создания тестового набора C#
const buildCSharpTestSuite = (
  userCode: string,
  testCases: { input: string; expectedOutput: string }[],
  funcName: string | null
): string => {
  if (!funcName) return userCode;

  const testCasesCode = testCases
    .map((tc, index) => {
      const testNum = index + 1;
      const args = parseArguments(tc.input);
      const argsStr = formatArgumentsForCode(args);

      return `
        // Тест ${testNum}
        {
            var originalOut = Console.Out;
            var originalError = Console.Error;
            var outWriter = new StringWriter();
            var errorWriter = new StringWriter();
            Console.SetOut(outWriter);
            Console.SetError(errorWriter);
            
            try {
                var result = Program.${funcName}(${argsStr});
                
                Console.SetOut(originalOut);
                Console.SetError(originalError);
                
                var outLogs = outWriter.ToString();
                var errorLogs = errorWriter.ToString();
                
                if (!string.IsNullOrEmpty(outLogs) || !string.IsNullOrEmpty(errorLogs)) {
                    Console.WriteLine("===LOGS_START_" + ${testNum} + "===");
                    if (!string.IsNullOrEmpty(outLogs)) {
                        Console.Write(outLogs);
                    }
                    if (!string.IsNullOrEmpty(errorLogs)) {
                        Console.Write("ERROR: " + errorLogs);
                    }
                    if (!outLogs.EndsWith("\\n") && !errorLogs.EndsWith("\\n")) {
                        Console.WriteLine();
                    }
                    Console.WriteLine("===LOGS_END_" + ${testNum} + "===");
                }
                
                Console.WriteLine("===RESULT_START_" + ${testNum} + "===");
                Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(result));
                Console.WriteLine("===RESULT_END_" + ${testNum} + "===");
                
            } catch (Exception e) {
                Console.SetOut(originalOut);
                Console.SetError(originalError);
                Console.WriteLine("===RESULT_START_" + ${testNum} + "===");
                Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(new { error = e.Message }));
                Console.WriteLine("===RESULT_END_" + ${testNum} + "===");
            }
        }`;
    })
    .join("\n");

  const usings = `using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Collections.Generic;
`;

  if (userCode.includes("using System;")) {
    return usings + "\n" + userCode.replace(/^using.*;(\r\n|\r|\n)?/g, "") + `
    
public class Runner {
    public static void Main() {
${testCasesCode}
    }
}`;
  } else {
    return usings + "\n" + userCode + `
    
public class Runner {
    public static void Main() {
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
  if (!funcName) return userCode;

  const args = parseArguments(input);
  const argsStr = formatArgumentsForCode(args);

  switch (lang) {
    case "javascript":
      return `${userCode}

const __originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

const __logs = [];

console.log = function(...args) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  __logs.push('📌 ' + message);
  __originalConsole.log.apply(console, args);
};

console.error = function(...args) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  __logs.push('❌ ' + message);
  __originalConsole.error.apply(console, args);
};

console.warn = function(...args) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  __logs.push('⚠️ ' + message);
  __originalConsole.warn.apply(console, args);
};

console.info = function(...args) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  __logs.push('ℹ️ ' + message);
  __originalConsole.info.apply(console, args);
};

try {
  const result = ${funcName}(${argsStr});
  
  console.log = __originalConsole.log;
  console.error = __originalConsole.error;
  console.warn = __originalConsole.warn;
  console.info = __originalConsole.info;
  
  if (__logs.length > 0) {
    console.log('\\n===LOGS_START===');
    __logs.forEach(log => console.log(log));
    console.log('===LOGS_END===');
  }
  
  console.log('===RESULT_START===');
  console.log(JSON.stringify(result));
  console.log('===RESULT_END===');
  
} catch (error) {
  console.log = __originalConsole.log;
  console.error = __originalConsole.error;
  console.warn = __originalConsole.warn;
  console.info = __originalConsole.info;
  
  console.log('===RESULT_START===');
  console.log(JSON.stringify({ error: error.message }));
  console.log('===RESULT_END===');
}`;

    case "python":
      return `${userCode}
import json
import sys
from io import StringIO

__old_stdout = sys.stdout
__old_stderr = sys.stderr
__stdout_buffer = StringIO()
__stderr_buffer = StringIO()
sys.stdout = __stdout_buffer
sys.stderr = __stderr_buffer

try:
    result = ${funcName}(${argsStr})
    
    sys.stdout = __old_stdout
    sys.stderr = __old_stderr
    
    __stdout = __stdout_buffer.getvalue()
    __stderr = __stderr_buffer.getvalue()
    
    if __stdout or __stderr:
        print("===LOGS_START===")
        if __stdout:
            print(__stdout, end='')
        if __stderr:
            print("STDERR:", __stderr, end='')
        print("===LOGS_END===")
    
    print("===RESULT_START===")
    print(json.dumps(result))
    print("===RESULT_END===")
    
except Exception as e:
    sys.stdout = __old_stdout
    sys.stderr = __old_stderr
    print("===RESULT_START===")
    print(json.dumps({"error": str(e)}))
    print("===RESULT_END===")`;

    case "java":
      return buildJavaTestSuite(userCode, [{ input, expectedOutput: "" }], funcName);

    case "csharp":
      return buildCSharpTestSuite(userCode, [{ input, expectedOutput: "" }], funcName);

    case "golang":
      const hasImports = userCode.includes("import (");

      if (hasImports) {
        return userCode.replace(
          /import\s+\(([\s\S]*?)\)/,
          `import ($1
    "encoding/json"
    "fmt"
    "os"
    "bytes"
    "io"
    "strings")`
        ) + `

func main() {
    old := os.Stdout
    r, w, _ := os.Pipe()
    os.Stdout = w
    
    outC := make(chan string)
    go func() {
        var buf bytes.Buffer
        io.Copy(&buf, r)
        outC <- buf.String()
    }()
    
    result := ${funcName}(${argsStr})
    
    w.Close()
    os.Stdout = old
    logs := <-outC
    
    if logs != "" {
        fmt.Println("===LOGS_START===")
        fmt.Print(logs)
        if !strings.HasSuffix(logs, "\\n") {
            fmt.Println()
        }
        fmt.Println("===LOGS_END===")
    }
    
    fmt.Println("===RESULT_START===")
    jsonResult, _ := json.Marshal(result)
    fmt.Println(string(jsonResult))
    fmt.Println("===RESULT_END===")
}`;
      } else {
        return userCode.replace(
          /package main\n/,
          `package main

import (
    "encoding/json"
    "fmt"
    "os"
    "bytes"
    "io"
    "strings"
)
`
        ) + `

func main() {
    old := os.Stdout
    r, w, _ := os.Pipe()
    os.Stdout = w
    
    outC := make(chan string)
    go func() {
        var buf bytes.Buffer
        io.Copy(&buf, r)
        outC <- buf.String()
    }()
    
    result := ${funcName}(${argsStr})
    
    w.Close()
    os.Stdout = old
    logs := <-outC
    
    if logs != "" {
        fmt.Println("===LOGS_START===")
        fmt.Print(logs)
        if !strings.HasSuffix(logs, "\\n") {
            fmt.Println()
        }
        fmt.Println("===LOGS_END===")
    }
    
    fmt.Println("===RESULT_START===")
    jsonResult, _ := json.Marshal(result)
    fmt.Println(string(jsonResult))
    fmt.Println("===RESULT_END===")
}`;
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
        <Text  >* Этот код можно запустить</Text>
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

// Компонент для задачи с кодом
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
          <Text style={styles.consoleTitle}>Консоль</Text>
          <Text style={styles.consoleText}>{output}</Text>
        </View>
      )}

      {testResults && testResults.length > 0 && (
        <View style={styles.testResults}>
          <Text style={styles.resultsTitle}>
            📊 Результаты тестирования
          </Text>
          <Text style={styles.testSummary}>
            Пройдено: {testResults.filter(r => r.passed).length}/{testResults.length}
          </Text>
          {testResults.map((result, index) => (
            <View
              key={index}
              style={[
                styles.testCaseResult,
                result.passed ? styles.passedTest : styles.failedTest
              ]}
            >
              <View style={styles.testCaseHeader}>
                <Text style={styles.testCaseTitle}>Тест #{index + 1}</Text>
                <Text style={result.passed ? styles.passedText : styles.failedText}>
                  {result.passed ? "✅ Пройден" : "❌ Провален"}
                </Text>
              </View>
              <Text>Вход: {result.input}</Text>
              <Text>Ожидалось: {result.expected}</Text>
              <Text>Получено: {result.actual}</Text>
            </View>
          ))}
        </View>
      )}

      {constraintResults && constraintResults.length > 0 && (
        <View style={styles.constraintResults}>
          <Text style={styles.resultsTitle}>
            🎯 Проверка ограничений
          </Text>
          <Text style={styles.constraintSummary}>
            Выполнено: {constraintResults.filter(c => c.passed).length}/{constraintResults.length}
          </Text>
          {constraintResults.map((constraint, index) => (
            <View
              key={index}
              style={[
                styles.constraintResult,
                constraint.passed ? styles.passedConstraint : styles.failedConstraint
              ]}
            >
              <View style={styles.constraintHeader}>
                <Text style={styles.constraintName}>{constraint.name}</Text>
                <Text>{constraint.passed ? "✅" : "❌"}</Text>
              </View>
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

      {block.imageUrl && (
        <Image
          source={{ uri: block.imageUrl }}
          style={styles.theoryImage}
          resizeMode="contain"
        />
      )}

      <View style={styles.optionsList}>
        {block.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionItem,
              selected === index && styles.selectedOption,
              showResult && index === block.correctIndex && styles.correctOption,
              showResult && selected === index && selected !== block.correctIndex && styles.wrongOption
            ]}
            onPress={() => !showResult && setSelected(index)}
            disabled={showResult}
          >
            <View style={styles.optionRadio}>
              {selected === index && <View style={styles.optionRadioSelected} />}
            </View>
            <Text style={styles.optionText}>{option}</Text>
            {showResult && index === block.correctIndex && (
              <Text style={styles.correctMark}>✓</Text>
            )}
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

// Модальное окно результатов с анимацией звезд
const ResultsModal = ({
  visible,
  onClose,
  results,
  totalTasks,
  completedTasks,
  totalTestCases,
  passedTestCases,
  constraintsPassed,
  slides
}: {
  visible: boolean;
  onClose: () => void;
  results: {
    slideId: string;
    title: string;
    passed: boolean;
    testCasesPassed: number;
    testCasesTotal: number;
    constraintsPassed: boolean;
  }[];
  totalTasks: number;
  completedTasks: number;
  totalTestCases: number;
  passedTestCases: number;
  constraintsPassed: boolean;
  slides: Slide[];
}) => {
  const [stars, setStars] = useState(0);
  const [showStars, setShowStars] = useState(false);

  // Анимации для звезд
  const starAnimations = [
    useRef(new Animated.Value(-50)).current,
    useRef(new Animated.Value(-50)).current,
    useRef(new Animated.Value(-50)).current
  ];

  const starRotations = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current
  ];

  const starOpacities = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current
  ];

  useEffect(() => {
    if (visible) {
      // Сбрасываем анимации
      starAnimations.forEach(anim => anim.setValue(-50));
      starRotations.forEach(anim => anim.setValue(0));
      starOpacities.forEach(anim => anim.setValue(0));

      setShowStars(false);

      // Определяем количество звезд
      const theoryTasks = results.filter((r: { slideId: string }) => {
        const slide = slides.find((s: Slide) => s.id === r.slideId);

        return slide?.blocks.some((b: SlideBlock) => b.type === "theoryQuestion");
      });

      const theoryPassed = theoryTasks.every((t: { passed: boolean }) => t.passed);
      const allTestsPassed = passedTestCases === totalTestCases && totalTestCases > 0;
      const allTasksCompleted = completedTasks === totalTasks;

      let starCount = 0;

      // 1 звезда: все тесты пройдены
      if (allTestsPassed) {
        starCount = 1;
      }

      // 2 звезды: все тесты пройдены, теория верна
      if (allTestsPassed && theoryPassed) {
        starCount = 2;
      }

      // 3 звезды: все тесты пройдены, теория верна, ограничения соблюдены
      if (allTestsPassed && theoryPassed && constraintsPassed && allTasksCompleted) {
        starCount = 3;
      }

      setStars(starCount);

      // Запускаем анимацию звезд
      const animateStars = async () => {
        setShowStars(true);

        for (let i = 0; i < starCount; i++) {
          // Анимация падения
          Animated.parallel([
            Animated.timing(starAnimations[i], {
              toValue: 0,
              duration: 800,
              easing: Easing.bounce,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(starRotations[i], {
                toValue: 1,
                duration: 400,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              Animated.timing(starRotations[i], {
                toValue: -1,
                duration: 400,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              Animated.timing(starRotations[i], {
                toValue: 0,
                duration: 200,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(starOpacities[i], {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            })
          ]).start();

          // Ждем окончания анимации текущей звезды
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      };

      setTimeout(animateStars, 300);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.resultsModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Результаты урока</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.starsContainer}>
            {showStars && [0, 1, 2].map((index) => {
              const rotate = starRotations[index].interpolate({
                inputRange: [-1, 0, 1],
                outputRange: ['-30deg', '0deg', '30deg']
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.starWrapper,
                    {
                      transform: [
                        { translateY: starAnimations[index] },
                        { rotate: rotate }
                      ],
                      opacity: starOpacities[index],
                      left: `${30 + index * 20}%`,
                    }
                  ]}
                >
                  <Text style={[
                    styles.star,
                    index < stars ? styles.starFilled : styles.starEmpty
                  ]}>
                    ★
                  </Text>
                </Animated.View>
              );
            })}
          </View>

          <View style={styles.resultsSummary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Выполнено заданий:</Text>
              <Text style={styles.summaryValue}>
                {completedTasks}/{totalTasks}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Пройдено тестов:</Text>
              <Text style={styles.summaryValue}>
                {passedTestCases}/{totalTestCases}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Ограничения:</Text>
              <Text style={styles.summaryValue}>
                {constraintsPassed ? "✅" : "❌"}
              </Text>
            </View>
          </View>

          <ScrollView style={styles.resultsList}>
            <Text style={styles.resultsListTitle}>Детали по заданиям:</Text>
            {results.map((result) => (
              <View
                key={result.slideId}
                style={[
                  styles.resultItem,
                  result.passed ? styles.resultPassed : styles.resultFailed
                ]}
              >
                <Text style={styles.resultTitle}>{result.title}</Text>
                <View style={styles.resultDetails}>
                  <Text>
                    Тесты: {result.testCasesPassed}/{result.testCasesTotal}
                  </Text>
                  <Text>
                    Ограничения: {result.constraintsPassed ? "✅" : "❌"}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <CustomButton
              text="Закрыть"
              handler={onClose}
              backgroundColor={COLORS.BLACK}
              maxWidth={200}
            />
          </View>
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
  const [resultsModalVisible, setResultsModalVisible] = useState(false);
  const [lessonResults, setLessonResults] = useState<{
    results: any[];
    totalTasks: number;
    completedTasks: number;
    totalTestCases: number;
    passedTestCases: number;
    constraintsPassed: boolean;
  }>({
    results: [],
    totalTasks: 0,
    completedTasks: 0,
    totalTestCases: 0,
    passedTestCases: 0,
    constraintsPassed: true,
  });

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

  const calculateResults = useCallback(() => {
    const testSlides = slides.filter((s) => s.type === "test");
    const results: any[] = [];
    let totalCompleted = 0;
    let totalTestCasesCount = 0;
    let passedTestCasesCount = 0;
    let allConstraintsPassed = true;

    testSlides.forEach((slide) => {
      const slideTestResult = testResults[slide.id];
      const slideConstraintResult = constraintResults[slide.id];

      let slidePassed = false;
      let slideTestCasesPassed = 0;
      let slideTestCasesTotal = 0;
      let slideConstraintsPassed = true;

      const codeTasks = slide.blocks.filter((b) => b.type === "codeTask") as CodeTaskBlock[];
      const theoryQuestions = slide.blocks.filter(
        (b) => b.type === "theoryQuestion"
      ) as TheoryQuestionBlock[];

      if (codeTasks.length > 0) {
        if (slideTestResult) {
          slideTestCasesPassed = slideTestResult.filter(r => r.passed).length || 0;
          slideTestCasesTotal = slideTestResult.length || 0;
          slidePassed = slideTestCasesPassed === slideTestCasesTotal && slideTestCasesTotal > 0;
        }
      } else if (theoryQuestions.length > 0) {
        // Для теоретических вопросов нужно добавить логику
        slidePassed = true; // Заглушка
        slideTestCasesTotal = theoryQuestions.length;
        slideTestCasesPassed = theoryQuestions.length;
      }

      if (slidePassed) totalCompleted++;

      results.push({
        slideId: slide.id,
        title: slide.title,
        passed: slidePassed,
        testCasesPassed: slideTestCasesPassed,
        testCasesTotal: slideTestCasesTotal,
        constraintsPassed: slideConstraintsPassed,
      });

      totalTestCasesCount += slideTestCasesTotal;
      passedTestCasesCount += slideTestCasesPassed;
      allConstraintsPassed = allConstraintsPassed && slideConstraintsPassed;
    });

    setLessonResults({
      results,
      totalTasks: testSlides.length,
      completedTasks: totalCompleted,
      totalTestCases: totalTestCasesCount,
      passedTestCases: passedTestCasesCount,
      constraintsPassed: allConstraintsPassed,
    });

    setResultsModalVisible(true);
  }, [slides, testResults, constraintResults]);

  const goToNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      calculateResults();
    }
  }, [currentIndex, slides.length, calculateResults]);

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

      // Парсим вывод для отделения логов от результата
      let output = "";

      if (res.output) {
        const lines = res.output.split("\n");
        let inLogs = false;
        let inResult = false;
        let currentLogs: string[] = [];
        let currentResult: string[] = [];

        for (const line of lines) {
          if (line.includes("===LOGS_START===")) {
            inLogs = true;
            currentLogs = [];
            continue;
          }

          if (line.includes("===LOGS_END===")) {
            inLogs = false;

            if (currentLogs.length > 0) {
              output += "📋 Логи выполнения:\n" + currentLogs.join("\n") + "\n\n";
            }

            continue;
          }

          if (line.includes("===RESULT_START===")) {
            inResult = true;
            currentResult = [];
            continue;
          }

          if (line.includes("===RESULT_END===")) {
            inResult = false;

            if (currentResult.length > 0) {
              output += "✅ Результат функции:\n" + currentResult.join("\n");
            }

            continue;
          }

          if (inLogs) {
            currentLogs.push(line);
          } else if (inResult) {
            currentResult.push(line);
          }
        }

        if (!output && res.output) {
          output = res.output;
        }
      }

      setCodeRunOutput(prev => ({ ...prev, [blockId]: output }));
    } catch (error: any) {
      setCodeRunOutput(prev => ({ ...prev, [blockId]: `❌ Ошибка: ${error.message}` }));
    } finally {
      setCodeRunLoading(prev => ({ ...prev, [blockId]: false }));
    }
  }, []);

  const checkCodeTask = useCallback(async (block: CodeTaskBlock, slideId: string) => {
    const userCode = testAnswers[slideId] || block.startCode || "";

    setTestErrors(prev => ({ ...prev, [slideId]: "" }));
    setTestResults(prev => ({ ...prev, [slideId]: [] }));
    setConstraintResults(prev => ({ ...prev, [slideId]: [] }));
    setCodeRunOutput(prev => ({ ...prev, [block.id]: "" }));

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
      const results: any[] = [];
      let allLogs: string[] = [];

      // Специальная обработка для Java
      if (block.language === "java") {
        const codeToRun = buildJavaTestSuite(userCode, block.testCases, funcName);

        const res = await CodeService.executeCode({
          language: "java",
          code: codeToRun,
        });

        if (res.error) {
          setTestErrors(prev => ({ ...prev, [slideId]: `Ошибка выполнения: ${res.error}` }));

          return;
        }

        const output = res.output || "";
        const lines = output.split("\n");

        for (let i = 0; i < block.testCases.length; i++) {
          const testNum = i + 1;
          let inLogs = false;
          let inResult = false;
          let currentLogs: string[] = [];
          let currentResult: string[] = [];
          let testLogs: string[] = [];

          for (const line of lines) {
            if (line.includes(`===LOGS_START_${testNum}===`)) {
              inLogs = true;
              currentLogs = [];
              continue;
            }

            if (line.includes(`===LOGS_END_${testNum}===`)) {
              inLogs = false;

              if (currentLogs.length > 0) {
                testLogs.push(`📋 Логи теста #${testNum} (вход: ${block.testCases[i].input}):`);
                testLogs.push(currentLogs.join("\n"));
                testLogs.push("");
              }

              continue;
            }

            if (line.includes(`===RESULT_START_${testNum}===`)) {
              inResult = true;
              currentResult = [];
              continue;
            }

            if (line.includes(`===RESULT_END_${testNum}===`)) {
              inResult = false;

              if (currentResult.length > 0) {
                const actual = currentResult.join("\n").trim();
                const expected = block.testCases[i].expectedOutput.trim();

                let actualParsed: any;
                let expectedParsed: any;

                try {
                  actualParsed = JSON.parse(actual);
                } catch {
                  actualParsed = actual;
                }

                try {
                  expectedParsed = JSON.parse(expected);
                } catch {
                  expectedParsed = expected;
                }

                const passed = compareOutputs(actualParsed, expectedParsed);

                results.push({
                  input: block.testCases[i].input,
                  expected,
                  actual,
                  passed,
                });
              }

              continue;
            }

            if (inLogs) {
              currentLogs.push(line);
            } else if (inResult) {
              currentResult.push(line);
            }
          }

          if (testLogs.length > 0) {
            allLogs.push(...testLogs);
          }
        }
      }
      // Специальная обработка для C#
      else if (block.language === "csharp") {
        const codeToRun = buildCSharpTestSuite(userCode, block.testCases, funcName);

        const res = await CodeService.executeCode({
          language: "csharp",
          code: codeToRun,
        });

        if (res.error) {
          setTestErrors(prev => ({ ...prev, [slideId]: `Ошибка выполнения: ${res.error}` }));

          return;
        }

        const output = res.output || "";
        const lines = output.split("\n");

        for (let i = 0; i < block.testCases.length; i++) {
          const testNum = i + 1;
          let inLogs = false;
          let inResult = false;
          let currentLogs: string[] = [];
          let currentResult: string[] = [];
          let testLogs: string[] = [];

          for (const line of lines) {
            if (line.includes(`===LOGS_START_${testNum}===`)) {
              inLogs = true;
              currentLogs = [];
              continue;
            }

            if (line.includes(`===LOGS_END_${testNum}===`)) {
              inLogs = false;

              if (currentLogs.length > 0) {
                testLogs.push(`📋 Логи теста #${testNum} (вход: ${block.testCases[i].input}):`);
                testLogs.push(currentLogs.join("\n"));
                testLogs.push("");
              }

              continue;
            }

            if (line.includes(`===RESULT_START_${testNum}===`)) {
              inResult = true;
              currentResult = [];
              continue;
            }

            if (line.includes(`===RESULT_END_${testNum}===`)) {
              inResult = false;

              if (currentResult.length > 0) {
                const actual = currentResult.join("\n").trim();
                const expected = block.testCases[i].expectedOutput.trim();

                let actualParsed: any;
                let expectedParsed: any;

                try {
                  actualParsed = JSON.parse(actual);
                } catch {
                  actualParsed = actual;
                }

                try {
                  expectedParsed = JSON.parse(expected);
                } catch {
                  expectedParsed = expected;
                }

                const passed = compareOutputs(actualParsed, expectedParsed);

                results.push({
                  input: block.testCases[i].input,
                  expected,
                  actual,
                  passed,
                });
              }

              continue;
            }

            if (inLogs) {
              currentLogs.push(line);
            } else if (inResult) {
              currentResult.push(line);
            }
          }

          if (testLogs.length > 0) {
            allLogs.push(...testLogs);
          }
        }
      }
      // Для остальных языков
      else {
        for (const tc of block.testCases) {
          if (!tc.input || !tc.expectedOutput) {
            setTestErrors(prev => ({ ...prev, [slideId]: "Заполните все тест-кейсы" }));

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
            setTestErrors(prev => ({ ...prev, [slideId]: `Ошибка выполнения: ${res.error}` }));

            return;
          }

          const output = res.output || "";
          const lines = output.split("\n");

          let inLogs = false;
          let inResult = false;
          let currentLogs: string[] = [];
          let currentResult: string[] = [];

          for (const line of lines) {
            if (line.includes("===LOGS_START===")) {
              inLogs = true;
              currentLogs = [];
              continue;
            }

            if (line.includes("===LOGS_END===")) {
              inLogs = false;

              if (currentLogs.length > 0) {
                allLogs.push(`📋 Логи для входа "${tc.input}":`);
                allLogs.push(currentLogs.join("\n"));
                allLogs.push("");
              }

              continue;
            }

            if (line.includes("===RESULT_START===")) {
              inResult = true;
              currentResult = [];
              continue;
            }

            if (line.includes("===RESULT_END===")) {
              inResult = false;

              if (currentResult.length > 0) {
                const resultStr = currentResult.join("\n").trim();

                let actualParsed: any;
                let expectedParsed: any;

                try {
                  actualParsed = JSON.parse(resultStr);
                } catch {
                  actualParsed = resultStr;
                }

                try {
                  expectedParsed = JSON.parse(tc.expectedOutput);
                } catch {
                  expectedParsed = tc.expectedOutput;
                }

                const passed = compareOutputs(actualParsed, expectedParsed);

                results.push({
                  input: tc.input,
                  expected: tc.expectedOutput,
                  actual: resultStr,
                  passed,
                });
              }

              continue;
            }

            if (inLogs) {
              currentLogs.push(line);
            } else if (inResult) {
              currentResult.push(line);
            }
          }
        }
      }

      if (allLogs.length > 0) {
        setCodeRunOutput(prev => ({ ...prev, [block.id]: allLogs.join("\n") }));
      }

      setTestResults(prev => ({ ...prev, [slideId]: results }));

      const allPassed = results.every((r: any) => r.passed);

      if (allPassed) {
        // Можно показать уведомление
      } else {
        const failedCount = results.filter((r: any) => !r.passed).length;

        setTestErrors(prev => ({
          ...prev,
          [slideId]: `❌ Провалено тестов: ${failedCount} из ${results.length}`
        }));
      }

    } catch (error: any) {
      setTestErrors(prev => ({
        ...prev,
        [slideId]: `❌ Ошибка проверки: ${error.message}`
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

      <ResultsModal
        visible={resultsModalVisible}
        onClose={() => setResultsModalVisible(false)}
        results={lessonResults.results}
        totalTasks={lessonResults.totalTasks}
        completedTasks={lessonResults.completedTasks}
        totalTestCases={lessonResults.totalTestCases}
        passedTestCases={lessonResults.passedTestCases}
        constraintsPassed={lessonResults.constraintsPassed}
        slides={slides}
      />
    </SafeAreaView>
  );
};

export default Lesson;
