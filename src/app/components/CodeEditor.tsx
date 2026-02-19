'use client';

import { useState, useRef, useEffect } from 'react';
import { SUPPORTED_LANGUAGES } from '@/lib/types';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
}

export function CodeEditor({ code, onChange, language, onLanguageChange }: CodeEditorProps) {
  const [focused, setFocused] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = code.split('\n');
  const lineCount = lines.length || 1;

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(text);
    } catch (err) {
      console.log('Paste from clipboard not available');
    }
  };

  const copyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (code.trim()) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getLanguageColor = (lang: string) => {
    const colors: Record<string, string> = {
      javascript: '#f7df1e',
      typescript: '#3178c6',
      python: '#3572A5',
      java: '#b07219',
      c: '#555555',
      cpp: '#f34b7d',
      csharp: '#178600',
      go: '#00ADD8',
      rust: '#dea584',
      php: '#4F5D95',
      ruby: '#701516',
      html: '#e34c26',
      css: '#563d7c',
    };
    return colors[lang] || '#00ff88';
  };

  return (
    <div className={`code-editor-container ${focused ? 'focused' : ''}`}>
      <div className="editor-header">
        <div className="header-left">
          <div className="window-dots">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
          <div className="file-name">
            <span className="file-icon" style={{ color: getLanguageColor(language) }}>◆</span>
            <span>code.{language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language}</span>
          </div>
        </div>
        <div className="header-right">
          <button
            onClick={handlePaste}
            className="action-btn"
            title="Paste from clipboard"
          >
            📋 Paste
          </button>
          <button
            onClick={copyCode}
            className="action-btn"
            title="Copy code"
          >
            {copied ? '✓ Copied' : '📄 Copy'}
          </button>
          <button
            onClick={() => onChange('')}
            className="action-btn clear"
            title="Clear editor"
          >
            🗑 Clear
          </button>
        </div>
      </div>

      <div className="editor-body">
        <div className="line-numbers" ref={lineNumbersRef}>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} className="line-number">
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onScroll={handleScroll}
          placeholder={`// Paste or type your ${language} code here...
// The analyzer will detect bugs, security issues, and code quality problems.

function example() {
  // Try adding some buggy code to see the analyzer in action!
}`}
          className="code-textarea"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>

      <div className="editor-footer">
        <div className="language-selector">
          <label htmlFor="language">
            <span className="label-icon">⚙</span>
            Language:
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="language-select"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
        <div className="editor-stats">
          <span className="stat">
            <span className="stat-icon">📝</span>
            {code.length} chars
          </span>
          <span className="stat">
            <span className="stat-icon">📄</span>
            {lineCount} lines
          </span>
          <span className="stat">
            <span className="stat-icon">🔤</span>
            {code.split(/\s+/).filter(w => w).length} words
          </span>
        </div>
      </div>

      <style jsx>{`
        .code-editor-container {
          background: #0d0d12;
          border-radius: 16px;
          border: 2px solid #1a1a24;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
        }

        .code-editor-container.focused {
          border-color: #00ff88;
          box-shadow: 0 0 30px rgba(0, 255, 136, 0.15), 0 8px 32px rgba(0, 0, 0, 0.4);
          transform: translateY(-2px);
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: linear-gradient(180deg, #1a1a24 0%, #141418 100%);
          border-bottom: 1px solid #2a2a3a;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .window-dots {
          display: flex;
          gap: 8px;
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          transition: transform 0.2s;
        }

        .dot:hover {
          transform: scale(1.2);
        }

        .dot.red { background: #ff5f56; }
        .dot.yellow { background: #ffbd2e; }
        .dot.green { background: #27ca40; }

        .file-name {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #8888aa;
          font-size: 0.875rem;
          font-family: 'JetBrains Mono', monospace;
        }

        .file-icon {
          font-size: 1rem;
        }

        .header-right {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          background: #252530;
          color: #8888aa;
          border: 1px solid #2a2a3a;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .action-btn:hover {
          background: #2a2a3a;
          color: #00ff88;
          border-color: #00ff88;
          transform: translateY(-1px);
        }

        .action-btn.clear:hover {
          color: #ff3366;
          border-color: #ff3366;
        }

        .editor-body {
          display: flex;
          min-height: 320px;
          max-height: 500px;
        }

        .line-numbers {
          background: #0a0a0f;
          padding: 16px 0;
          text-align: right;
          user-select: none;
          border-right: 1px solid #1a1a24;
          overflow: hidden;
          min-width: 50px;
        }

        .line-number {
          color: #3a3a4a;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.875rem;
          line-height: 1.6;
          padding: 0 12px;
          transition: color 0.2s;
        }

        .code-textarea:focus .line-number {
          color: #4a4a5a;
        }

        .code-textarea {
          flex: 1;
          background: #0a0a0f;
          color: #e0e0e0;
          border: none;
          padding: 16px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.875rem;
          line-height: 1.6;
          resize: none;
          outline: none;
          overflow-y: auto;
        }

        .code-textarea::placeholder {
          color: #3a3a4a;
        }

        .code-textarea::selection {
          background: rgba(0, 255, 136, 0.3);
        }

        .editor-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          background: linear-gradient(180deg, #141418 0%, #1a1a24 100%);
          border-top: 1px solid #2a2a3a;
          flex-wrap: wrap;
          gap: 12px;
        }

        .language-selector {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .language-selector label {
          color: #6a6a7a;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .label-icon {
          font-size: 0.875rem;
        }

        .language-select {
          background: #0a0a0f;
          color: #00ff88;
          border: 1px solid #2a2a3a;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'JetBrains Mono', monospace;
        }

        .language-select:hover,
        .language-select:focus {
          border-color: #00ff88;
          outline: none;
          box-shadow: 0 0 10px rgba(0, 255, 136, 0.2);
        }

        .language-select option {
          background: #0a0a0f;
          color: #ffffff;
        }

        .editor-stats {
          display: flex;
          gap: 16px;
        }

        .stat {
          color: #4a4a5a;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: color 0.2s;
        }

        .stat:hover {
          color: #6a6a7a;
        }

        .stat-icon {
          font-size: 0.7rem;
        }

        @media (max-width: 640px) {
          .editor-header {
            flex-direction: column;
            gap: 12px;
          }
          
          .header-right {
            width: 100%;
            justify-content: center;
          }
          
          .editor-footer {
            flex-direction: column;
            align-items: stretch;
          }
          
          .editor-stats {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
