export const countCodeLines = (code: string): number => {
  return code.split("\n").filter(line => line.trim().length > 0).length;
};

export const hasComments = (code: string): boolean => {
  const singleLineComment = /\/\/.*$/m;
  const multiLineComment = /\/\*[\s\S]*?\*\//;
  const pythonComment = /#.*$/m;
  
  return singleLineComment.test(code) || multiLineComment.test(code) || pythonComment.test(code);
};

export const hasConsoleLog = (code: string): boolean => {
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
