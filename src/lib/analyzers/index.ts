import { Bug, Summary } from '../types';
import { JavaScriptAnalyzer, TypeScriptAnalyzer } from './javascript';
import { PythonAnalyzer } from './python';
import { JavaAnalyzer } from './java';
import { GenericAnalyzer } from './generic';
import { Analyzer } from './base';

const analyzers: Map<string, Analyzer> = new Map([
  ['javascript', new JavaScriptAnalyzer()],
  ['typescript', new TypeScriptAnalyzer()],
  ['python', new PythonAnalyzer()],
  ['java', new JavaAnalyzer()],
  ['c', new GenericAnalyzer('c', 'C')],
  ['cpp', new GenericAnalyzer('cpp', 'C++')],
  ['csharp', new GenericAnalyzer('csharp', 'C#')],
  ['go', new GenericAnalyzer('go', 'Go')],
  ['rust', new GenericAnalyzer('rust', 'Rust')],
  ['php', new GenericAnalyzer('php', 'PHP')],
  ['ruby', new GenericAnalyzer('ruby', 'Ruby')],
  ['html', new GenericAnalyzer('html', 'HTML')],
  ['css', new GenericAnalyzer('css', 'CSS')],
]);

export function analyzeCode(code: string, language: string): { bugs: Bug[]; summary: Summary } {
  const analyzer = analyzers.get(language);
  
  if (!analyzer) {
    // Return empty result for unsupported languages
    return {
      bugs: [],
      summary: { critical: 0, warning: 0, info: 0 },
    };
  }
  
  const bugs = analyzer.analyze(code);
  
  // Calculate summary
  const summary: Summary = {
    critical: bugs.filter(b => b.severity === 'critical').length,
    warning: bugs.filter(b => b.severity === 'warning').length,
    info: bugs.filter(b => b.severity === 'info').length,
  };
  
  // Sort bugs by line number
  bugs.sort((a, b) => a.line - b.line);
  
  return { bugs, summary };
}

export function getSupportedLanguages(): string[] {
  return Array.from(analyzers.keys());
}
