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
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "appStyles";
import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { styles } from "./styled";
import type { CodeLanguage, ArgumentSchema, TestCaseArgument, ConstraintResult } from "./types";
import type {
  CodeConstraintType,
  CodeExampleBlock,
  CodeTaskBlock,
  ImageBlock,
  Slide,
  SourceBlock,
  TableBlock,
  TextBlock,
  TheoryQuestionBlock,
} from "./types";

import CustomButton from "@/components/Button";
import CodeEditor from "@/components/CodeEditor";
import { LessonComments } from "@/components/LessonComments";
import { CodeService } from "@/http/codeService";
import { LessonDetailsService } from "@/http/lessonDetails";
import LessonResultService from "@/http/lessonResult";

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

// Функция для преобразования аргументов тест-кейса в строку для JavaScript/Python
const formatArgsForDynamicLang = (
  testCaseArgs: TestCaseArgument[] | undefined,
  argumentScheme: ArgumentSchema[],
  language: CodeLanguage
): string => {
  if (!testCaseArgs || !argumentScheme) return "";
  
  const cleanValue = (val: string) => {
    if ((val.startsWith('"') && val.endsWith('"')) || 
        (val.startsWith("'") && val.endsWith("'"))) {
      return val.slice(1, -1);
    }
    return val;
  };
  
  const args = testCaseArgs.map((arg, idx) => {
    const scheme = argumentScheme[idx];
    if (!scheme) return null;
    
    const cleanVal = cleanValue(arg.value);
    
    if (scheme.type === "string") {
      return `"${cleanVal}"`;
    }
    if (scheme.type === "number") {
      return cleanVal;
    }
    if (scheme.type === "char") {
      return `'${cleanVal}'`;
    }
    if (scheme.type === "boolean") {
      if (language === "python") {
        return cleanVal.toLowerCase() === "true" ? "True" : "False";
      }
      return cleanVal.toLowerCase() === "true" ? "true" : "false";
    }
    if (scheme.type === "object") {
      return arg.value || "{}";
    }
    if (scheme.type && scheme.type.startsWith("array_")) {
      const elementType = scheme.type.replace("array_", "");
      
      if (arg.value && arg.value.trim().startsWith("[")) {
        try {
          const arr = JSON.parse(arg.value);
          if (Array.isArray(arr)) {
            const formatted = arr.map((item: any) => {
              if (elementType === "string") return `"${item}"`;
              if (elementType === "boolean") {
                if (language === "python") return item ? "True" : "False";
                return item ? "true" : "false";
              }
              return String(item);
            });
            return `[${formatted.join(", ")}]`;
          }
        } catch {
          // Not valid JSON
        }
      }
      return arg.value;
    }
    if (scheme.type === "array" || scheme.type === "list") {
      if (arg.value && arg.value.trim().startsWith("[")) {
        try {
          const arr = JSON.parse(arg.value);
          if (Array.isArray(arr)) {
            const formatted = arr.map(item => {
              if (scheme.arrayElementType === "string") return `"${item}"`;
              if (scheme.arrayElementType === "boolean") {
                if (language === "python") return item ? "True" : "False";
                return item ? "true" : "false";
              }
              return String(item);
            });
            return `[${formatted.join(", ")}]`;
          }
        } catch {
          // Not valid JSON
        }
      }
      return arg.value;
    }
    
    return arg.value;
  }).filter(Boolean);
  
  return args.join(", ");
};

