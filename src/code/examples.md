escapeString = (str: string): string => {

return str

.replace(/\\/g, '\\\\')

.replace(/"/g, '\\"')

.replace(/\n/g, '\\n')

.replace(/\r/g, '\\r')

.replace(/\t/g, '\\t');

};



const quote = 'Он сказал: "Привет"';

console.log(escapeString(quote));
// Результат: "Он сказал: \\\"Привет\\\""








const safelyParseObject = (val: string): any => {

if (!val || val.trim() === "") {

return {};

}



let cleanedVal = val.trim();



if (cleanedVal.startsWith('"') && cleanedVal.endsWith('"')) {

cleanedVal = cleanedVal.slice(1, -1);

}



try {

return JSON.parse(cleanedVal);

} catch {

if (cleanedVal.startsWith("{") && cleanedVal.endsWith("}")) {

try {

return eval(`(${cleanedVal})`);

} catch {

return val;

}

}

return val;

}

};




const input = '"{"status": "ok"}"'; 
console.log(safelyParseObject(input));
// Результат: { status: "ok" } (Объект)
// Обычный JSON.parse тут бы сломался 









 
export const formatArgsForDynamicLang = (
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
      return `"${escapeString(cleanVal)}"`;
    }
    if (scheme.type === "number") {
      return cleanVal;
    }
    if (scheme.type === "char") {
      return `'${escapeString(cleanVal)}'`;
    }
    if (scheme.type === "boolean") {
      if (language === "python") {
        return cleanVal.toLowerCase() === "true" ? "True" : "False";
      }
      return cleanVal.toLowerCase() === "true" ? "true" : "false";
    }
    if (scheme.type === "object") {
      const parsed = safelyParseObject(arg.value);
      if (typeof parsed === "object" && parsed !== null) {
        return JSON.stringify(parsed);
      }
      if (typeof parsed === "string") {
        return JSON.stringify(parsed);
      }
      return JSON.stringify(parsed || {});
    }
    if (scheme.type && scheme.type.startsWith("array_")) {
      const elementType = scheme.type.replace("array_", "");
      
      if (arg.value && arg.value.trim().startsWith("[")) {
        try {
          const arr = JSON.parse(arg.value);
          if (Array.isArray(arr)) {
            const formatted = arr.map((item: any) => {
              if (elementType === "string") return `"${escapeString(String(item))}"`;
              if (elementType === "boolean") {
                if (language === "python") return item ? "True" : "False";
                return item ? "true" : "false";
              }
              if (elementType === "object") {
                return JSON.stringify(item);
              }
              return String(item);
            });
            return `[${formatted.join(", ")}]`;
          }
        } catch {
     
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
              if (scheme.arrayElementType === "string") return `"${escapeString(String(item))}"`;
              if (scheme.arrayElementType === "boolean") {
                if (language === "python") return item ? "True" : "False";
                return item ? "true" : "false";
              }
              if (scheme.arrayElementType === "object") {
                return JSON.stringify(item);
              }
              return String(item);
            });
            return `[${formatted.join(", ")}]`;
          }
        } catch {
       
        }
      }
      return arg.value;
    }
    
    return arg.value;
  }).filter(Boolean);
  
  return args.join(", ");
};



Входное значение (arg.value)	

true	
Ожидаемый тип (scheme.type)

boolean	
	Язык (language)
python
    
    	Результат метода
	True










