import type { CodeLanguage } from "@/components/Lesson/types";
import { parseArguments, formatArgumentsForCode } from "./argumentParser";

export const buildJavaTestSuite = (
  userCode: string,
  testCases: { input: string; expectedOutput: string }[],
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

export const buildCSharpTestSuite = (
  userCode: string,
  testCases: { input: string; expectedOutput: string }[],
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
