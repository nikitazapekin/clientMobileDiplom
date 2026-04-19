import type { CodeLanguage } from "@/components/Lesson/types";

export const countCodeLines = (code: string): number => {
  return code.split("\n").filter(line => line.trim().length > 0).length;
};

export const hasComments = (code: string, language?: CodeLanguage): boolean => {
  const singleLineComment = /\/\/.*$/m;
  const multiLineComment = /\/\*[\s\S]*?\*\//;
  const pythonComment = /#.*$/m;

  if (language === "python" || language === "ruby") {
    return pythonComment.test(code);
  }

  if (language === "php") {
    return singleLineComment.test(code) || multiLineComment.test(code) || pythonComment.test(code);
  }

  return singleLineComment.test(code) || multiLineComment.test(code);
};

export const hasConsoleLog = (code: string, language?: CodeLanguage): boolean => {
  if (language === "javascript" || language === "typescript") {
    return /console\.(log|error|warn|info)/.test(code);
  }

  if (language === "python") {
    return /print\s*\(/.test(code);
  }

  if (language === "php") {
    return /\b(?:echo|print|print_r|var_dump)\b/.test(code);
  }

  if (language === "ruby") {
    return /\b(?:puts|print|p)\b/.test(code);
  }

  if (language === "rust") {
    return /\b(?:println!|print!|eprintln!|eprint!)\s*\(/.test(code);
  }

  if (language === "golang") {
    return /\bfmt\.Print(?:ln|f)?\s*\(/.test(code);
  }

  if (language === "java") {
    return /\bSystem\.out\.(print|println)\s*\(/.test(code);
  }

  if (language === "csharp") {
    return /\bConsole\.(WriteLine|Write)\s*\(/.test(code);
  }

  if (language === "cpp") {
    return /\bcout\s*<</.test(code);
  }

  return /console\.(log|error|warn|info)/.test(code) || /print\s*\(/.test(code);
};

export const hasRequiredKeywords = (code: string, keywords: string[]): boolean => {
  return keywords.every(keyword => code.toLowerCase().includes(keyword.toLowerCase()));
};

export const calculateComplexity = (code: string): number => {
  let complexity = 1;
  const patterns = [
    /\bif\s*\(/,
    /\belse\s+if\s*\(/,
    /\bfor\s*\(/,
    /\bwhile\s*\(/,
    /\bswitch\s*\(/,
    /\bcase\s+/,
    /\bcatch\s*\(/,
    /&&/,
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
