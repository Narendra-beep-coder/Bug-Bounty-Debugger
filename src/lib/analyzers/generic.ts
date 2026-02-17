import { Bug } from '../types';
import { BaseAnalyzer } from './base';

// Generic analyzer for C, C++, C#, Go, Rust, PHP, Ruby, HTML, CSS
export class GenericAnalyzer extends BaseAnalyzer {
  private languageName: string;

  constructor(languageId: string, languageName: string) {
    super();
    this.languageId = languageId;
    this.languageName = languageName;
  }

  private languageId: string;

  getLanguageId(): string {
    return this.languageId;
  }

  analyze(code: string): Bug[] {
    const bugs: Bug[] = [];
    
    // Run security checks (common to all languages)
    bugs.push(...this.checkSecurityIssues(code));
    
    // Run code quality checks
    bugs.push(...this.checkCodeQuality(code));
    
    // Language-specific checks
    switch (this.languageId) {
      case 'c':
      case 'cpp':
        bugs.push(...this.analyzeCAndCpp(code));
        break;
      case 'csharp':
        bugs.push(...this.analyzeCSharp(code));
        break;
      case 'go':
        bugs.push(...this.analyzeGo(code));
        break;
      case 'rust':
        bugs.push(...this.analyzeRust(code));
        break;
      case 'php':
        bugs.push(...this.analyzePHP(code));
        break;
      case 'ruby':
        bugs.push(...this.analyzeRuby(code));
        break;
      case 'html':
        bugs.push(...this.analyzeHTML(code));
        break;
      case 'css':
        bugs.push(...this.analyzeCSS(code));
        break;
    }
    
    return bugs;
  }