export const formatArgsForJavaOrCSharp = (
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

  const javaCleanValue = (val: string) => {
    return cleanValue(val)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');
  };
  
  const args = testCaseArgs.map((arg, idx) => {
    const scheme = argumentScheme[idx];
    if (!scheme) return null;
    
    const cleanVal = cleanValue(arg.value);
    
    if (scheme.type === "string") {
      return `"${javaCleanValue(cleanVal)}"`;
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
          return `"${javaCleanValue(val)}"`;
        } else if (f.type === "boolean") {
          return val.toLowerCase() === "true" ? "true" : "false";
        } else if (f.type === "double" || f.type === "float") {
          return val;
        } else if (f.type === "char") {
          return `'${javaCleanValue(val)}'`;
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
              if (elementType === "string") return `"${javaCleanValue(String(item))}"`;
              if (elementType === "boolean") return item ? "true" : "false";
              return String(item);
            });
            if (language === "java") {
              return `new ${typeToUse}[] { ${formatted.join(", ")} }`;
            }
            return `new ${typeToUse}[] { ${formatted.join(", ")} }`;
          }
        } catch {
        
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
              if (arrayElementType === "string") return `"${javaCleanValue(String(item))}"`;
              if (arrayElementType === "boolean") return item ? "true" : "false";
              return String(item);
            });
            return `new ${arrayElementType === "string" ? "String" : arrayElementType}[] { ${formatted.join(", ")} }`;
          }
        } catch {
        
        }
      }
      return arg.value;
    }
    
    return arg.value;
  }).filter(Boolean);
  
  return args.join(", ");
};




Допустим, пользователь ввел в вебе: ["apple", "banana"], а в схеме указан тип array_string.
Для Java/C# результат будет:
new String[] { "apple", "banana" }











