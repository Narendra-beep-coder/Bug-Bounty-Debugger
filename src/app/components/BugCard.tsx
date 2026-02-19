'use client';

import { useState } from 'react';
import { Bug } from '@/lib/types';

interface BugCardProps {
  bug: Bug;
  index?: number;
}

export function BugCard({ bug, index = 0 }: BugCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const severityConfig = {
    critical: {
      color: '#ff3366',
      bg: 'rgba(255, 51, 102, 0.1)',
      border: 'rgba(255, 51, 102, 0.4)',
      glow: 'rgba(255, 51, 102, 0.3)',
      label: 'CRITICAL',
      icon: '⚠',
    },
    warning: {
      color: '#ffaa00',
      bg: 'rgba(255, 170, 0, 0.1)',
      border: 'rgba(255, 170, 0, 0.4)',
      glow: 'rgba(255, 170, 0, 0.3)',
      label: 'WARNING',
      icon: '⚡',
    },
    info: {
      color: '#00aaff',
      bg: 'rgba(0, 170, 255, 0.1)',
      border: 'rgba(0, 170, 255, 0.4)',
      glow: 'rgba(0, 170, 255, 0.3)',
      label: 'INFO',
      icon: 'ℹ',
    },
  };

  const config = severityConfig[bug.severity];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const copyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bug.codeSnippet) {
      await navigator.clipboard.writeText(bug.codeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copySuggestion = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(bug.suggestion);
  };

  return (
    <div 
      className={`bug-card ${expanded ? 'expanded' : ''}`}
      style={{ 
        borderLeftColor: config.border,
        animationDelay: `${index * 0.1}s`,
        '--mouse-x': `${mousePosition.x}px`,
        '--mouse-y': `${mousePosition.y}px`,
      } as React.CSSProperties}
      onMouseMove={handleMouseMove}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="glow-spot" style={{ background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${config.glow}, transparent 40%)` }} />
      
      <div className="bug-header">
        <div className="header-left">
          <span className="severity-badge" style={{ background: config.bg, color: config.color }}>
            <span className="badge-icon">{config.icon}</span>
            {config.label}
          </span>
          <span className="line-number">
            <span className="line-icon">📍</span>
            Line {bug.line}
          </span>
        </div>
        <div className="header-right">
          <span className="category">{bug.category}</span>
          <button 
            className={`expand-btn ${expanded ? 'rotated' : ''}`}
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            ▼
          </button>
        </div>
      </div>
      
      <h3 className="bug-title" style={{ color: config.color }}>
        <span className="title-icon">{config.icon}</span>
        {bug.message}
      </h3>
      
      <p className="bug-description">{bug.description}</p>
      
      {bug.codeSnippet && (
        <div className="code-snippet-wrapper">
          <div className="snippet-header">
            <span className="snippet-label">Problematic Code</span>
            <button 
              className="copy-btn" 
              onClick={copyCode}
              title="Copy code"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <div className="code-snippet">
            <pre><code>{bug.codeSnippet}</code></pre>
          </div>
        </div>
      )}
      
      <div className={`suggestion ${expanded ? 'visible' : ''}`}>
        <div className="suggestion-header">
          <span className="suggestion-label">
            <span className="fix-icon">🔧</span>
            Suggested Fix
          </span>
          <button 
            className="copy-btn small" 
            onClick={copySuggestion}
            title="Copy fix"
          >
            📋
          </button>
        </div>
        <span className="suggestion-text">{bug.suggestion}</span>
      </div>

      <style jsx>{`
        .bug-card {
          background: #0d0d14;
          border: 1px solid #1a1a28;
          border-left: 4px solid;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: slideIn 0.4s ease-out forwards;
          opacity: 0;
          transform: translateX(-20px);
        }

        @keyframes slideIn {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .glow-spot {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .bug-card:hover .glow-spot {
          opacity: 1;
        }

        .bug-card:hover {
          transform: translateX(8px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          border-color: #2a2a3a;
        }

        .bug-card.expanded {
          background: #101018;
        }

        .bug-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .severity-badge {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: transform 0.2s;
        }

        .severity-badge:hover {
          transform: scale(1.05);
        }

        .badge-icon {
          font-size: 0.8rem;
        }

        .line-number {
          color: #8888aa;
          font-size: 0.8rem;
          font-family: 'JetBrains Mono', monospace;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .line-icon {
          font-size: 0.7rem;
        }

        .category {
          color: #5a5a6a;
          font-size: 0.7rem;
          background: #1a1a28;
          padding: 4px 10px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .expand-btn {
          background: #1a1a28;
          border: none;
          color: #6a6a7a;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          transition: all 0.3s;
        }

        .expand-btn:hover {
          background: #252530;
          color: #00ff88;
        }

        .expand-btn.rotated {
          transform: rotate(180deg);
        }

        .bug-title {
          margin: 0 0 12px 0;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.4;
        }

        .title-icon {
          font-size: 0.9rem;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .bug-description {
          color: #8888aa;
          font-size: 0.9rem;
          line-height: 1.6;
          margin: 0 0 16px 0;
        }

        .code-snippet-wrapper {
          margin-bottom: 16px;
        }

        .snippet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .snippet-label {
          color: #6a6a7a;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .copy-btn {
          background: #1a1a28;
          border: 1px solid #2a2a3a;
          color: #8888aa;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 0.7rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .copy-btn:hover {
          background: #252530;
          color: #00ff88;
          border-color: #00ff88;
        }

        .copy-btn.small {
          padding: 2px 6px;
          font-size: 0.65rem;
        }

        .code-snippet {
          background: #08080c;
          border: 1px solid #1a1a28;
          border-radius: 8px;
          padding: 14px;
          overflow-x: auto;
        }

        .code-snippet pre {
          margin: 0;
        }

        .code-snippet code {
          color: #ff6b8a;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          line-height: 1.5;
        }

        .suggestion {
          background: rgba(0, 255, 136, 0.05);
          border: 1px solid rgba(0, 255, 136, 0.15);
          border-radius: 8px;
          padding: 14px;
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: all 0.3s ease-out;
        }

        .suggestion.visible {
          max-height: 200px;
          opacity: 1;
          margin-top: 8px;
        }

        .suggestion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .suggestion-label {
          color: #00ff88;
          font-weight: 600;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .fix-icon {
          font-size: 0.85rem;
        }

        .suggestion-text {
          color: #a0a0b0;
          font-size: 0.85rem;
          line-height: 1.5;
        }

        @media (max-width: 640px) {
          .bug-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .header-right {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}