  private analyzeCAndCpp(code: string): Bug[] {
    const bugs: Bug[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // gets() usage (removed from C11)
      if (/\bgets\s*\(/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'critical',
          'C/C++',
          'Dangerous gets() function',
          'gets() does not check buffer bounds and was removed from C11.',
          'Use fgets() instead: fgets(buffer, size, stdin)',
          line.indexOf('gets'),
          line.trim()
        ));
      }
      
      // strcpy/strcat without size limit
      if (/\bstrcpy\s*\([^,]+,\s*[^)]+\)/.test(line) || /\bstrcat\s*\([^,]+,\s*[^)]+\)/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'critical',
          'C/C++',
          'Unbounded string operation',
          'strcpy/strcat can cause buffer overflows.',
          'Use strncpy/strncat with size limits, or prefer safer alternatives.',
          line.indexOf('strcpy') >= 0 ? line.indexOf('strcpy') : line.indexOf('strcat'),
          line.trim()
        ));
      }
      
      // printf with %s from user input
      if (/printf\s*\([^)]*%s[^)]*\)\s*\([^)]*(?:scanf|gets|fgets)/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'critical',
          'C/C++',
          'Format string vulnerability',
          'printf with %s using unsanitized input can cause format string attacks.',
          'Use printf("%s", variable) instead of printf(variable)',
          line.indexOf('printf'),
          line.trim()
        ));
      }
      
      // scanf without width limit
      if (/scanf\s*\(\s*"%[^"]*s"/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'C/C++',
          'scanf without width limit',
          'scanf %s has no buffer size limit.',
          'Use width specifier: scanf("%99s", buffer) for a 100-byte buffer.',
          line.indexOf('scanf'),
          line.trim()
        ));
      }
      
      // malloc without check
      if (/\bmalloc\s*\([^)]+\)\s*;?\s*$/.test(line) && !line.includes('if')) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'C/C++',
          'Unchecked malloc return',
          'malloc can return NULL on failure.',
          'Check the return value of malloc before use.',
          line.indexOf('malloc'),
          line.trim()
        ));
      }
      
      // free twice (double free)
      if (/free\s*\([^)]+\)\s*;?\s*$/m.test(line)) {
        // Look for duplicate frees
        const funcMatches = line.match(/free\s*\(\s*(\w+)\s*\)/);
        if (funcMatches) {
          const varName = funcMatches[1];
          const prevFree = code.substring(0, code.indexOf(line)).match(new RegExp(`free\\s*\\(\\s*${varName}\\s*\\)`));
          if (prevFree) {
            bugs.push(this.createBug(
              lineNum,
              'critical',
              'C/C++',
              'Double free vulnerability',
              'This memory was already freed. Double free can cause crashes or security issues.',
              'Ensure memory is only freed once, or set pointer to NULL after freeing.',
              line.indexOf('free'),
              line.trim()
            ));
          }
        }
      }
      
      // using == for pointer comparison (warning)
      if (/if\s*\(\s*\w+\s*==\s*(?:NULL|nullptr)\s*\)/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'C/C++',
          'Pointer comparison style',
          'Consider using implicit check: if (ptr) instead of if (ptr == NULL)',
          'Modern C/C++ style prefers: if (ptr) or if (!ptr)',
          line.indexOf('=='),
          line.trim()
        ));
      }
      
      // TODO comments
      if (/\/\/\s*TODO|\/\*\s*TODO/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'Code Quality',
          'TODO comment',
          'There is an unfinished task marker in the code.',
          'Address the TODO or create a tracking issue.',
          line.indexOf('TODO'),
          line.trim()
        ));
      }
    });
    
    return bugs;
  }

  private analyzeCSharp(code: string): Bug[] {
    const bugs: Bug[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // SQL injection risk
      if (/(?:SELECT|INSERT|UPDATE|DELETE)\s+.*\+/.test(line) || /"\s*\+\s*\w+\s*\+\s*"/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'critical',
          'C#',
          'Potential SQL Injection',
          'SQL query built with string concatenation is vulnerable.',
          'Use parameterized queries or an ORM.',
          line.indexOf('SELECT') >= 0 ? line.indexOf('SELECT') : line.indexOf('INSERT'),
          line.trim()
        ));
      }
      
      // Response.Redirect with user input
      if (/Response\.Redirect\s*\([^)]*(?:Request|QueryString|Form)/i.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'C#',
          'Open Redirect vulnerability',
          'Redirecting based on user input can lead to phishing attacks.',
          'Validate the redirect URL or use a whitelist of allowed URLs.',
          line.indexOf('Response.Redirect'),
          line.trim()
        ));
      }
      
      // Hardcoded connection string
      if (/connectionString\s*=\s*["'][^"']*(?:password|pwd)[^"']*["']/i.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'critical',
          'Security',
          'Hardcoded credentials',
          'Connection string contains hardcoded credentials.',
          'Use secure configuration or Azure Key Vault.',
          line.indexOf('connectionString'),
          line.trim()
        ));
      }
      
      // empty catch block
      if (/catch\s*\([^)]+\)\s*\{\s*\}/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Code Quality',
          'Empty catch block',
          'Empty catch blocks silently swallow exceptions.',
          'Log the exception or handle it appropriately.',
          line.indexOf('catch'),
          line.trim()
        ));
      }
      
      // TODO
      if (/\/\/\s*TODO/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'Code Quality',
          'TODO comment',
          'There is an unfinished task marker.',
          'Address the TODO.',
          line.indexOf('TODO'),
          line.trim()
        ));
      }
    });
    
    return bugs;
  }

  private analyzeGo(code: string): Bug[] {
    const bugs: Bug[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // fmt.Print in production
      if (/^package\s+main/.test(line.trim()) || lines.some(l => l.includes('package main'))) {
        if (/fmt\.Print(ln)?\s*\(/.test(line)) {
          bugs.push(this.createBug(
            lineNum,
            'info',
            'Go',
            'fmt.Print usage',
            'Use a logging library instead of fmt.Print in production.',
            'Use log package or a structured logger like zap or logrus.',
            line.indexOf('fmt.Print'),
            line.trim()
          ));
        }
      }
      
      // Error not checked
      if (/\berr\s*:=\s*/.test(line)) {
        const nextLine = lines[index + 1];
        if (nextLine && !nextLine.includes('if err != nil') && !nextLine.includes('return err')) {
          bugs.push(this.createBug(
            lineNum,
            'warning',
            'Go',
            'Error not checked',
            'Error return value is not being checked.',
            'Handle the error or explicitly ignore it with _.',
            line.indexOf('err :='),
            line.trim()
          ));
        }
      }
      
      // TODO
      if (/\/\/\s*TODO/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'Code Quality',
          'TODO comment',
          'There is an unfinished task marker.',
          'Address the TODO.',
          line.indexOf('TODO'),
          line.trim()
        ));
      }
      
      // strconv.Parse without error check
      if (/strconv\.(ParseInt|ParseFloat|ParseBool)\s*\(/.test(line)) {
        const nextLine = lines[index + 1];
        if (nextLine && !nextLine.includes('if err != nil')) {
          bugs.push(this.createBug(
            lineNum,
            'warning',
            'Go',
            'Parse error not checked',
            'strconv result should check for conversion errors.',
            'Check the error return value.',
            line.indexOf('strconv'),
            line.trim()
          ));
        }
      }
    });
    
    return bugs;
  }

  private analyzeRust(code: string): Bug[] {
    const bugs: Bug[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // unwrap() usage
      if (/\.unwrap\(\)/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Rust',
          'unwrap() can panic',
          'unwrap() will panic if the value is None or Err.',
          'Use proper error handling with ? or match.',
          line.indexOf('unwrap'),
          line.trim()
        ));
      }
      
      // expect() usage
      if (/\.expect\(/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Rust',
          'expect() can panic',
          'expect() will panic if the value is None or Err.',
          'Use proper error handling with ? or match.',
          line.indexOf('expect'),
          line.trim()
        ));
      }
      
      // unsafe block
      if (/unsafe\s*\{/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Rust',
          'unsafe block',
          'unsafe blocks bypass Rust\'s safety guarantees.',
          'Minimize unsafe code and document safety invariants.',
          line.indexOf('unsafe'),
          line.trim()
        ));
      }
      
      // TODO
      if (/\/\/\s*TODO/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'Code Quality',
          'TODO comment',
          'There is an unfinished task marker.',
          'Address the TODO.',
          line.indexOf('TODO'),
          line.trim()
        ));
      }
    });
    
    return bugs;
  }

  private analyzePHP(code: string): Bug[] {
    const bugs: Bug[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // $_GET/$_POST directly in SQL
      if (/\$._(?:GET|POST|REQUEST)\s*\[.*\]\s*\.?\s*(?:SELECT|INSERT|UPDATE|DELETE)/i.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'critical',
          'PHP',
          'SQL Injection vulnerability',
          'User input is directly used in SQL queries.',
          'Use prepared statements: $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?")',
          line.indexOf('$_GET') >= 0 ? line.indexOf('$_GET') : line.indexOf('$_POST'),
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
          'eval() can execute arbitrary code and is extremely dangerous.',
          'Never use eval() with user input.',
          line.indexOf('eval'),
          line.trim()
        ));
      }
      
      // echo with user input
      if (/echo\s*\$_(?:GET|POST|REQUEST|COOKIE)\s*\[/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'critical',
          'PHP',
          'XSS vulnerability',
          'User input is being echoed without sanitization.',
          'Use htmlspecialchars() or a templating engine.',
          line.indexOf('echo'),
          line.trim()
        ));
      }
      
      // password_hash not used
      if (/password\s*=\s*\$_POST/i.test(line) && !line.includes('password_hash')) {
        bugs.push(this.createBug(
          lineNum,
          'critical',
          'Security',
          'Insecure password storage',
          'Passwords should be hashed using password_hash().',
          'Use: password_hash($password, PASSWORD_DEFAULT)',
          line.indexOf('password'),
          line.trim()
        ));
      }
      
      // var_dump in production
      if (/var_dump\s*\(/.test(line) || /print_r\s*\(\s*\$_/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'PHP',
          'Debug code in production',
          'Debug functions should not be in production code.',
          'Remove var_dump, print_r, and console.log statements.',
          line.indexOf('var_dump') >= 0 ? line.indexOf('var_dump') : line.indexOf('print_r'),
          line.trim()
        ));
      }
      
      // TODO
      if (/\/\/\s*TODO|#\s*TODO/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'Code Quality',
          'TODO comment',
          'There is an unfinished task marker.',
          'Address the TODO.',
          line.indexOf('TODO'),
          line.trim()
        ));
      }
    });
    
    return bugs;
  }

  private analyzeRuby(code: string): Bug[] {
    const bugs: Bug[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // SQL injection in Ruby
      if (/execute\s*\(\s*["'][^"']*\#\{/.test(line) || /where\s*\(\s*[^:]+:\s*params/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'critical',
          'Ruby',
          'Potential SQL Injection',
          'SQL query uses string interpolation which can be vulnerable.',
          'Use parameterized queries: User.where("name = ?", params[:name])',
          line.indexOf('execute') >= 0 ? line.indexOf('execute') : line.indexOf('where'),
          line.trim()
        ));
      }
      
      // eval usage
      if (/\beval\s*\(/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'critical',
          'Security',
          'Dangerous eval() usage',
          'eval() can execute arbitrary code.',
          'Avoid eval() or sanitize input thoroughly.',
          line.indexOf('eval'),
          line.trim()
        ));
      }
      
      // puts with user input in view
      if (/puts\s+params/.test(line) || /render\s+text:\s*params/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'Ruby',
          'Potential XSS',
          'User parameters are being rendered without escaping.',
          'Use proper escaping or sanitize user input.',
          line.indexOf('puts') >= 0 ? line.indexOf('puts') : line.indexOf('render'),
          line.trim()
        ));
      }
      
      // TODO
      if (/#\s*TODO|#\s*FIXME/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'Code Quality',
          'TODO comment',
          'There is an unfinished task marker.',
          'Address the TODO.',
          line.indexOf('TODO'),
          line.trim()
        ));
      }
    });
    
    return bugs;
  }

  private analyzeHTML(code: string): Bug[] {
    const bugs: Bug[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // inline JavaScript (security)
      if (/<script\s+[^>]*>/i.test(line) && !line.includes('src=')) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'HTML',
          'Inline script',
          'Inline scripts can be XSS vectors. Use external scripts.',
          'Move JavaScript to external files.',
          line.indexOf('<script'),
          line.trim()
        ));
      }
      
      // form without method
      if (/<form[^>]*>/i.test(line) && !/method=/i.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'HTML',
          'Form without method attribute',
          'Default method is GET, which exposes data in URL.',
          'Use method="POST" for sensitive data.',
          line.indexOf('<form'),
          line.trim()
        ));
      }
      
      // form without action
      if (/<form[^>]*>/i.test(line) && !/action=/i.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'HTML',
          'Form without action',
          'Form submits to current URL. Consider adding explicit action.',
          'Add action attribute or use JavaScript to handle submission.',
          line.indexOf('<form'),
          line.trim()
        ));
      }
      
      // autocomplete on sensitive fields
      if (/<input[^>]*(?:password|credit|card|cvv)/i.test(line) && !/autocomplete/i.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'HTML',
          'Missing autocomplete on sensitive fields',
          'Browsers may cache sensitive data.',
          'Set autocomplete="off" for sensitive fields.',
          line.indexOf('<input'),
          line.trim()
        ));
      }
      
      // target="_blank" without rel="noopener"
      if (/<a[^>]*target\s*=\s*["']_blank["']/i.test(line) && !/rel\s*=\s*["']/i.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'HTML',
          'Missing rel="noopener" on target="_blank"',
          'New page can access window.opener (phishing risk).',
          'Add rel="noopener noreferrer" to links with target="_blank".',
          line.indexOf('target'),
          line.trim()
        ));
      }
      
      // missing alt on img
      if (/<img[^>]*>/i.test(line) && !/alt\s*=/i.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'HTML',
          'Missing alt attribute on image',
          'Images should have alt text for accessibility.',
          'Add alt="description" to the img tag.',
          line.indexOf('<img'),
          line.trim()
        ));
      }
    });
    
    return bugs;
  }

  private analyzeCSS(code: string): Bug[] {
    const bugs: Bug[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // !important overuse
      if (/\s!important/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'warning',
          'CSS',
          '!important usage',
          'Overusing !important makes CSS hard to maintain.',
          'Use more specific selectors instead.',
          line.indexOf('!important'),
          line.trim()
        ));
      }
      
      // hardcoded colors (info)
      if (/#[0-9a-fA-F]{6}\b/.test(line) || /rgb\s*\(/.test(line)) {
        // Check if it's a magic number color
        if (!line.includes('var(') && !line.includes('--')) {
          bugs.push(this.createBug(
            lineNum,
            'info',
            'CSS',
            'Hardcoded color value',
            'Consider using CSS custom properties for colors.',
            'Use CSS variables: color: var(--primary-color)',
            line.indexOf('#') >= 0 ? line.indexOf('#') : line.indexOf('rgb'),
            line.trim()
          ));
        }
      }
      
      // pixel values for font-size
      if (/font-size:\s*\d+px/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'CSS',
          'Pixel font-size',
          'Use relative units (rem, em) for better accessibility.',
          'Use rem or em units for scalable typography.',
          line.indexOf('font-size'),
          line.trim()
        ));
      }
      
      // browser-specific prefixes
      if (/-webkit-|-moz-|-ms-|-o-/.test(line)) {
        bugs.push(this.createBug(
          lineNum,
          'info',
          'CSS',
          'Vendor prefix',
          'Vendor prefixes may not be needed for modern properties.',
          'Check if the unprefixed version is now supported.',
          line.indexOf('-webkit') >= 0 ? line.indexOf('-webkit') : line.indexOf('-moz'),
          line.trim()
        ));
      }
    });
    
    return bugs;
  }
}