export const parseArguments = (input: string): any[] => {
  if (!input.trim()) return [];

  try {
    if (input.trim().startsWith("[") && input.trim().endsWith("]")) {
      return JSON.parse(input);
    }
  } catch {
    
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

export const formatArgumentsForCode = (args: any[]): string => {
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





Пример:
Вход: 123, {"a": 1, "b": 2}, "Красный, синий"
123 - первый аргумент (число).

{"a": 1, "b": 2} -второй аргумент. Запятая внутри {} проигнорирована.

"Красный, синий" - третий аргумент. Запятая внутри кавычек проигнорирована.

2. parseValue: Как текст превращается в данные
После того как строка разделена на куски, parseValue определяет, что это за тип данных:

Числа: Если это "-5.5", вернет число -5.5.

Булевы/Null: Превратит текст "true" в логическое значение true.

Строки: Если текст в кавычках (любых: ', ", `), он их снимет.

Объекты: Попробует превратить {...} в реальный объект через JSON.parse.

3. formatArgumentsForCode: Обратный процесс
Этот метод берет массив уже обработанных данных и снова склеивает их в одну красивую строку для вставки в код.

Если это строка - добавит кавычки.

Если это объект - превратит его в JSON-строку.




























import type {
  FillCodeTaskBlock,
  FillCodeTaskCase,
  FillCodeTaskOption,
} from "../components/Lesson/types";

export interface FillTaskValidationResult {
  passed: boolean;
  matchedCaseIndex: number | null;
  totalCases: number;
}

export interface FillTaskTemplateSegment {
  type: "text" | "slot";
  value: string;
}

export const FILL_TASK_PLACEHOLDER_REGEX = /\[\[([\w-]+)\]\]|\[(input[\w-]*)\]/g;

const normalizeValue = (value: string | undefined | null): string => (value ?? "").trim();

const createSlug = (value: string): string => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "option";
};

const buildLegacyOptionId = (value: string, index: number): string =>
  `fill_option_${createSlug(value)}_${index + 1}`;

const getCaseValueSlotId = (value: { slotId?: string; inputId?: string }): string =>
  value.slotId ?? value.inputId ?? "";

const findOptionIdByValue = (
  options: FillCodeTaskOption[],
  value: string | undefined
): string | null => {
  const normalized = normalizeValue(value);

  if (!normalized) {
    return null;
  }

  const matchedOption = options.find((option) => normalizeValue(option.value) === normalized);

  return matchedOption?.id ?? null;
};

const normalizeOptions = (
  options: FillCodeTaskOption[] | undefined,
  testCases: FillCodeTaskCase[] | undefined
): FillCodeTaskOption[] => {
  const normalizedOptions: FillCodeTaskOption[] = (options ?? []).map((option, index) => {
    if (typeof option === "string") {
      return {
        id: `fill_option_${index + 1}`,
        value: option,
      };
    }

    return {
      id: option.id || `fill_option_${index + 1}`,
      value: option.value ?? "",
    };
  });

  const seenValues = new Set(normalizedOptions.map((option) => normalizeValue(option.value)));

  (testCases ?? []).forEach((testCase) => {
    (testCase.values ?? []).forEach((caseValue) => {
      const normalizedCaseValue = normalizeValue(caseValue.value);

      if (!normalizedCaseValue || seenValues.has(normalizedCaseValue)) {
        return;
      }

      normalizedOptions.push({
        id: buildLegacyOptionId(normalizedCaseValue, normalizedOptions.length),
        value: caseValue.value ?? "",
      });
      seenValues.add(normalizedCaseValue);
    });
  });

  return normalizedOptions;
};

export const extractFillTaskInputs = (templateCode: string): string[] => {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const match of templateCode.matchAll(FILL_TASK_PLACEHOLDER_REGEX)) {
    const slotId = match[1] ?? match[2];

    if (!slotId || seen.has(slotId)) {
      continue;
    }

    seen.add(slotId);
    result.push(slotId);
  }

  return result;
};

export const tokenizeFillTaskTemplate = (templateCode: string): FillTaskTemplateSegment[][] => {
  return templateCode.split("\n").map((line) => {
    const segments: FillTaskTemplateSegment[] = [];
    let lastIndex = 0;

    for (const match of line.matchAll(FILL_TASK_PLACEHOLDER_REGEX)) {
      const fullMatch = match[0];
      const slotId = match[1] ?? match[2];
      const matchIndex = match.index ?? 0;

      if (matchIndex > lastIndex) {
        segments.push({
          type: "text",
          value: line.slice(lastIndex, matchIndex),
        });
      }

      segments.push({
        type: "slot",
        value: slotId ?? fullMatch,
      });

      lastIndex = matchIndex + fullMatch.length;
    }

    if (lastIndex < line.length) {
      segments.push({
        type: "text",
        value: line.slice(lastIndex),
      });
    }

    if (segments.length === 0) {
      segments.push({
        type: "text",
        value: "",
      });
    }

    return segments;
  });
};

export const syncFillTaskTestCases = (
  testCases: FillCodeTaskCase[] | undefined,
  slotIds: string[],
  options: FillCodeTaskOption[] | undefined = []
): FillCodeTaskCase[] => {
  const normalizedOptions = normalizeOptions(options, testCases);

  return (testCases ?? []).map((testCase, index) => {
    const valuesMap = new Map(
      (testCase.values ?? []).map((value) => [getCaseValueSlotId(value), value])
    );

    return {
      ...testCase,
      id: testCase.id || `fill_case_${index + 1}`,
      values: slotIds.map((slotId) => {
        const currentValue = valuesMap.get(slotId);
        const resolvedOptionId =
          currentValue?.optionId &&
          normalizedOptions.some((option) => option.id === currentValue.optionId)
            ? currentValue.optionId
            : findOptionIdByValue(normalizedOptions, currentValue?.value);

        return {
          slotId,
          optionId: resolvedOptionId,
        };
      }),
    };
  });
};

export const normalizeFillTaskBlock = (block: FillCodeTaskBlock): FillCodeTaskBlock => {
  const slotIds = extractFillTaskInputs(block.templateCode ?? "");
  const options = normalizeOptions(block.options, block.testCases);

  return {
    ...block,
    options,
    testCases: syncFillTaskTestCases(block.testCases, slotIds, options),
  };
};

export const getFillTaskCaseOptionId = (
  testCase: FillCodeTaskCase,
  slotId: string
): string | null => {
  return (
    testCase.values.find((value) => getCaseValueSlotId(value) === slotId)?.optionId ?? null
  );
};

export const getFillTaskOptionValue = (
  options: FillCodeTaskOption[] | undefined,
  optionId: string | null | undefined
): string => {
  if (!optionId) {
    return "";
  }

  return options?.find((option) => option.id === optionId)?.value ?? "";
};

export const validateFillTaskAnswers = (
  testCases: FillCodeTaskCase[] | undefined,
  answers: Record<string, string>,
  slotIds: string[],
  options: FillCodeTaskOption[] | undefined = []
): FillTaskValidationResult => {
  const normalizedOptions = normalizeOptions(options, testCases);
  const normalizedCases = syncFillTaskTestCases(testCases, slotIds, normalizedOptions);

  if (normalizedCases.length === 0 || slotIds.length === 0) {
    return {
      passed: false,
      matchedCaseIndex: null,
      totalCases: normalizedCases.length,
    };
  }

  const normalizedAnswers = Object.fromEntries(
    slotIds.map((slotId) => {
      const optionId = normalizedOptions.some((option) => option.id === answers[slotId])
        ? answers[slotId]
        : findOptionIdByValue(normalizedOptions, answers[slotId]);

      return [slotId, optionId ?? ""];
    })
  );

  const matchedCaseIndex = normalizedCases.findIndex((testCase) =>
    slotIds.every(
      (slotId) =>
        normalizeValue(getFillTaskCaseOptionId(testCase, slotId)) ===
        normalizeValue(normalizedAnswers[slotId])
    )
  );

  return {
    passed: matchedCaseIndex !== -1,
    matchedCaseIndex: matchedCaseIndex === -1 ? null : matchedCaseIndex,
    totalCases: normalizedCases.length,
  };
};




Переменная FILL_TASK_PLACEHOLDER_REGEX ищет в тексте два формата пропусков:

[[имя_слота]]   
 






















 import type { ArgumentSchema, CodeLanguage } from "@/components/Lesson/types";

export const getCSharpType = (type: string): string => {
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

export const getJavaType = (type: string): string => {
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

export const generateObjectClasses = (args: ArgumentSchema[], language: CodeLanguage): string => {
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

export const generateObjectClassesForPreview = (args: ArgumentSchema[], language: CodeLanguage): string => {
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
      const className = arg.objectFields
        ? (arg.className || arg.name.charAt(0).toUpperCase() + arg.name.slice(1))
        : (arg.arrayElementClassName || arg.name.charAt(0).toUpperCase() + arg.name.slice(1));
      const objectFields = arg.objectFields ?? arg.arrayElementObjectFields ?? [];

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

export const getArgumentTypeDescription = (arg: ArgumentSchema): string => {
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

export const renderArgumentScheme = (args: ArgumentSchema[], language: CodeLanguage): string => {
  if (!args || args.length === 0) return "";
  
  return args.map((arg, idx) => {
    const typeDesc = getArgumentTypeDescription(arg);
    return `${idx + 1}. ${arg.name}: ${typeDesc}`;
  }).join("\n");
};







 getJavaType и getCSharpType
 

Пример для getJavaType:

Вход: "string"  Выход: "String"

Вход: "boolean"  Выход: "boolean"

Пример для getCSharpType:

Вход: "string"   Выход: "string"

Вход: "boolean"   Выход: "bool"







2. generateObjectClasses

Вход (схема):

const args = [{
  name: "user",
  type: "object",
  objectFields: [
    { name: "name", type: "string" },
    { name: "age", type: "int" }
  ]
}];


Выход (для Java):

class User {
    private String name;
    private int age;

    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    // ... и такие же методы для age
}



generateObjectClassesForPreview
  В C# он добавляет слово public перед классом



 
 
 
 
  getArgumentTypeDescription


  Пример 1 (простой тип):

Вход: { name: "count", type: "int" }

Выход: "int"

Пример 2 (массив):

Вход: { name: "tags", type: "array_string" }

Выход: "string[]"

Пример 3 (объект):

Вход: { name: "user", type: "object", objectFields: [...] }

Выход: "User (String name, int age)"









renderArgumentScheme
Этот метод берет список всех аргументов и делает из них пронумерованный список для документации.


Вход (массив аргументов):

{ name: "id", type: "int" }

{ name: "title", type: "string" }

Выход:

Plaintext
1. id: int
2. title: string












import type { CodeLanguage } from "@/components/Lesson/types";
import { parseArguments, formatArgumentsForCode } from "./argumentParser";
import { JAVA_SERIALIZATION_HELPERS } from "./resultSerialization";

export const buildJavaTestSuite = (
  userCode: string,
  testCases: { input: string; expectedOutput: unknown }[],
  funcName: string | null
): string => {
  if (!funcName) return userCode;

  const testCasesCode = testCases
    .map((tc, index) => {
      const testNum = index + 1;
    
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
                System.out.print(__codexSerializeResult(result));
                System.out.println();
                System.out.println("===RESULT_END_" + ${testNum} + "===");
                
            } catch (Exception e) {
                System.setOut(originalOut);
                System.out.println("===RESULT_START_" + ${testNum} + "===");
                System.out.print(__codexSerializeError(e));
                System.out.println();
                System.out.println("===RESULT_END_" + ${testNum} + "===");
            }
        }`;
    })
    .join("\n");

  if (userCode.includes("public static void main")) {
    return userCode.replace(
      /public\s+static\s+void\s+main\(String\[\]\s*args\)\s*\{[\s\S]*?\}/,
      `${JAVA_SERIALIZATION_HELPERS}

    public static void main(String[] args) {
${testCasesCode}
    }`
    );
  } else {
    const codeWithoutLastBrace = userCode.trim().replace(/\}\s*$/, "");

    return `${codeWithoutLastBrace}

${JAVA_SERIALIZATION_HELPERS}

    public static void main(String[] args) {
${testCasesCode}
    }
}`;
  }
};

export const buildCSharpTestSuite = (
  userCode: string,
  testCases: { input: string; expectedOutput: unknown }[],
  funcName: string | null
): string => {
  if (!funcName) return userCode;

  const testCasesCode = testCases
    .map((tc, index) => {
      const testNum = index + 1;
     
      const argsStr = tc.input || "";

      return `
        // Тест ${testNum}
        {
            var originalOut = Console.Out;
            var originalError = Console.Error;
            var outWriter = new StringWriter();
            var errorWriter = new StringWriter();
            var jsonOptions = new System.Text.Json.JsonSerializerOptions { IncludeFields = true };
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
                Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(result, jsonOptions));
                Console.WriteLine("===RESULT_END_" + ${testNum} + "===");
                
            } catch (Exception e) {
                Console.SetOut(originalOut);
                Console.SetError(originalError);
                Console.WriteLine("===RESULT_START_" + ${testNum} + "===");
                Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(new { error = e.Message }, jsonOptions));
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

export const buildTestCode = (
  userCode: string,
  input: string,
  lang: CodeLanguage,
  funcName: string | null,
  preformattedArgs?: string  
): string => {
  if (!funcName) return userCode;
 
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
  __logs.push('' + message);
  __originalConsole.log.apply(console, args);
};

console.error = function(...args) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  __logs.push('' + message);
  __originalConsole.error.apply(console, args);
};

console.warn = function(...args) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  __logs.push('' + message);
  __originalConsole.warn.apply(console, args);
};

console.info = function(...args) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  __logs.push('' + message);
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








1. buildJavaTestSuite и buildCSharpTestSuite
 

Что они делают:

Создают main: Если в коде ученика нет точки входа, они её дописывают.
 
Маркируют данные: Они оборачивают логи и результат функции в  метки : ===LOGS_START===, ===RESULT_START===.  







buildTestCode
  Он понимает, на каком языке написан код, и применяет нужную стратегию обертки.


  Пример для JavaScript:
Если ученик написал функцию sum(a, b), buildTestCode превратит её в это:



 Код  в редакторе
function sum(a, b) { 
  console.log("Считаю..."); 
  return a + b; 
}

  ТО, ЧТО ДОБАВИЛ МЕТОД:
const __logs = [];
 

try {
  const result = sum(5, 10);  
  console.log('===LOGS_START===');
  __logs.forEach(log => console.log(log));  
  console.log('===LOGS_END===');
  
  console.log('===RESULT_START===');
  console.log(JSON.stringify(result)); 
  console.log('===RESULT_END===');
} catch (error) { ... }