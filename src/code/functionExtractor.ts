import { JAVA_SERIALIZATION_HELPERS } from "./resultSerialization";

import type { CodeLanguage } from "@/components/Lesson/types";

export const stripMainMethod = (code: string, language: CodeLanguage): string => {
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

export const addJavaMainMethod = (code: string, funcName: string | null, input: string = "5"): string => {
  if (!funcName) return code;

  const mainMethod = `
${JAVA_SERIALIZATION_HELPERS}

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
            System.out.print(__codexSerializeResult(result));
            System.out.println("===RESULT_END===");
            
        } catch (Exception e) {
            System.setOut(originalOut);
            System.out.println("===RESULT_START===");
            System.out.print(__codexSerializeError(e));
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

export const extractFunctionName = (code: string, lang: CodeLanguage): string | null => {
  if (!code) return null;

  try {
    switch (lang) {
      case "javascript": {
        const jsMatch = code.match(
          /function\s+(\w+)|const\s+(\w+)\s*=\s*\([^)]*\)\s*=>|let\s+(\w+)\s*=\s*\([^)]*\)\s*=>|var\s+(\w+)\s*=\s*\([^)]*\)\s*=>/
        );

        return jsMatch ? jsMatch[1] || jsMatch[2] || jsMatch[3] || jsMatch[4] : null;
      }

      case "typescript": {
        const tsMatch = code.match(
          /function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::[^=]+)?=>|let\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::[^=]+)?=>|var\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::[^=]+)?=>/
        );

        return tsMatch ? tsMatch[1] || tsMatch[2] || tsMatch[3] || tsMatch[4] : null;
      }

      case "python": {
        const pyMatch = code.match(/def\s+(\w+)\s*\(/);

        return pyMatch ? pyMatch[1] : null;
      }

      case "php": {
        const phpMatch = code.match(/function\s+(\w+)\s*\(/);

        return phpMatch ? phpMatch[1] : null;
      }

      case "ruby": {
        const rubyTopLevelMatch = code.match(
          /^def\s+(?:self\.)?([A-Za-z_][A-Za-z0-9_]*[!?=]?)\s*(?:\(|$)/m
        );

        if (rubyTopLevelMatch) {
          return rubyTopLevelMatch[1];
        }

        const rubyMatch = code.match(
          /^\s*def\s+(?:self\.)?([A-Za-z_][A-Za-z0-9_]*[!?=]?)\s*(?:\(|$)/m
        );

        return rubyMatch ? rubyMatch[1] : null;
      }

      case "rust": {
        const rustMatches = Array.from(code.matchAll(/fn\s+(\w+)\s*\(/g));

        return rustMatches.find((match) => match[1] !== "main")?.[1] ?? rustMatches[0]?.[1] ?? null;
      }

      case "golang": {
        const goMatches = Array.from(code.matchAll(/func\s+(\w+)\s*\(/g));

        return goMatches.find((match) => match[1] !== "main")?.[1] ?? goMatches[0]?.[1] ?? null;
      }

      case "csharp": {
        const csMatch = code.match(/public\s+static\s+\S+\s+(\w+)\s*\([^)]*\)/);

        return csMatch ? csMatch[1] : null;
      }

      case "java": {
        const javaMatch = code.match(/public\s+static\s+\S+\s+(\w+)\s*\([^)]*\)/);

        return javaMatch ? javaMatch[1] : null;
      }

      default:
        return null;
    }
  } catch (e) {
    console.error("Error extracting function name:", e);

    return null;
  }
};

export const resolveTargetFunctionName = (
  explicitFunctionName: string | null | undefined,
  code: string,
  lang: CodeLanguage
): string | null => {
  const normalizedFunctionName = explicitFunctionName?.trim();

  if (normalizedFunctionName) {
    return normalizedFunctionName;
  }

  return extractFunctionName(code, lang);
};
