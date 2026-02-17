'use client';

import { SUPPORTED_LANGUAGES } from '@/lib/types';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
}

export function CodeEditor({ code, onChange, language, onLanguageChange }: CodeEditorProps) {
  return (
    <div className="code-editor-container">
      <div className="editor-header">
        <div className="language-selector">
          <label htmlFor="language">Language:</label>
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
        <button
          onClick={() => onChange('')}
          className="clear-btn"
        >
          Clear
        </button>
      </div>
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`// Paste or type your ${language} code here...
// The analyzer will detect bugs, security issues, and code quality problems.

function example() {
  // Try adding some buggy code to see the analyzer in action!
}`}
        className="code-textarea"
        spellCheck={false}
      />
      <div className="editor-footer">
        <span className="char-count">{code.length} characters</span>
        <span className="line-count">{code.split('\n').length} lines</span>
      </div>

      <style jsx>{`
        .code-editor-container {
          background: #12121a;
          border-radius: 12px;
          border: 1px solid #2a2a3a;
          overflow: hidden;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #1a1a24;
          border-bottom: 1px solid #2a2a3a;
        }

        .language-selector {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .language-selector label {
          color: #8888aa;
          font-size: 0.875rem;
        }

        .language-select {
          background: #0a0a0f;
          color: #ffffff;
          border: 1px solid #2a2a3a;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .language-select:hover,
        .language-select:focus {
          border-color: #00ff88;
          outline: none;
        }

        .clear-btn {
          background: transparent;
          color: #8888aa;
          border: 1px solid #2a2a3a;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-btn:hover {
          color: #ff3366;
          border-color: #ff3366;
        }

        .code-textarea {
          width: 100%;
          min-height: 300px;
          background: #0a0a0f;
          color: #ffffff;
          border: none;
          padding: 16px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.875rem;
          line-height: 1.6;
          resize: vertical;
          outline: none;
        }

        .code-textarea::placeholder {
          color: #4a4a5a;
        }

        .editor-footer {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          padding: 8px 16px;
          background: #1a1a24;
          border-top: 1px solid #2a2a3a;
        }

        .char-count,
        .line-count {
          color: #4a4a5a;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}