// Функция для преобразования аргументов тест-кейса в строку для Java/C#
const formatArgsForJavaOrCSharp = (
  testCaseArgs: TestCaseArgument[] | undefined,
  argumentScheme: ArgumentSchema[],
  language: CodeLanguage
): string => {
  if (!testCaseArgs || !argumentScheme) return "";
  
  const cleanValue = (val: string) => {
    if ((val.startsWith('"') && val.endsWith('"')) || 
        (val.startsWith("'") && val.endsWith("'"))) {
      return val.slice(1, -1);
    }
    return val;
  };
  
  const args = testCaseArgs.map((arg, idx) => {
    const scheme = argumentScheme[idx];
    if (!scheme) return null;
    
    const cleanVal = cleanValue(arg.value);
    
    if (scheme.type === "string") {
      return `"${cleanVal}"`;
    }
    if (scheme.type === "char") {
      return `'${cleanVal}'`;
    }
    if (scheme.type === "boolean") {
      return cleanVal.toLowerCase() === "true" ? "true" : "false";
    }
    if (scheme.type === "object" && scheme.objectFields) {
      const objValues = arg.objectValues ?? {};
      const fields = scheme.objectFields.map(f => {
        const val = cleanValue(objValues[f.name] ?? "");
        if (f.type === "string") {
          return `"${val}"`;
        } else if (f.type === "boolean") {
          return val.toLowerCase() === "true" ? "true" : "false";
        } else if (f.type === "double" || f.type === "float") {
          return val;
        } else if (f.type === "char") {
          return `'${val}'`;
        } else {
          return val;
        }
      });
      
      if (language === "java") {
        const className = scheme.className || scheme.name.charAt(0).toUpperCase() + scheme.name.slice(1);
        return `new ${className}(${fields.join(", ")})`;
      } else if (language === "csharp") {
        const className = scheme.className || scheme.name.charAt(0).toUpperCase() + scheme.name.slice(1);
        return `new ${className}(${fields.join(", ")})`;
      }
      return `{${fields.join(", ")}}`;
    }
    if (scheme.type && scheme.type.startsWith("array_")) {
      const elementType = scheme.type.replace("array_", "");
      const typeToUse = elementType === "string" ? "String" : elementType;
      
      if (arg.value && arg.value.trim().startsWith("[")) {
        try {
          const arr = JSON.parse(arg.value);
          if (Array.isArray(arr)) {
            const formatted = arr.map((item: any) => {
              if (elementType === "string") return `"${item}"`;
              if (elementType === "boolean") return item ? "true" : "false";
              return String(item);
            });
            if (language === "java") {
              return `new ${typeToUse}[] { ${formatted.join(", ")} }`;
            }
            return `new ${typeToUse}[] { ${formatted.join(", ")} }`;
          }
        } catch {
          // Not valid JSON
        }
      }
      return `new ${typeToUse}[0]`;
    }
    if (scheme.type === "array" || scheme.type === "list") {
      const arrayElementType = scheme.arrayElementType ?? "int";
      
      if (arg.value && arg.value.trim().startsWith("[")) {
        try {
          const arr = JSON.parse(arg.value);
          if (Array.isArray(arr)) {
            const formatted = arr.map(item => {
              if (arrayElementType === "string") return `"${item}"`;
              if (arrayElementType === "boolean") return item ? "true" : "false";
              return String(item);
            });
            return `new ${arrayElementType === "string" ? "String" : arrayElementType}[] { ${formatted.join(", ")} }`;
          }
        } catch {
          // Not valid JSON
        }
      }
      return arg.value;
    }
    
    return arg.value;
  }).filter(Boolean);
  
  return args.join(", ");
};

// Функция для получения входных данных для отображения
const getDisplayInput = (
  testCase: { input?: string; args?: TestCaseArgument[] } | undefined,
  argumentScheme: ArgumentSchema[] | undefined,
  language: CodeLanguage | undefined
): string => {
  if (!testCase) return "";
  
  // Если есть аргументы в новом формате - используем их
  if (testCase.args && argumentScheme && argumentScheme.length > 0) {
    const lang = language || "javascript";
    // Для Java и C# используем соответствующую функцию форматирования
    if (lang === "java" || lang === "csharp") {
      return formatArgsForJavaOrCSharp(testCase.args, argumentScheme, lang);
    }
    // Для JS и Python используем другую функцию
    return formatArgsForDynamicLang(testCase.args, argumentScheme, lang);
  }
  
  // Иначе используем старый формат
  return testCase.input || "";
};

// Функция для генерации классов объектов для C#/Java
const generateObjectClasses = (args: ArgumentSchema[], language: CodeLanguage): string => {
  const objectArgs = args.filter((a) => a.type === "object" && a.objectFields);
  
  const arrayObjectArgs = args.filter(
    (a) => (a.type === "array" || a.type === "list") && 
           a.arrayElementType === "object" && 
           a.arrayElementObjectFields
  );
  
  const allClasses = [...objectArgs, ...arrayObjectArgs];
  
  if (allClasses.length === 0) return "";

  return allClasses
    .map((arg) => {
      let className: string;
      const objectFields = arg.objectFields ?? arg.arrayElementObjectFields ?? [];
      
      if (arg.objectFields) {
        className = arg.className || arg.name.charAt(0).toUpperCase() + arg.name.slice(1);
      } else if (arg.arrayElementObjectFields) {
        className = arg.arrayElementClassName || arg.name.charAt(0).toUpperCase() + arg.name.slice(1);
      } else {
        className = arg.className || arg.name.charAt(0).toUpperCase() + arg.name.slice(1);
      }

      if (language === "csharp") {
        const fields = objectFields.map((f) => `        public ${getCSharpType(f.type)} ${f.name};`).join("\n");
        const constructorParams = objectFields.map(f => `${getCSharpType(f.type)} ${f.name}`).join(", ");
        const constructorBody = objectFields.map(f => `this.${f.name} = ${f.name};`).join("\n        ");
        const constructor = objectFields.length > 0 ? `
    public ${className}(${constructorParams}) {
        ${constructorBody}
    }` : "";
        const gettersSetters = objectFields
          .map((f) => {
            const fieldName = f.name;
            const fieldType = getCSharpType(f.type);
            return `
    public ${fieldType} get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}() {
        return ${fieldName};
    }
    public void set${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}(${fieldType} ${fieldName}) {
        this.${fieldName} = ${fieldName};
    }`;
          })
          .join("");
        return `public class ${className} {
${fields.replace(/        /g, "    ")}
${constructor.replace(/        /g, "    ")}
${gettersSetters}
}`;
      }
      if (language === "java") {
        const fields = objectFields.map((f) => `        private ${getJavaType(f.type)} ${f.name};`).join("\n");
        const constructorParams = objectFields.map(f => `${getJavaType(f.type)} ${f.name}`).join(", ");
        const constructorBody = objectFields.map(f => `this.${f.name} = ${f.name};`).join("\n        ");
        const constructor = objectFields.length > 0 ? `
    public ${className}(${constructorParams}) {
        ${constructorBody}
    }` : "";
        const gettersSetters = objectFields
          .map((f) => {
            const fieldName = f.name;
            const fieldType = getJavaType(f.type);
            return `
    public ${fieldType} get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}() {
        return ${fieldName};
    }
    public void set${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}(${fieldType} ${fieldName}) {
        this.${fieldName} = ${fieldName};
    }`;
          })
          .join("");
        return `    class ${className} {
${fields}
${constructor}
${gettersSetters}
    }`;
      }
      return "";
    })
    .join("\n\n");
};