// Factory function to get the right analyzer
export function getAnalyzer(languageId: string) {
  switch (languageId) {
    case 'javascript':
      const { JavaScriptAnalyzer } = require('./javascript');
      return new JavaScriptAnalyzer();
    case 'typescript':
      const { TypeScriptAnalyzer } = require('./javascript');
      return new TypeScriptAnalyzer();
    case 'python':
      const { PythonAnalyzer } = require('./python');
      return new PythonAnalyzer();
    case 'java':
      const { JavaAnalyzer } = require('./java');
      return new JavaAnalyzer();
    case 'c':
      return new GenericAnalyzer('c', 'C');
    case 'cpp':
      return new GenericAnalyzer('cpp', 'C++');
    case 'csharp':
      return new GenericAnalyzer('csharp', 'C#');
    case 'go':
      return new GenericAnalyzer('go', 'Go');
    case 'rust':
      return new GenericAnalyzer('rust', 'Rust');
    case 'php':
      return new GenericAnalyzer('php', 'PHP');
    case 'ruby':
      return new GenericAnalyzer('ruby', 'Ruby');
    case 'html':
      return new GenericAnalyzer('html', 'HTML');
    case 'css':
      return new GenericAnalyzer('css', 'CSS');
    default:
      return new GenericAnalyzer('generic', 'Unknown');
  }
}
