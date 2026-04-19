import type { ArgumentSchema, CodeLanguage, TestCaseArgument } from "@/components/Lesson/types";

const stripWrappingQuotes = (value: string): string => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith("`") && value.endsWith("`"))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

const escapeDoubleQuoted = (value: string): string =>
  stripWrappingQuotes(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");

const escapeSingleQuoted = (value: string): string =>
  stripWrappingQuotes(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");

const parseJsonIfPossible = (value: string): unknown => {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
};

const formatDynamicBoolean = (value: boolean, language: CodeLanguage): string => {
  if (language === "python") {
    return value ? "True" : "False";
  }

  return value ? "true" : "false";
};

const formatDynamicLiteral = (value: unknown, language: CodeLanguage): string => {
  if (Array.isArray(value)) {
    return formatDynamicArrayLiteral(value, language);
  }

  if (value && typeof value === "object") {
    return formatDynamicObjectLiteral(value as Record<string, unknown>, language);
  }

  if (typeof value === "string") {
    if (language === "php") {
      return `"${escapeDoubleQuoted(value)}"`;
    }

    return `"${escapeDoubleQuoted(value)}"`;
  }

  if (typeof value === "boolean") {
    return formatDynamicBoolean(value, language);
  }

  if (value === null) {
    if (language === "python") return "None";

    if (language === "php") return "null";

    if (language === "ruby") return "nil";

    return "null";
  }

  return String(value);
};

const formatDynamicObjectLiteral = (
  value: Record<string, unknown>,
  language: CodeLanguage
): string => {
  const entries = Object.entries(value);

  if (language === "php") {
    return `[${entries
      .map(
        ([key, entryValue]) =>
          `"${escapeDoubleQuoted(key)}" => ${formatDynamicLiteral(entryValue, language)}`
      )
      .join(", ")}]`;
  }

  if (language === "ruby") {
    return `{ ${entries
      .map(
        ([key, entryValue]) =>
          `"${escapeDoubleQuoted(key)}" => ${formatDynamicLiteral(entryValue, language)}`
      )
      .join(", ")} }`;
  }

  if (language === "python") {
    return `{${entries
      .map(
        ([key, entryValue]) =>
          `"${escapeDoubleQuoted(key)}": ${formatDynamicLiteral(entryValue, language)}`
      )
      .join(", ")}}`;
  }

  return JSON.stringify(value);
};

const formatDynamicArrayLiteral = (value: unknown[], language: CodeLanguage): string => {
  if (language === "php") {
    return `[${value.map((item) => formatDynamicLiteral(item, language)).join(", ")}]`;
  }

  return `[${value.map((item) => formatDynamicLiteral(item, language)).join(", ")}]`;
};

const formatGoPrimitive = (value: unknown, type?: string): string => {
  if (typeof value === "string" || type === "string" || type === "char") {
    return `"${escapeDoubleQuoted(String(value))}"`;
  }

  if (typeof value === "boolean" || type === "boolean") {
    return String(value).toLowerCase() === "true" ? "true" : "false";
  }

  return String(value);
};

const getGoType = (type?: string): string => {
  const typeMap: Record<string, string> = {
    int: "int",
    string: "string",
    number: "float64",
    boolean: "bool",
    double: "float64",
    float: "float32",
    long: "int64",
    char: "rune",
    byte: "byte",
    short: "int16",
  };

  return typeMap[type || "int"] || "interface{}";
};

const formatRustPrimitive = (value: unknown, type?: string): string => {
  if (typeof value === "string" || type === "string") {
    return `"${escapeDoubleQuoted(String(value))}".to_string()`;
  }

  if (type === "char") {
    return `'${escapeSingleQuoted(String(value))}'`;
  }

  if (typeof value === "boolean" || type === "boolean") {
    return String(value).toLowerCase() === "true" ? "true" : "false";
  }

  return String(value);
};

export const formatArgsForDynamicLang = (
  testCaseArgs: TestCaseArgument[] | undefined,
  argumentScheme: ArgumentSchema[],
  language: CodeLanguage
): string => {
  if (!testCaseArgs || !argumentScheme) return "";

  return testCaseArgs
    .map((arg, idx) => {
      const scheme = argumentScheme[idx];

      if (!scheme) return arg.value;

      if (scheme.type === "object" || scheme.type === "map") {
        const parsedObject =
          arg.objectValues && Object.keys(arg.objectValues).length > 0
            ? Object.fromEntries(
              Object.entries(arg.objectValues).map(([key, value]) => [
                key,
                parseJsonIfPossible(String(value)),
              ])
            )
            : parseJsonIfPossible(arg.value);

        if (parsedObject && typeof parsedObject === "object" && !Array.isArray(parsedObject)) {
          return formatDynamicObjectLiteral(parsedObject as Record<string, unknown>, language);
        }
      }

      const parsedValue = parseJsonIfPossible(arg.value);

      if (Array.isArray(parsedValue)) {
        return formatDynamicArrayLiteral(parsedValue, language);
      }

      if (scheme.type === "boolean") {
        return formatDynamicBoolean(String(arg.value).toLowerCase() === "true", language);
      }

      if (scheme.type === "char") {
        return language === "python"
          ? `"${escapeDoubleQuoted(String(parsedValue))}"`
          : `'${escapeSingleQuoted(String(parsedValue))}'`;
      }

      if (scheme.type === "string") {
        return `"${escapeDoubleQuoted(String(parsedValue))}"`;
      }

      return formatDynamicLiteral(parsedValue, language);
    })
    .join(", ");
};

export const formatArgsForJavaOrCSharp = (
  testCaseArgs: TestCaseArgument[] | undefined,
  argumentScheme: ArgumentSchema[],
  _language: CodeLanguage
): string => {
  if (!testCaseArgs || !argumentScheme) return "";

  const cleanValue = (value: string) => stripWrappingQuotes(value);

  return testCaseArgs
    .map((arg, idx) => {
      const scheme = argumentScheme[idx];

      if (!scheme) return arg.value;

      const cleanVal = cleanValue(arg.value);

      if (scheme.type === "string") {
        return `"${escapeDoubleQuoted(cleanVal)}"`;
      }

      if (scheme.type === "char") {
        return `'${escapeSingleQuoted(cleanVal)}'`;
      }

      if (scheme.type === "boolean") {
        return cleanVal.toLowerCase() === "true" ? "true" : "false";
      }

      if (scheme.type === "object" && scheme.objectFields) {
        const objectValues = arg.objectValues ?? {};
        const className = scheme.className || scheme.name.charAt(0).toUpperCase() + scheme.name.slice(1);
        const fields = scheme.objectFields.map((field) => {
          const fieldValue = objectValues[field.name] ?? "";

          if (field.type === "string") return `"${escapeDoubleQuoted(fieldValue)}"`;

          if (field.type === "char") return `'${escapeSingleQuoted(fieldValue)}'`;

          if (field.type === "boolean") return fieldValue.toLowerCase() === "true" ? "true" : "false";

          return stripWrappingQuotes(fieldValue);
        });

        return `new ${className}(${fields.join(", ")})`;
      }

      const parsedValue = parseJsonIfPossible(arg.value);

      if (Array.isArray(parsedValue)) {
        const elementType =
          scheme.type === "array" || scheme.type === "list"
            ? scheme.arrayElementType || "int"
            : scheme.type.replace("array_", "");
        const arrayType = elementType === "string" ? "String" : elementType;
        const elements = parsedValue.map((item) => {
          if (elementType === "string") return `"${escapeDoubleQuoted(String(item))}"`;

          if (elementType === "char") return `'${escapeSingleQuoted(String(item))}'`;

          if (elementType === "boolean") return item ? "true" : "false";

          return String(item);
        });

        return `new ${arrayType}[] { ${elements.join(", ")} }`;
      }

      return stripWrappingQuotes(arg.value);
    })
    .join(", ");
};

export const formatArgsForGolang = (
  testCaseArgs: TestCaseArgument[] | undefined,
  argumentScheme: ArgumentSchema[]
): string => {
  if (!testCaseArgs || !argumentScheme) return "";

  return testCaseArgs
    .map((arg, idx) => {
      const scheme = argumentScheme[idx];

      if (!scheme) return arg.value;

      if (scheme.type === "object" || scheme.type === "map") {
        const objectValues = Object.fromEntries(
          Object.entries(arg.objectValues ?? {}).map(([key, value]) => [
            key,
            parseJsonIfPossible(String(value)),
          ])
        );
        const entries = Object.entries(objectValues);

        return `map[string]interface{}{${entries
          .map(
            ([key, value]) => `"${escapeDoubleQuoted(key)}": ${formatGoPrimitive(value)}`
          )
          .join(", ")}}`;
      }

      const parsedValue = parseJsonIfPossible(arg.value);

      if (Array.isArray(parsedValue)) {
        const elementType =
          scheme.type === "array" || scheme.type === "list"
            ? scheme.arrayElementType || "int"
            : scheme.type.replace("array_", "");
        const goType = getGoType(elementType);

        return `[]${goType}{${parsedValue
          .map((item) => formatGoPrimitive(item, elementType))
          .join(", ")}}`;
      }

      return formatGoPrimitive(parsedValue, scheme.type);
    })
    .join(", ");
};

export const formatArgsForRust = (
  testCaseArgs: TestCaseArgument[] | undefined,
  argumentScheme: ArgumentSchema[]
): string => {
  if (!testCaseArgs || !argumentScheme) return "";

  return testCaseArgs
    .map((arg, idx) => {
      const scheme = argumentScheme[idx];

      if (!scheme) return arg.value;

      if (scheme.type === "object" || scheme.type === "map") {
        const objectValues = Object.fromEntries(
          Object.entries(arg.objectValues ?? {}).map(([key, value]) => [
            key,
            parseJsonIfPossible(String(value)),
          ])
        );
        const entries = Object.entries(objectValues);

        return `std::collections::HashMap::from([${entries
          .map(
            ([key, value]) =>
              `("${escapeDoubleQuoted(key)}".to_string(), ${formatRustPrimitive(value, "string")})`
          )
          .join(", ")}])`;
      }

      const parsedValue = parseJsonIfPossible(arg.value);

      if (Array.isArray(parsedValue)) {
        const elementType =
          scheme.type === "array" || scheme.type === "list"
            ? scheme.arrayElementType || "int"
            : scheme.type.replace("array_", "");

        return `vec![${parsedValue
          .map((item) => formatRustPrimitive(item, elementType))
          .join(", ")}]`;
      }

      return formatRustPrimitive(parsedValue, scheme.type);
    })
    .join(", ");
};

export const getDisplayInput = (
  testCase: { input?: string; args?: TestCaseArgument[] } | undefined,
  argumentScheme: ArgumentSchema[] | undefined,
  language: CodeLanguage | undefined
): string => {
  if (!testCase) return "";

  if (testCase.args && argumentScheme && argumentScheme.length > 0) {
    const currentLanguage = language || "javascript";

    if (currentLanguage === "java" || currentLanguage === "csharp") {
      return formatArgsForJavaOrCSharp(testCase.args, argumentScheme, currentLanguage);
    }

    if (
      currentLanguage === "javascript" ||
      currentLanguage === "typescript" ||
      currentLanguage === "python" ||
      currentLanguage === "php" ||
      currentLanguage === "ruby"
    ) {
      return formatArgsForDynamicLang(testCase.args, argumentScheme, currentLanguage);
    }

    if (currentLanguage === "golang") {
      return formatArgsForGolang(testCase.args, argumentScheme);
    }

    if (currentLanguage === "rust") {
      return formatArgsForRust(testCase.args, argumentScheme);
    }
  }

  return testCase.input || "";
};