// Вспомогательные функции для получения типов
const getCSharpType = (type: string): string => {
  const typeMap: Record<string, string> = {
    int: "int",
    string: "string",
    number: "int",
    boolean: "bool",
    double: "double",
    float: "float",
    long: "long",
    char: "char",
    byte: "byte",
    short: "short",
    object: "object",
    array: "object[]",
    list: "List<object>",
  };
  return typeMap[type] || "object";
};

const getJavaType = (type: string): string => {
  const typeMap: Record<string, string> = {
    int: "int",
    string: "String",
    number: "int",
    boolean: "boolean",
    double: "double",
    float: "float",
    long: "long",
    char: "char",
    byte: "byte",
    short: "short",
    object: "Object",
    array: "Object[]",
    list: "List<Object>",
  };
  return typeMap[type] || "Object";
};

// Функция для отображения описаний классов объектов (как в EditLesson)
const generateObjectClassesForPreview = (args: ArgumentSchema[], language: CodeLanguage): string => {
  const objectArgs = args.filter((a) => a.type === "object" && a.objectFields);
  if (objectArgs.length === 0) return "";

  return objectArgs
    .map((arg) => {
      const className = arg.className || arg.name.charAt(0).toUpperCase() + arg.name.slice(1);
      const objectFields = arg.objectFields ?? [];

      if (language === "java") {
        const fields = objectFields
          ?.map((f) => `    private ${getJavaType(f.type)} ${f.name};`)
          .join("\n");
        const constructorParams = objectFields.map(f => `${getJavaType(f.type)} ${f.name}`).join(", ");
        const constructorBody = objectFields.map(f => `this.${f.name} = ${f.name};`).join("\n        ");
        const constructor = objectFields.length > 0 ? `
    public ${className}(${constructorParams}) {
        ${constructorBody}
    }` : "";
        const gettersSetters = objectFields
          ?.map((f) => {
            const fieldName = f.name;
            const fieldType = getJavaType(f.type);
            return `
    public ${fieldType} get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}() {
        return ${fieldName};
    }
    public void set${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}(${fieldType} ${fieldName}) {
        this.${fieldName} = ${fieldName};
    }`;
          })
          .join("");
        return `class ${className} {
${fields}
${constructor}
${gettersSetters}
}`;
      }
      if (language === "csharp") {
        const fields = objectFields
          ?.map((f) => `    private ${getCSharpType(f.type)} ${f.name};`)
          .join("\n");
        const constructorParams = objectFields.map(f => `${getCSharpType(f.type)} ${f.name}`).join(", ");
        const constructorBody = objectFields.map(f => `this.${f.name} = ${f.name};`).join("\n        ");
        const constructor = objectFields.length > 0 ? `
    public ${className}(${constructorParams}) {
        ${constructorBody}
    }` : "";
        const gettersSetters = objectFields
          ?.map((f) => {
            const fieldName = f.name;
            const fieldType = getCSharpType(f.type);
            return `
    public ${fieldType} get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}() {
        return ${fieldName};
    }
    public void set${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}(${fieldType} ${fieldName}) {
        this.${fieldName} = ${fieldName};
    }`;
          })
          .join("");
        return `public class ${className} {
${fields}
${constructor}
${gettersSetters}
}`;
      }
      return "";
    })
    .join("\n\n");
};

// Функция для получения описания типа аргумента
const getArgumentTypeDescription = (arg: ArgumentSchema): string => {
  if (arg.type === "object" && arg.objectFields) {
    const className = arg.className || arg.name.charAt(0).toUpperCase() + arg.name.slice(1);
    const fields = arg.objectFields.map(f => `${getJavaType(f.type)} ${f.name}`).join(", ");
    return `${className} (${fields})`;
  }
  if (arg.type && arg.type.startsWith("array_")) {
    const elementType = arg.type.replace("array_", "");
    return `${elementType}[]`;
  }
  if (arg.type === "array" || arg.type === "list") {
    if (arg.arrayElementType === "object" && arg.arrayElementObjectFields) {
      const className = arg.arrayElementClassName || arg.name.charAt(0).toUpperCase() + arg.name.slice(1);
      const fields = arg.arrayElementObjectFields.map(f => `${getJavaType(f.type)} ${f.name}`).join(", ");
      return `${className}[] (${fields})`;
    }
    return `${arg.arrayElementType || "object"}[]`;
  }
  return arg.type || "unknown";
};

