export type CodeLanguage = 'javascript' | 'python' | 'csharp' | 'java' | 'golang';

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: CodeLanguage;
  readOnly?: boolean;
  height?: number;
 
  onRun?: () => void;
  runLoading?: boolean;
}