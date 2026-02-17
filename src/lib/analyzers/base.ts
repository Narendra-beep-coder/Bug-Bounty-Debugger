import { Bug, Severity } from '../types';

export interface Analyzer {
  analyze(code: string): Bug[];
  getLanguageId(): string;
}

export abstract class BaseAnalyzer implements Analyzer {
  abstract analyze(code: string): Bug[];
  abstract getLanguageId(): string;

  protected createBug(
    line: number,
    severity: Severity,
    category: string,
    message: string,
    description: string,
    suggestion: string,
    column?: number,
    codeSnippet?: string
  ): Bug {
    return {
      id: `${this.getLanguageId()}-${line}-${Date.now()}`,
      line,
      column,
      severity,
      category,
      message,
      description,
      suggestion,
      codeSnippet,
    };
  }

  protected getLine(code: string, lineNumber: number): string {
    const lines = code.split('\n');
    return lines[lineNumber - 1] || '';
  }

  protected findPattern(code: string, pattern: RegExp): { line: number; match: string }[] {
    const results: { line: number; match: string }[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const match = line.match(pattern);
      if (match) {
        results.push({
          line: index + 1,
          match: match[0],
        });
      }
    });
    
    return results;
  }

  // Common security patterns
  protected checkSecurityIssues(code: string): Bug[] {
    const bugs: Bug[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // SQL Injection patterns
      if (/(?:execute|query|select|insert|update|delete).*\+.*["']/i.test(line) ||
          /["'].*\$\{.*\}.*["']/i.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'critical',
          'Security',
          'Potential SQL Injection',
          'User input is being concatenated directly into SQL queries. This can allow attackers to inject malicious SQL code.',
          'Use parameterized queries or prepared statements instead of string concatenation.',
          line.indexOf('execute') >= 0 || line.indexOf('query') >= 0 ? line.indexOf('execute') : line.indexOf('query'),
          line.trim()
        ));
      }
      
      // Hardcoded credentials
      if (/(?:password|passwd|pwd|secret|api_key|apikey|token)\s*[:=]\s*["'][^"']{4,}["']/i.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'critical',
          'Security',
          'Hardcoded Credentials',
          'Sensitive information like passwords, API keys, or tokens are hardcoded in the source code.',
          'Use environment variables or a secure secrets management system instead.',
          undefined,
          line.trim()
        ));
      }
      
      // eval() usage
      if (/eval\s*\(/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'critical',
          'Security',
          'Dangerous eval() Usage',
          'The eval() function can execute arbitrary code and is a major security risk.',
          'Avoid using eval(). Use safer alternatives like JSON.parse() for JSON data.',
          line.indexOf('eval'),
          line.trim()
        ));
      }
      
      // Insecure random
      if (/Math\.random\s*\(\s*\)/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Security',
          'Insecure Random Number Generation',
          'Math.random() is not cryptographically secure.',
          'Use crypto.randomBytes() or the Web Crypto API for security-sensitive operations.',
          line.indexOf('Math.random'),
          line.trim()
        ));
      }
      
      // console.log with potential sensitive data
      if (/console\.(log|info|warn|error)\s*\(.*(?:password|token|secret|key|auth)/i.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Security',
          'Sensitive Data in Console',
          'Potential sensitive information being logged to console.',
          'Ensure no sensitive data is logged in production environments.',
          undefined,
          line.trim()
        ));
      }
    });
    
    return bugs;
  }

  // Common code quality issues
  protected checkCodeQuality(code: string): Bug[] {
    const bugs: Bug[] = [];
    const lines = code.split('\n');
    let inFunction = false;
    let functionStartLine = 0;
    let braceCount = 0;
    let functionName = '';
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();
      
      // Empty catch blocks
      if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Code Quality',
          'Empty Catch Block',
          'The catch block is empty, silently swallowing errors.',
          'At minimum, log the error or add a comment explaining why it is intentionally empty.',
          line.indexOf('catch'),
          line.trim()
        ));
      }
      
      // TODO comments
      if (/\/\/\s*TODO|\/\*\s*TODO/i.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'Code Quality',
          'TODO Comment',
          'There is a TODO comment indicating unfinished work.',
          'Address the TODO or create a tracking issue for it.',
          line.indexOf('TODO'),
          line.trim()
        ));
      }
      
      // Console statements (info level for production)
      if (/console\.(log|info)\s*\(/.test(line) && !line.includes('console.log')) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'Code Quality',
          'Console Statement',
          'Debug console statement found in code.',
          'Remove console statements before deploying to production.',
          line.indexOf('console'),
          line.trim()
        ));
      }
      
      // Detect function start
      if (/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|=>\s*\{/.test(line)) {
        inFunction = true;
        functionStartLine = lineNum;
        const funcMatch = line.match(/(?:function\s+(\w+)|const\s+(\w+))/);
        if (funcMatch) {
          functionName = funcMatch[1] || funcMatch[2] || 'anonymous';
        } else {
          functionName = 'anonymous';
        }
        braceCount = 0;
      }
      
      // Count braces
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      // Check function length when function ends
      if (inFunction && braceCount === 0 && line.includes('}')) {
        const functionLength = lineNum - functionStartLine;
        if (functionLength > 50) {
          bugs.push(this.createBug(
            functionStartLine,
            'warning',
            'Code Quality',
            'Long Function',
            `Function '${functionName}' has ${functionLength} lines. Consider breaking it into smaller functions.`,
            'Functions should be kept under 50 lines for better readability and maintainability.',
            undefined,
            this.getLine(code, functionStartLine)
          ));
        }
        inFunction = false;
      }
    });
    
    return bugs;
  }
}
