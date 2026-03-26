
export type SlideType = "lesson" | "test";

export interface Slide {
  id: string;
  title: string;
  type: SlideType;
  order: number;
  blocks: SlideBlock[];
}

export type CodeLanguage = "javascript" | "python" | "csharp" | "golang" | "java";
export type FillCodeLanguage = "javascript" | "python" | "csharp" | "java";

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

export type ArgumentType = "int" | "string" | "number" | "boolean" | "double" | "float" | "long" | "char" | "byte" | "short" | "object" | "array" | "array_int" | "array_string" | "array_double" | "array_float" | "array_long" | "array_boolean" | "array_char" | "list" | "map" | "void";

export interface ArgumentSchema {
  name: string;
  type: ArgumentType;
  className?: string;
  arrayElementType?: string;
  arrayElementClassName?: string;
  arrayElementObjectFields?: { name: string; type: ArgumentType }[];
  objectFields?: { name: string; type: ArgumentType }[];
}

export interface TestCaseArgument {
  index: number;
  value: string;
  objectValues?: Record<string, string>;
}

export interface CodeTaskBlock extends BaseBlock {
  type: "codeTask";
  runnable: boolean;
  language: CodeLanguage;
  description?: string;
  startCode?: string;
  testCases?: Array<{ input: string; expectedOutput: string; args?: TestCaseArgument[] }>;
  expectedOutput?: string;
  constraints?: {
    type: CodeConstraintType;
    value: number | string[] | boolean;
  }[];
  argumentScheme?: ArgumentSchema[];
  returnType?: ArgumentType;
}

export interface FillCodeTaskCaseValue {
  slotId: string;
  optionId: string | null;
  value?: string;
  inputId?: string;
}

export interface FillCodeTaskOption {
  id: string;
  value: string;
}

export interface FillCodeTaskCase {
  id: string;
  values: FillCodeTaskCaseValue[];
}

export interface FillCodeTaskBlock extends BaseBlock {
  type: "fillCodeTask";
  description?: string;
  language: FillCodeLanguage;
  templateCode: string;
  options: FillCodeTaskOption[];
  testCases: FillCodeTaskCase[];
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
  | FillCodeTaskBlock
  | TheoryQuestionBlock;

export interface ConstraintResult {
  type: CodeConstraintType;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}
