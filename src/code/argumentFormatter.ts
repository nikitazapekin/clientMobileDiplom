import type { ArgumentSchema, TestCaseArgument, CodeLanguage } from "@/components/Lesson/types";

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

const escapeString = (str: string): string => {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
};

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

export const getDisplayInput = (
  testCase: { input?: string; args?: TestCaseArgument[] } | undefined,
  argumentScheme: ArgumentSchema[] | undefined,
  language: CodeLanguage | undefined
): string => {
  if (!testCase) return "";
   
  if (testCase.args && argumentScheme && argumentScheme.length > 0) {
    const lang = language || "javascript";
   
    if (lang === "java" || lang === "csharp") {
      return formatArgsForJavaOrCSharp(testCase.args, argumentScheme, lang);
    }
    
    return formatArgsForDynamicLang(testCase.args, argumentScheme, lang);
  }
  
  return testCase.input || "";
};
