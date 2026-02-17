import { Bug } from '../types';
import { BaseAnalyzer } from './base';

export class JavaScriptAnalyzer extends BaseAnalyzer {
  getLanguageId(): string {
    return 'javascript';
  }

  analyze(code: string): Bug[] {
    const bugs: Bug[] = [];
    
    // Run security checks (common to all languages)
    bugs.push(...this.checkSecurityIssues(code));
    
    // Run code quality checks
    bugs.push(...this.checkCodeQuality(code));
    
    // JavaScript-specific checks
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // == vs ===
      if (/\s==\s(?!=)/.test(line) && !/===\s*["'0]/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'JavaScript',
          'Use === instead of ==',
          'Using loose equality (==) can lead to unexpected type coercion.',
          'Use strict equality (===) for comparisons.',
          line.indexOf('=='),
          line.trim()
        ));
      }
      
      // var usage
      if (/\bvar\s+\w+/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'JavaScript',
          'Use let or const instead of var',
          'The var keyword has function scope which can lead to bugs. Use let or const instead.',
          'Replace var with let or const for block-scoped variables.',
          line.indexOf('var'),
          line.trim()
        ));
      }
      
      // new Array()
      if (/new\s+Array\s*\(/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'JavaScript',
          'Avoid new Array()',
          'new Array() has confusing behavior with single number arguments.',
          'Use array literal [] or Array.of() instead.',
          line.indexOf('new Array'),
          line.trim()
        ));
      }
      
      // document.write
      if (/document\.write\s*\(/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'JavaScript',
          'Avoid document.write()',
          'document.write() can overwrite the entire page if called after page load.',
          'Use DOM manipulation methods like document.createElement() instead.',
          line.indexOf('document.write'),
          line.trim()
        ));
      }
      
      // innerHTML
      if (/\.innerHTML\s*=/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Security',
          'Potential XSS via innerHTML',
          'Setting innerHTML with user input can lead to XSS attacks.',
          'Use textContent instead, or sanitize user input before using innerHTML.',
          line.indexOf('innerHTML'),
          line.trim()
        ));
      }
      
      // setTimeout with string
      if (/setTimeout\s*\(\s*["']/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'JavaScript',
          'setTimeout with string is dangerous',
          'Using setTimeout/setInterval with string arguments uses eval() internally.',
          'Pass a function reference instead: setTimeout(() => {...}, 1000)',
          line.indexOf('setTimeout'),
          line.trim()
        ));
      }
      
      // Nested callbacks (callback hell indicator)
      if (line.includes('.then(') || line.includes('.catch(')) {
        const nextLine = lines[index + 1];
        if (nextLine && (nextLine.includes('.then(') || nextLine.includes('.catch('))) {
          bugs.push(this.createBug(
            lineNum,
            'info',
            'JavaScript',
            'Consider using async/await',
            'Chained promises can lead to "callback hell".',
            'Consider using async/await for cleaner asynchronous code.',
            undefined,
            line.trim()
          ));
        }
      }
      
      // debugger statement
      if (/debugger;?$/.test(line.trim())) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'JavaScript',
          'Debugger Statement',
          'A debugger statement was found in the code.',
          'Remove debugger statements before deploying to production.',
          line.indexOf('debugger'),
          line.trim()
        ));
      }
      
      // TypeScript: any type
      if (/\w+:\s*any\b/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'TypeScript',
          'Avoid using "any" type',
          'Using "any" defeats the purpose of TypeScript\'s type system.',
          'Use proper types or unknown if type is truly unknown.',
          line.indexOf('any'),
          line.trim()
        ));
      }
      
      // @ts-ignore
      if (/\/\/\s*@ts-ignore|\/\*\s*@ts-ignore/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'TypeScript',
          'ts-ignore comment found',
          '@ts-ignore bypasses TypeScript type checking.',
          'Address the underlying type error instead of ignoring it.',
          line.indexOf('@ts-ignore'),
          line.trim()
        ));
      }
      
      // === vs !== for null check
      if (/===?\s*null|!==\s*null/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'JavaScript',
          'Consider using optional chaining',
          'Null checks can be simplified with optional chaining (?.) and nullish coalescing (??).',
          'Consider using optional chaining for safer property access.',
          undefined,
          line.trim()
        ));
      }
    });
    
    // Check for unused variables (simple pattern)
    const variableDeclarations = code.match(/(?:const|let|var)\s+(\w+)/g) || [];
    const usedVariables = code.match(/\b(\w+)\b(?!\s*(?:=|:))/g) || [];
    
    // Check for console.log without proper error handling
    const hasConsoleLog = /console\.log\s*\(/.test(code);
    const hasErrorHandling = /try\s*\{/.test(code) || /catch\s*\(/.test(code);
    
    if (hasConsoleLog && !hasErrorHandling) {
      // Add at the line where console.log is found
      const consoleLine = code.split('\n').findIndex(l => l.includes('console.log'));
      if (consoleLine !== -1) {
        bugs.push(this.createBug(
          consoleLine + 1,
          'info',
          'Code Quality',
          'Console logging without error handling',
          'Console statements should have appropriate error handling in production.',
          'Consider using a proper logging library with log levels.',
          undefined,
          this.getLine(code, consoleLine + 1)
        ));
      }
    }
    
    return bugs;
  }
}

export class TypeScriptAnalyzer extends JavaScriptAnalyzer {
  getLanguageId(): string {
    return 'typescript';
  }
}
