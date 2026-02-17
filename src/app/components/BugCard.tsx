'use client';

import { Bug } from '@/lib/types';

interface BugCardProps {
  bug: Bug;
}

export function BugCard({ bug }: BugCardProps) {
  const severityConfig = {
    critical: {
      color: '#ff3366',
      bg: 'rgba(255, 51, 102, 0.1)',
      border: 'rgba(255, 51, 102, 0.3)',
      label: 'CRITICAL',
    },
    warning: {
      color: '#ffaa00',
      bg: 'rgba(255, 170, 0, 0.1)',
      border: 'rgba(255, 170, 0, 0.3)',
      label: 'WARNING',
    },
    info: {
      color: '#00aaff',
      bg: 'rgba(0, 170, 255, 0.1)',
      border: 'rgba(0, 170, 255, 0.3)',
      label: 'INFO',
    },
  };

  const config = severityConfig[bug.severity];

  return (
    <div className="bug-card" style={{ borderLeftColor: config.border }}>
      <div className="bug-header">
        <span className="severity-badge" style={{ background: config.bg, color: config.color }}>
          {config.label}
        </span>
        <span className="line-number">Line {bug.line}</span>
        <span className="category">{bug.category}</span>
      </div>
      
      <h3 className="bug-title" style={{ color: config.color }}>
        {bug.message}
      </h3>
      
      <p className="bug-description">{bug.description}</p>
      
      {bug.codeSnippet && (
        <div className="code-snippet">
          <code>{bug.codeSnippet}</code>
        </div>
      )}
      
      <div className="suggestion">
        <span className="suggestion-label">Fix:</span>
        <span className="suggestion-text">{bug.suggestion}</span>
      </div>

      <style jsx>{`
        .bug-card {
          background: #12121a;
          border: 1px solid #2a2a3a;
          border-left: 4px solid;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .bug-card:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .bug-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .severity-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .line-number {
          color: #8888aa;
          font-size: 0.8rem;
          font-family: 'JetBrains Mono', monospace;
        }

        .category {
          color: #4a4a5a;
          font-size: 0.75rem;
          background: #1a1a24;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .bug-title {
          margin: 0 0 8px 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .bug-description {
          color: #8888aa;
          font-size: 0.875rem;
          line-height: 1.5;
          margin: 0 0 12px 0;
        }

        .code-snippet {
          background: #0a0a0f;
          border: 1px solid #2a2a3a;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 12px;
          overflow-x: auto;
        }

        .code-snippet code {
          color: #00ff88;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
        }

        .suggestion {
          background: rgba(0, 255, 136, 0.05);
          border: 1px solid rgba(0, 255, 136, 0.2);
          border-radius: 6px;
          padding: 12px;
        }

        .suggestion-label {
          color: #00ff88;
          font-weight: 600;
          margin-right: 8px;
        }

        .suggestion-text {
          color: #8888aa;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
