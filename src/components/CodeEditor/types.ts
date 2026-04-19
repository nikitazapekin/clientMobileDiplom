export type CodeLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'php'
  | 'ruby'
  | 'rust'
  | 'csharp'
  | 'java'
  | 'golang'
  | 'cpp';

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: CodeLanguage;
  readOnly?: boolean;
  height?: number;

  onRun?: () => void;
  runLoading?: boolean;
}
