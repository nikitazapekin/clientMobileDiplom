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

export const extractFunctionName = (code: string, lang: CodeLanguage): string | null => {
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
