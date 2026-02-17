export type Severity = 'critical' | 'warning' | 'info';

export interface Bug {
  id: string;
  line: number;
  column?: number;
  severity: Severity;
  category: string;
  message: string;
  description: string;
  suggestion: string;
  codeSnippet?: string;
}

export interface Summary {
  critical: number;
  warning: number;
  info: number;
}

export interface Analysis {
  _id?: string;
  code: string;
  language: string;
  bugs: Bug[];
  summary: Summary;
  createdAt: Date;
}

export interface AnalyzeRequest {
  code: string;
  language: string;
}

export interface AnalyzeResponse {
  bugs: Bug[];
  summary: Summary;
}

export interface HistoryResponse {
  analyses: Analysis[];
}

export interface SingleHistoryResponse {
  analysis: Analysis;
}

export const SUPPORTED_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', extensions: ['.js', '.jsx'] },
  { id: 'typescript', name: 'TypeScript', extensions: ['.ts', '.tsx'] },
  { id: 'python', name: 'Python', extensions: ['.py'] },
  { id: 'java', name: 'Java', extensions: ['.java'] },
  { id: 'cpp', name: 'C++', extensions: ['.cpp', '.cc', '.cxx'] },
  { id: 'c', name: 'C', extensions: ['.c', '.h'] },
  { id: 'csharp', name: 'C#', extensions: ['.cs'] },
  { id: 'go', name: 'Go', extensions: ['.go'] },
  { id: 'rust', name: 'Rust', extensions: ['.rs'] },
  { id: 'php', name: 'PHP', extensions: ['.php'] },
  { id: 'ruby', name: 'Ruby', extensions: ['.rb'] },
  { id: 'html', name: 'HTML', extensions: ['.html', '.htm'] },
  { id: 'css', name: 'CSS', extensions: ['.css'] },
] as const;
