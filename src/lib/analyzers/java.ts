import { Bug } from '../types';
import { BaseAnalyzer } from './base';

export class JavaAnalyzer extends BaseAnalyzer {
  getLanguageId(): string {
    return 'java';
  }

  analyze(code: string): Bug[] {
    const bugs: Bug[] = [];
    
    // Run security checks (common to all languages)
    bugs.push(...this.checkSecurityIssues(code));
    
    // Run code quality checks
    bugs.push(...this.checkCodeQuality(code));
    
    const lines = code.split('\n');
    let inMethod = false;
    let methodStartLine = 0;
    let methodName = '';
    let braceCount = 0;
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();
      
      // System.out.println in production
      if (/System\.out\.print(ln)?\s*\(/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'Java',
          'System.out usage',
          'System.out is used for debugging. Use a logging framework in production.',
          'Use Log4j, SLF4J, or java.util.logging instead.',
          line.indexOf('System.out'),
          line.trim()
        ));
      }
      
      // NullPointerException risk
      if (/\.toString\(\)\s*;?\s*$/.test(trimmed) || /\.equals\(/.test(line)) {
        if (!line.includes("Objects.requireNonNull") && !line.includes("@NonNull")) {
          const nextFewLines = lines.slice(index, index + 3).join(' ');
          if (nextFewLines.includes("get") && !nextFewLines.includes("null check")) {
            bugs.push(this.createBug(
              lineNum,
              'warning',
              'Java',
              'Potential NullPointerException',
              'Calling methods on objects without null checks can cause NullPointerException.',
              'Add null checks or use Optional.ofNullable().',
              undefined,
              line.trim()
            ));
          }
        }
      }
      
      // String comparison with ==
      if (/\w+\s*==\s*"[^"]*"\s*;?\s*$/.test(trimmed) || /"[^"]*"\s*==\s*\w+/.test(trimmed)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Java',
          'String comparison with ==',
          'Using == to compare strings compares references, not values.',
          'Use .equals() method for string comparison: str1.equals(str2)',
          line.indexOf('=='),
          line.trim()
        ));
      }
      
      // Catch block without specific exception
      if (/catch\s*\(\s*Exception\s+\w+\s*\)/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Java',
          'Catching generic Exception',
          'Catching generic Exception catches all RuntimeExceptions too.',
          'Catch specific exceptions or rethrow after handling.',
          line.indexOf('catch'),
          line.trim()
        ));
      }
      
      // Empty catch block
      if (/catch\s*\([^)]+\)\s*\{\s*\}/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Code Quality',
          'Empty catch block',
          'Empty catch blocks silently swallow exceptions.',
          'Log the exception or add a comment explaining why it is empty.',
          line.indexOf('catch'),
          line.trim()
        ));
      }
      
      // Method definition
      if (/^\s*(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*\(/.test(trimmed)) {
        const match = trimmed.match(/(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(/);
        inMethod = true;
        methodStartLine = lineNum;
        methodName = match?.[1] || 'unknown';
        braceCount = 0;
      }
      
      // Count braces
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      // Check method length when method ends
      if (inMethod && braceCount === 0 && line.includes('}')) {
        const methodLength = lineNum - methodStartLine;
        if (methodLength > 30) {
          bugs.push(this.createBug(
            methodStartLine,
            'warning',
            'Code Quality',
            `Long method '${methodName}'`,
            `Method has ${methodLength} lines. Consider breaking it into smaller methods.`,
            'Methods should be kept under 30 lines for better readability.',
            undefined,
            this.getLine(code, methodStartLine)
          ));
        }
        inMethod = false;
      }
      
      // Thread.sleep in main method
      if (/Thread\.sleep\s*\(/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Java',
          'Thread.sleep() usage',
          'Thread.sleep() can cause unresponsive applications.',
          'Use proper concurrency mechanisms or scheduling.',
          line.indexOf('Thread.sleep'),
          line.trim()
        ));
      }
      
      // System.exit in library code
      if (/System\.exit\s*\(/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Java',
          'System.exit() call',
          'System.exit() terminates the JVM abruptly.',
          'Throw an exception instead to allow calling code to handle it.',
          line.indexOf('System.exit'),
          line.trim()
        ));
      }
      
      // TODO in comments
      if (/\/\/\s*TODO|\/\*\s*TODO|\/\/\s*FIXME/.test(trimmed)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'Code Quality',
          'TODO/FIXME comment',
          'There is an unfinished task marker in the code.',
          'Address the TODO or create a tracking issue.',
          trimmed.indexOf('TODO') >= 0 ? trimmed.indexOf('TODO') : trimmed.indexOf('FIXME'),
          line.trim()
        ));
      }
      
      // SQL in string concatenation
      if (/(?:SELECT|INSERT|UPDATE|DELETE|CREATE|DROP).*\+/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'critical',
          'Security',
          'Potential SQL Injection',
          'SQL query built with string concatenation is vulnerable to SQL injection.',
          'Use PreparedStatement with parameterized queries.',
          line.indexOf('SELECT') >= 0 ? line.indexOf('SELECT') : line.indexOf('INSERT'),
          line.trim()
        ));
      }
      
      // Hardcoded password
      if (/(?:password|passwd|pwd|secret)\s*=\s*["'][^"']+["']/i.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'critical',
          'Security',
          'Hardcoded password',
          'Hardcoded passwords are a security risk.',
          'Use environment variables or a configuration file with secure storage.',
          line.indexOf('password') >= 0 ? line.indexOf('password') : line.indexOf('passwd'),
          line.trim()
        ));
      }
      
      // @SuppressWarnings removal suggestion
      if (/@SuppressWarnings\s*\(/.test(line)) {
        const nextLine = lines[index + 1];
        if (nextLine && !nextLine.trim().startsWith('@SuppressWarnings')) {
          bugs.push(this.createBug(
            lineNum,
            'info',
            'Java',
            'Suppressed warnings',
            'Warnings are being suppressed. Consider addressing the root cause.',
            'Remove @SuppressWarnings and fix the underlying issue.',
            line.indexOf('@SuppressWarnings'),
            line.trim()
          ));
        }
      }
    });
    
    return bugs;
  }
}
