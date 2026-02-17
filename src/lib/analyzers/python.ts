import { Bug } from '../types';
import { BaseAnalyzer } from './base';

export class PythonAnalyzer extends BaseAnalyzer {
  getLanguageId(): string {
    return 'python';
  }

  analyze(code: string): Bug[] {
    const bugs: Bug[] = [];
    
    // Run security checks (common to all languages)
    bugs.push(...this.checkSecurityIssues(code));
    
    // Run code quality checks
    bugs.push(...this.checkCodeQuality(code));
    
    const lines = code.split('\n');
    let inFunction = false;
    let functionStartLine = 0;
    let functionName = '';
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();
      
      // except: (bare except)
      if (/except\s*:/.test(line) && !/except\s+\w+\s*:/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Python',
          'Bare except clause',
          'Bare except clauses catch all exceptions, including KeyboardInterrupt.',
          'Specify the exception type: except ValueError: or use except Exception:',
          line.indexOf('except'),
          line.trim()
        ));
      }
      
      // print statement (Python 2)
      if (/^print\s+[^(]/.test(trimmed) && !trimmed.startsWith('#')) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Python',
          'Python 2 print statement',
          'This looks like a Python 2 print statement instead of a function.',
          'Use print() function: print("message")',
          line.indexOf('print'),
          line.trim()
        ));
      }
      
      // == for None comparison
      if (/\s==\s+None\b/.test(line) || /\bNone\s+==\s/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Python',
          'Use "is None" instead of "== None"',
          'Use "is None" for None comparisons.',
          'Use "is None" or "is not None" for None comparisons.',
          line.indexOf('=='),
          line.trim()
        ));
      }
      
      // mutable default arguments
      if (/def\s+\w+\s*\([^)]*=\s*[\[\{]/.test(line)) {
        const match = line.match(/def\s+(\w+)\s*\(([^)]*)\)/);
        if (match) {
          const params = match[2];
          if (/[\[\{]=/.test(params)) {
            bugs.push(this.createBug(
              lineNum,
              'critical',
              'Python',
              'Mutable default argument',
              'Mutable default arguments are shared between all calls.',
              'Use None as default and create new objects inside the function.',
              line.indexOf('[') >= 0 ? line.indexOf('[') : line.indexOf('{'),
              line.trim()
            ));
          }
        }
      }
      
      // from module import * 
      if (/from\s+\w+\s+import\s+\*/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Python',
          'Wildcard import',
          'Wildcard imports pollute the namespace and make code harder to understand.',
          'Import specific names: from module import name1, name2',
          line.indexOf('import'),
          line.trim()
        ));
      }
      
      // os.system / subprocess with shell=True
      if (/os\.system\s*\(/.test(line) || /subprocess\.(call|run|Popen)\s*\([^)]*shell\s*=\s*True/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'critical',
          'Security',
          'Shell injection vulnerability',
          'Using shell=True or os.system() can lead to shell injection attacks.',
          'Use subprocess with shell=False and pass arguments as a list.',
          line.indexOf('os.system') >= 0 ? line.indexOf('os.system') : line.indexOf('subprocess'),
          line.trim()
        ));
      }
      
      // pickle
      if (/pickle\.(load|loads)\s*\(/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'critical',
          'Security',
          'Insecure deserialization with pickle',
          'pickle can deserialize malicious code. Never unpickle untrusted data.',
          'Use JSON for data serialization or a secure library.',
          line.indexOf('pickle'),
          line.trim()
        ));
      }
      
      // input() in Python 2
      if (/^\s*input\s*\(/.test(trimmed) && !trimmed.startsWith('#')) {
        // Check if it's Python 2 (input does eval)
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Python',
          'input() behavior',
          'In Python 2, input() evaluates the input. In Python 3, it behaves like raw_input().',
          'Ensure you are using Python 3 syntax.',
          line.indexOf('input'),
          line.trim()
        ));
      }
      
      // global variable modification
      if (/^\s*global\s+\w+/.test(trimmed)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Python',
          'Global variable modification',
          'Modifying global variables can lead to hard-to-debug issues.',
          'Consider passing variables as parameters or using a class.',
          line.indexOf('global'),
          line.trim()
        ));
      }
      
      // len() in condition
      if (/\blen\s*\([^)]+\)\s*(?:==|!=|>|<|>=|<=)\s*0\b/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'Python',
          'Unnecessary len() check',
          'Instead of len(x) == 0, use "not x" for cleaner code.',
          'Use "if not x:" instead of "if len(x) == 0:"',
          line.indexOf('len'),
          line.trim()
        ));
      }
      
      // TODO comments in Python
      if (/#\s*TODO|#\s*FIXME|#\s*XXX/.test(trimmed)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'Code Quality',
          'TODO/FIXME comment',
          'There is an unfinished task marker in the code.',
          'Address the TODO or create a tracking issue.',
          line.indexOf('TODO') >= 0 ? line.indexOf('TODO') : line.indexOf('FIXME'),
          line.trim()
        ));
      }
      
      // pass in empty block
      if (/:\s*pass\s*$/.test(trimmed) || /except.*:\s*pass\s*$/.test(trimmed)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'Python',
          'Empty block with pass',
          'Using pass in empty blocks. Consider adding a docstring.',
          'Add a comment or docstring explaining why the block is empty.',
          line.indexOf('pass'),
          line.trim()
        ));
      }
      
      // function definition
      if (/^def\s+(\w+)/.test(trimmed)) {
        const match = trimmed.match(/^def\s+(\w+)/);
        inFunction = true;
        functionStartLine = lineNum;
        functionName = match?.[1] || 'unknown';
      }
      
      // Check function length at function end
      if (inFunction && (trimmed.startsWith('return') || (trimmed === '' && index < lines.length - 1 && lines[index + 1]?.trim().startsWith('def ')))) {
        const functionLength = lineNum - functionStartLine;
        if (functionLength > 30) {
          bugs.push(this.createBug(
            functionStartLine,
            'warning',
            'Code Quality',
            `Long function '${functionName}'`,
            `Function has ${functionLength} lines. Consider breaking it into smaller functions.`,
            'Functions should be kept under 30 lines for better readability.',
            undefined,
            this.getLine(code, functionStartLine)
          ));
        }
        inFunction = false;
      }
      
      // using + for string concatenation in loop
      if (/\+\s*=\s*["']/.test(line) || /\+\s*=\s*\w+\s*\+/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Python',
          'String concatenation in loop',
          'Using + for string concatenation in a loop is inefficient.',
          'Use "".join() or f-strings for better performance.',
          line.indexOf('+'),
          line.trim()
        ));
      }
      
      // eval() usage
      if (/eval\s*\(/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'critical',
          'Security',
          'Dangerous eval() usage',
          'eval() can execute arbitrary code and is a major security risk.',
          'Avoid using eval(). Use ast.literal_eval() for safe evaluation of literals.',
          line.indexOf('eval'),
          line.trim()
        ));
      }
      
      // exec() usage
      if (/exec\s*\(/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'critical',
          'Security',
          'Dangerous exec() usage',
          'exec() can execute arbitrary code and is a major security risk.',
          'Avoid using exec().',
          line.indexOf('exec'),
          line.trim()
        ));
      }
    });
    
    return bugs;
  }
}