// Функция для отображения схемы аргументов в читаемом виде
const renderArgumentScheme = (args: ArgumentSchema[], language: CodeLanguage): string => {
  if (!args || args.length === 0) return "";
  
  return args.map((arg, idx) => {
    const typeDesc = getArgumentTypeDescription(arg);
    return `${idx + 1}. ${arg.name}: ${typeDesc}`;
  }).join("\n");
};

// Функция для удаления main метода из кода (нужно для отображения)
const stripMainMethod = (code: string, language: CodeLanguage): string => {
  if (language === "java") {
    return code
      .replace(/public\s+static\s+void\s+main\s*\(String\[\]\s*args\)\s*\{[\s\S]*?\}\s*\n?/g, "")
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      .trim();
  }
  if (language === "csharp") {
    return code
      .replace(/public\s+static\s+void\s+Main\s*\(string\[\]\s*args\)\s*\{[\s\S]*?\}\s*\n?/g, "")
      .trim();
  }
  return code;
};

// Исправленный addJavaMainMethod для Java с поддержкой логов
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
      // Используем напрямую input без парсинса (как в десктопной версии)
      const argsStr = tc.input || "";

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
      // Используем напрямую input без парсинга (как в десктопной версии)
      const argsStr = tc.input || "";

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
  funcName: string | null,
  preformattedArgs?: string // Для JS/Python с аргументами из схемы
): string => {
  if (!funcName) return userCode;

  // Если переданы предварительно отформатированные аргументы - используем их
  const argsStr = preformattedArgs ?? (() => {
    const args = parseArguments(input);
    return formatArgumentsForCode(args);
  })();

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

// Вспомогательные функции для проверки ограничений
const countCodeLines = (code: string): number => {
  return code.split("\n").filter(line => line.trim().length > 0).length;
};

const hasComments = (code: string): boolean => {
  const singleLineComment = /\/\/.*$/m;
  const multiLineComment = /\/\*[\s\S]*?\*\//;
  const pythonComment = /#.*$/m;
  
  return singleLineComment.test(code) || multiLineComment.test(code) || pythonComment.test(code);
};

const hasConsoleLog = (code: string): boolean => {
  return /console\.(log|error|warn|info)/.test(code) || /print\s*\(/.test(code);
};

const hasRequiredKeywords = (code: string, keywords: string[]): boolean => {
  return keywords.every(keyword => code.toLowerCase().includes(keyword.toLowerCase()));
};

const calculateComplexity = (code: string): number => {
  let complexity = 1;
  const patterns = [
    /\bif\s*\(/,
    /\belse\s+if\s*\(/,
    /\bfor\s*\(/,
    /\bwhile\s*\(/,
    /\bswitch\s*\(/,
    /\bcase\s+/,
    /\bcatch\s*\(/,
    /\&\&/,
    /\|\|/,
    /\?\s*[^?]+\s*:/,
  ];
  
  patterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  });
  
  return complexity;
};

// Функция проверки ограничений
const checkConstraints = (
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
          name: "🚫 Запрещённые слова",
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
          name: "💬 Без комментариев",
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
          name: "📢 Без отладочного вывода",
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
          name: "🔄 Цикломатическая сложность",
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
          name: "💾 Использование памяти",
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
          name: "🔑 Обязательные ключевые слова",
          passed,
          expected: keywords.join(", "),
          actual: passed ? "все присутствуют" : "не все присутствуют",
        });
        break;
      }

      case "maxTimeMs": {
        results.push({
          type: "maxTimeMs",
          name: "⏱️ Время выполнения",
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
        <Text> * Этот код можно запустить</Text>
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

// Компонент для отображения описания классов объектов (для Java/C#)
const ObjectDescriptions = ({ argumentScheme, language }: { argumentScheme?: ArgumentSchema[]; language?: CodeLanguage }) => {
  if (!argumentScheme || argumentScheme.length === 0) return null;
  if (language !== "java" && language !== "csharp") return null;
  
  const hasObjects = argumentScheme.some(a => a.type === "object" && a.objectFields);
  if (!hasObjects) return null;

  return (
    <View style={styles.objectDescriptions}>
      <Text style={styles.objectDescriptionsTitle}>Описание классов:</Text>
      <ScrollView style={styles.objectCodeScroll} horizontal>
        <Text style={styles.objectCodeText}>
          {generateObjectClassesForPreview(argumentScheme, language)}
        </Text>
      </ScrollView>
    </View>
  );
};

// Компонент для отображения ограничений до запуска проверки
const ConstraintsInfo = ({ constraints }: { constraints?: CodeTaskBlock['constraints'] }) => {
  const [expanded, setExpanded] = useState(false);

  if (!constraints || constraints.length === 0) return null;

  const getConstraintDescription = (constraint: { type: CodeConstraintType; value: number | string[] | boolean }) => {
    switch (constraint.type) {
      case "maxLines":
        return `📏 Максимум строк кода: ${constraint.value}`;
      case "forbiddenTokens":
        return `🚫 Запрещённые слова: ${(constraint.value as string[]).join(", ")}`;
      case "noComments":
        return `💬 Без комментариев`;
      case "noConsoleLog":
        return `📢 Без отладочного вывода (console.log/print)`;
      case "maxComplexity":
        return `🔄 Максимальная сложность: ${constraint.value}`;
      case "memoryLimit":
        return `💾 Лимит памяти: ${constraint.value} МБ`;
      case "requiredKeywords":
        return `🔑 Обязательные ключевые слова: ${(constraint.value as string[]).join(", ")}`;
      case "maxTimeMs":
        return `⏱️ Максимальное время: ${constraint.value} мс`;
      default:
        return `${constraint.type}: ${constraint.value}`;
    }
  };

  return (
    <View style={styles.constraintsInfo}>
      <TouchableOpacity 
        style={styles.constraintsHeader} 
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.constraintsTitle}>🎯 Ограничения ({constraints.length})</Text>
        <Text style={styles.constraintsToggle}>{expanded ? "▼ Скрыть" : "▶ Показать"}</Text>
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.constraintsList}>
          {constraints.map((constraint, index) => (
            <Text key={index} style={styles.constraintItem}>
              {getConstraintDescription(constraint)}
            </Text>
          ))}
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
  constraintResults?: ConstraintResult[];
  testError?: string;
}) => {
  return (
    <View style={styles.codeTaskBlock}>
      {block.description && (
        <Text style={styles.taskDescription}>{block.description}</Text>
      )}

      {block.argumentScheme && block.argumentScheme.length > 0 && (
        <View style={styles.argumentSchemeInfo}>
          <Text style={styles.argumentSchemeTitle}>📋 Аргументы функции:</Text>
          <Text style={styles.argumentSchemeText}>
            {renderArgumentScheme(block.argumentScheme, block.language)}
          </Text>
        </View>
      )}

      <ObjectDescriptions 
        argumentScheme={block.argumentScheme} 
        language={block.language} 
      />

      <ConstraintsInfo constraints={block.constraints} />

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

// Модальное окно для источников
const SourcesModal = ({ visible, onClose, sources }: {
  visible: boolean;
  onClose: () => void;
  sources: { url: string; note?: string }[]
}) => {
  const handleOpenUrl = async (url: string) => {
    try {
      const { Linking } = await import('react-native');
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Ошибка', `Не удалось открыть ссылку: ${url}`);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось открыть ссылку');
    }
  };

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
                  <TouchableOpacity
                    onPress={() => handleOpenUrl(source.url)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sourceUrl}>🔗 {source.url}</Text>
                  </TouchableOpacity>
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
  slides,
  earnedStars,
  onRetrySave
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
  earnedStars: number;
  onRetrySave?: () => void;
}) => {
  const [stars, setStars] = useState(0);
  const [showStars, setShowStars] = useState(false);
  const [saveError, setSaveError] = useState(false);

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
      setSaveError(false);
      setStars(earnedStars);

      // Запускаем анимацию звезд
      const animateStars = async () => {
        setShowStars(true);

        for (let i = 0; i < earnedStars; i++) {
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
  }, [visible, earnedStars]);

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

          {saveError && onRetrySave && (
            <View>
              <Text>
                Не удалось сохранить результат
              </Text>
              <TouchableOpacity onPress={onRetrySave}>
                <Text>Повторить</Text>
              </TouchableOpacity>
            </View>
          )}

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
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sourcesModalVisible, setSourcesModalVisible] = useState(false);
  const [currentSources, setCurrentSources] = useState<{ url: string; note?: string }[]>([]);
  const [resultsModalVisible, setResultsModalVisible] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  const [lessonResults, setLessonResults] = useState<{
    results: any[];
    totalTasks: number;
    completedTasks: number;
    totalTestCases: number;
    passedTestCases: number;
    constraintsPassed: boolean;
    stars: number;
  }>({
    results: [],
    totalTasks: 0,
    completedTasks: 0,
    totalTestCases: 0,
    passedTestCases: 0,
    constraintsPassed: true,
    stars: 0,
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
  
  // Состояние для отслеживания ответов на теоретические вопросы
  const [theoryAnswers, setTheoryAnswers] = useState<{
    [slideId: string]: {
      [blockId: string]: {
        selectedIndex: number;
        isCorrect: boolean;
      }
    }
  }>({});

  const [lessonDetailsId, setLessonDetailsId] = useState<string | null>(null);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);

  useEffect(() => {
    void loadLessonDetails();
    void getClientId();
  }, [id]);

  const getClientId = async () => {
    try {
      const id = await AsyncStorage.getItem("clientId");
      setClientId(id);
    } catch (error) {
      console.error("Failed to get clientId:", error);
    }
  };

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
        // Set lessonDetailsId from the lesson details
        if (data.id) {
          setLessonDetailsId(data.id);
          console.log("📝 LessonDetailsId set to:", data.id);
        } else {
          console.log("⚠️ No lessonDetails id found in response");
        }
      }
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenComments = useCallback(() => {
    console.log("🔓 Opening comments modal");
    console.log("🔓 lessonDetailsId value:", lessonDetailsId);
    setCommentsModalVisible(true);
  }, [lessonDetailsId]);

  const saveLessonResult = useCallback(async (stars: number) => {
    const auditoryId = await AsyncStorage.getItem('userId');
    console.log("Saving result:", { auditoryId, lessonId: id, stars });

    if (!auditoryId || !id) {
      console.log("Cannot save result: missing userId or lessonId");
      return false;
    }
    try {
      await LessonResultService.createLessonResult({
        clientId: auditoryId,
        lessonId: id,
        countOfStars: stars,
        completedAt: new Date().toISOString(),
      });
      console.log(`✅ Lesson result saved with ${stars} stars`);
      return true;
    } catch (error) {
      console.error("Failed to save lesson result:", error);
      return false;
    }
  }, [id]);

  // Функция для обновления ответа на теоретический вопрос
  const handleTheoryAnswer = useCallback((slideId: string, blockId: string, selectedIndex: number, isCorrect: boolean) => {
    setTheoryAnswers(prev => ({
      ...prev,
      [slideId]: {
        ...prev[slideId],
        [blockId]: {
          selectedIndex,
          isCorrect
        }
      }
    }));
  }, []);

  // ИСПРАВЛЕННАЯ функция calculateResults с новой логикой звезд
  const calculateResults = useCallback(async () => {
    const testSlides = slides.filter((s) => s.type === "test");
    const results: any[] = [];
    
    // Счетчики для разных типов заданий
    let totalCodeTasks = 0;
    let passedCodeTasks = 0;
    let totalTheoryQuestions = 0;
    let correctTheoryAnswers = 0;
    let allConstraintsPassed = true;

    testSlides.forEach((slide) => {
      const slideTestResult = testResults[slide.id];
      const slideConstraintResult = constraintResults[slide.id];

      const codeTasks = slide.blocks.filter((b) => b.type === "codeTask") as CodeTaskBlock[];
      const theoryQuestions = slide.blocks.filter(
        (b) => b.type === "theoryQuestion"
      ) as TheoryQuestionBlock[];

      // Проверяем код-задачи
      let slideCodePassed = true;
      let slideTestCasesPassed = 0;
      let slideTestCasesTotal = 0;

      if (codeTasks.length > 0) {
        totalCodeTasks += codeTasks.length;
        
        if (slideTestResult) {
          slideTestCasesPassed = slideTestResult.filter(r => r.passed).length || 0;
          slideTestCasesTotal = slideTestResult.length || 0;
          
          // Код-задача считается пройденной, если все тест-кейсы пройдены
          slideCodePassed = slideTestCasesPassed === slideTestCasesTotal && slideTestCasesTotal > 0;
          
          if (slideCodePassed) {
            passedCodeTasks++;
          }
        }
      }
      
      // Проверяем теоретические вопросы
      if (theoryQuestions.length > 0) {
        totalTheoryQuestions += theoryQuestions.length;
        
        const slideTheoryAnswers = theoryAnswers[slide.id] || {};
        
        theoryQuestions.forEach((question) => {
          const answer = slideTheoryAnswers[question.id];
          if (answer?.isCorrect) {
            correctTheoryAnswers++;
          }
        });
      }

      // Проверяем ограничения
      if (slideConstraintResult) {
        const slideConstraintsPassed = slideConstraintResult.every(c => c.passed);
        allConstraintsPassed = allConstraintsPassed && slideConstraintsPassed;
      }

      results.push({
        slideId: slide.id,
        title: slide.title,
        passed: (codeTasks.length === 0 || slideCodePassed) && 
                (theoryQuestions.length === 0 || (theoryQuestions.length > 0 && 
                 theoryQuestions.every(q => theoryAnswers[slide.id]?.[q.id]?.isCorrect))),
        testCasesPassed: slideTestCasesPassed,
        testCasesTotal: slideTestCasesTotal,
        constraintsPassed: slideConstraintResult ? slideConstraintResult.every(c => c.passed) : true,
      });
    });

    // Расчет процента выполнения
    const totalTasks = totalCodeTasks + totalTheoryQuestions;
    const completedTasks = passedCodeTasks + correctTheoryAnswers;
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Проверяем, все ли кодовые задачи решены правильно (все тест-кейсы пройдены)
    const allCodeTasksPassed = totalCodeTasks === 0 || passedCodeTasks === totalCodeTasks;

    let stars = 0;

    // НОВАЯ ЛОГИКА РАСЧЕТА ЗВЕЗД:
    // 0 звезд - все неправильно ИЛИ кодовые задачи решены не полностью (не все тест-кейсы пройдены)
    if (!allCodeTasksPassed) {
      stars = 0;
    }
    // 1 звезда - теоретических вопросов и задач решено меньше 50% (при условии, что все кодовые задачи решены правильно)
    else if (completionPercentage < 50) {
      stars = 1;
    }
    // 2 звезды - решено больше 50% (и все тест-кейсы в кодовых задачах решены верно)
    else if (completionPercentage >= 50 && completionPercentage < 100) {
      stars = 2;
    }
    // 3 звезды - все верно и в кодовых задачах все ограничения учтены
    else if (completionPercentage === 100 && allConstraintsPassed) {
      stars = 3;
    }
    // 2 звезды - все верно, но ограничения не соблюдены
    else if (completionPercentage === 100 && !allConstraintsPassed) {
      stars = 2;
    }

    console.log("📊 Results calculation:", {
      totalCodeTasks,
      passedCodeTasks,
      totalTheoryQuestions,
      correctTheoryAnswers,
      totalTasks,
      completedTasks,
      completionPercentage,
      allCodeTasksPassed,
      allConstraintsPassed,
      stars
    });

    setLessonResults({
      results,
      totalTasks,
      completedTasks,
      totalTestCases: Object.values(testResults).reduce((acc, curr) => acc + curr.length, 0),
      passedTestCases: Object.values(testResults).reduce((acc, curr) => acc + curr.filter(r => r.passed).length, 0),
      constraintsPassed: allConstraintsPassed,
      stars,
    });

    // Сохраняем результат
    await saveLessonResult(stars);

    setResultsModalVisible(true);
  }, [slides, testResults, constraintResults, theoryAnswers, saveLessonResult]);

  const retrySaveResult = useCallback(async () => {
    const auditoryId = await AsyncStorage.getItem('userId');
    if (!auditoryId || !id || lessonResults.stars === undefined) return;
    
    try {
      await LessonResultService.createLessonResult({
        clientId: auditoryId,
        lessonId: id,
        countOfStars: lessonResults.stars,
        completedAt: new Date().toISOString(),
      });
      Alert.alert("Успех", "Результат сохранен");
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось сохранить результат");
    }
  }, [id, lessonResults.stars]);

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
      let codeToRun = code;

      // Для Java добавляем main метод с тестовым вводом (как в превью EditLesson)
      if (language === "java") {
        const funcName = extractFunctionName(code, language);
        if (funcName) {
          codeToRun = addJavaMainMethod(code, funcName, "5");
        }
      }

      const res = await CodeService.executeCode({ language, code: codeToRun });
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
      // Форматируем тест-кейсы с учетом схемы аргументов
      const formattedTestCases = (block.testCases ?? []).map(tc => {
        const argsInput = formatArgsForJavaOrCSharp(tc.args, block.argumentScheme ?? [], "java");
        return {
          input: argsInput || tc.input || "",
          expectedOutput: tc.expectedOutput
        };
      });
      
      const codeWithTests = buildJavaTestSuite(userCode, formattedTestCases, funcName);
      // Добавляем определения классов для объектов в аргументах
      const objectClasses = generateObjectClasses(block.argumentScheme ?? [], "java");
      const codeToRun = objectClasses 
        ? `${codeWithTests}\n\n${objectClasses}` 
        : codeWithTests;

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
                testLogs.push(`📋 Логи теста #${testNum} (вход: ${getDisplayInput(block.testCases[i], block.argumentScheme, block.language)}):`);
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
                  input: getDisplayInput(block.testCases[i], block.argumentScheme, block.language),
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
        // Форматируем тест-кейсы с учетом схемы аргументов
        const formattedTestCases = (block.testCases ?? []).map(tc => {
          const argsInput = formatArgsForJavaOrCSharp(tc.args, block.argumentScheme ?? [], "csharp");
          return {
            input: argsInput || tc.input || "",
            expectedOutput: tc.expectedOutput
          };
        });
        
        const codeWithTests = buildCSharpTestSuite(userCode, formattedTestCases, funcName);
        // Добавляем определения классов для объектов в аргументах
        const objectClasses = generateObjectClasses(block.argumentScheme ?? [], "csharp");
        const codeToRun = objectClasses 
          ? `${codeWithTests}\n\n${objectClasses}` 
          : codeWithTests;

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
                testLogs.push(`📋 Логи теста #${testNum} (вход: ${getDisplayInput(block.testCases[i], block.argumentScheme, block.language)}):`);
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
                  input: getDisplayInput(block.testCases[i], block.argumentScheme, block.language),
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
      // Для JavaScript и Python используем схему аргументов
      else if (block.language === "javascript" || block.language === "python") {
        const lang = block.language;
        
        for (let i = 0; i < block.testCases.length; i++) {
          const tc = block.testCases[i];
          
          // Форматируем аргументы с использованием схемы
          const argsInput = formatArgsForDynamicLang(tc.args, block.argumentScheme ?? [], lang);
          
          // Если есть аргументы в схеме, используем их, иначе используем старый input
          const inputToUse = (block.argumentScheme?.length ?? 0) > 0 ? argsInput : (tc.input || "");
          
          if (!inputToUse || !tc.expectedOutput) {
            setTestErrors(prev => ({ ...prev, [slideId]: "Заполните все тест-кейсы (входные данные и ожидаемый вывод)" }));
            return;
          }

          // Для JS/Python передаём предварительно отформатированные аргументы
          const codeToRun = buildTestCode(
            userCode,
            "",
            lang,
            funcName,
            inputToUse
          );

          const res = await CodeService.executeCode({
            language: lang,
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
          let testLogs: string[] = [];
          const testNum = i + 1;

          for (const line of lines) {
            if (line.includes("===LOGS_START===")) {
              inLogs = true;
              currentLogs = [];
              continue;
            }
            if (line.includes("===LOGS_END===")) {
              inLogs = false;
              if (currentLogs.length > 0) {
                testLogs.push(`📋 Логи теста #${testNum} (вход: ${getDisplayInput(tc, block.argumentScheme, block.language)}):`);
                testLogs.push(currentLogs.join("\n"));
                testLogs.push("");
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
                const actual = currentResult.join("\n").trim();
                const expected = tc.expectedOutput.trim();

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
                  input: getDisplayInput(tc, block.argumentScheme, block.language),
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
      // Для остальных языков (C#, Golang, старый формат)
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
                  input: getDisplayInput(tc, block.argumentScheme, block.language),
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

      // Проверяем ограничения
      const constraintCheckResults = checkConstraints(userCode, block.constraints);
      setConstraintResults(prev => ({ ...prev, [slideId]: constraintCheckResults }));

      const allPassed = results.every((r: any) => r.passed);
      const allConstraintsPassed = constraintCheckResults.every((c) => c.passed);

      if (allPassed && allConstraintsPassed) {
        // Все тесты и ограничения пройдены
      } else {
        const failedCount = results.filter((r: any) => !r.passed).length;
        const failedConstraints = constraintCheckResults.filter((c) => !c.passed);
        
        let errorMessage = "";
        
        if (failedCount > 0) {
          errorMessage += `❌ Провалено тестов: ${failedCount} из ${results.length}`;
        }
        
        if (failedConstraints.length > 0) {
          if (errorMessage) errorMessage += "\n\n";
          errorMessage += `❌ Не пройдены ограничения:\n`;
          errorMessage += failedConstraints.map(c => `- ${c.name}: ${c.actual}`).join("\n");
        }

        if (errorMessage) {
          setTestErrors(prev => ({
            ...prev,
            [slideId]: errorMessage
          }));
        }
      }

    } catch (error: any) {
      setTestErrors(prev => ({
        ...prev,
        [slideId]: `❌ Ошибка проверки: ${error.message}`
      }));
    }
  }, [testAnswers]);

  // Компонент для теоретического вопроса с передачей ответа наверх
  const TheoryQuestionBlockViewWithHandler = ({ block, slideId }: { block: TheoryQuestionBlock; slideId: string }) => {
    const [selected, setSelected] = useState<number | undefined>(
      theoryAnswers[slideId]?.[block.id]?.selectedIndex
    );
    const [showResult, setShowResult] = useState(false);

    const handleSubmit = () => {
      if (selected === undefined) return;
      
      const isCorrect = selected === block.correctIndex;
      setShowResult(true);
      
      // Передаем ответ в родительский компонент
      handleTheoryAnswer(slideId, block.id, selected, isCorrect);
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
          <View style={{ flexDirection: 'row' }}>
            {slideSources.length > 0 && (
              <TouchableOpacity
                style={styles.sourcesButton}
                onPress={() => openSourcesModal(slideSources)}
                activeOpacity={0.7}
              >
                <Text style={styles.sourcesButtonText}>📚 Источники</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.commentsButton}
              onPress={handleOpenComments}
              activeOpacity={0.7}
            >
              <Text style={styles.commentsButtonText}>💬 Комментарии</Text>
            </TouchableOpacity>
          </View>
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
              return (
                <TheoryQuestionBlockViewWithHandler
                  key={block.id}
                  block={block}
                  slideId={currentSlide.id}
                />
              );

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
        onClose={() => {
          setResultsModalVisible(false);
          navigation.goBack();
        }}
        results={lessonResults.results}
        totalTasks={lessonResults.totalTasks}
        completedTasks={lessonResults.completedTasks}
        totalTestCases={lessonResults.totalTestCases}
        passedTestCases={lessonResults.passedTestCases}
        constraintsPassed={lessonResults.constraintsPassed}
        slides={slides}
        earnedStars={lessonResults.stars}
        onRetrySave={retrySaveResult}
      />

      <LessonComments
        visible={commentsModalVisible}
        lessonDetailsId={lessonDetailsId}
        onClose={() => setCommentsModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default Lesson;