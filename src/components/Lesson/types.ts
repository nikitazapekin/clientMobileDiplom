// app/lesson/[id]/types.ts
export type SlideType = "lesson" | "test";

export interface Slide {
  id: string;
  title: string;
  type: SlideType;
  order: number;
  blocks: SlideBlock[];
}

export type CodeLanguage = "javascript" | "python" | "csharp" | "golang" | "java";

export type CodeConstraintType =
  | "maxTimeMs"
  | "maxLines"
  | "forbiddenTokens"
  | "noComments"
  | "noConsoleLog"
  | "maxComplexity"
  | "memoryLimit"
  | "requiredKeywords";

export interface BaseBlock {
  id: string;
  order: number;
  type: string;
}

export interface TextBlock extends BaseBlock {
  type: "text";
  content: string;
}

export interface CodeExampleBlock extends BaseBlock {
  type: "codeExample";
  code: string;
  language: CodeLanguage;
  runnable: boolean;
}

export interface SourceBlock extends BaseBlock {
  type: "source";
  url: string;
  note?: string;
}

export interface TableBlock extends BaseBlock {
  type: "table";
  rows: number;
  cols: number;
  cells: string[][];
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  url: string;
  file?: File | null;
}

export interface CodeTaskBlock extends BaseBlock {
  type: "codeTask";
  runnable: boolean;
  language: CodeLanguage;
  description?: string;
  startCode?: string;
  testCases?: { input: string; expectedOutput: string }[];
  expectedOutput?: string;
  constraints?: {
    type: CodeConstraintType;
    value: number | string[] | boolean;
  }[];
}

export interface TheoryQuestionBlock extends BaseBlock {
  type: "theoryQuestion";
  text?: string;
  code?: string;
  imageUrl?: string;
  options: string[];
  correctIndex: number;
}

export type SlideBlock =
  | TextBlock
  | CodeExampleBlock
  | SourceBlock
  | TableBlock
  | ImageBlock
  | CodeTaskBlock
  | TheoryQuestionBlock;
