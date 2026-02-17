'use client';

import { useState, useEffect } from 'react';
import { Analysis, Summary } from '@/lib/types';

interface HistoryProps {
  onSelectAnalysis: (analysis: { code: string; language: string }) => void;
  refreshTrigger?: number;
}

export function History({ onSelectAnalysis, refreshTrigger }: HistoryProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/history');
      const data = await response.json();
      
      if (data.warning) {
        setError('Database not available. Start MongoDB to enable history.');
        setAnalyses([]);
      } else {
        setAnalyses(data.analyses || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to load history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
      setAnalyses(analyses.filter(a => a._id !== id));
    } catch (err) {
      console.error('Failed to delete analysis:', err);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLanguageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      javascript: 'JS',
      typescript: 'TS',
      python: 'PY',
      java: 'Java',
      c: 'C',
      cpp: 'C++',
      csharp: 'C#',
      go: 'Go',
      rust: 'Rust',
      php: 'PHP',
      ruby: 'Ruby',
      html: 'HTML',
      css: 'CSS',
    };
    return labels[lang] || lang.toUpperCase();
  };

  if (loading) {
    return (
      <div className="history-container">
        <div className="loading">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="history-container">
        <p className="empty">No analysis history yet. Run your first analysis!</p>
      </div>
    );
  }

  return (
    <div className="history-container">
      <h3 className="history-title">Recent Analyses</h3>
      <div className="history-list">
        {analyses.map((analysis) => (
          <div
            key={analysis._id}
            className="history-item"
            onClick={() => onSelectAnalysis({ code: analysis.code, language: analysis.language })}
          >
            <div className="history-item-header">
              <span className="language-badge">{getLanguageLabel(analysis.language)}</span>
              <span className="date">{formatDate(analysis.createdAt)}</span>
              <button
                className="delete-btn"
                onClick={(e) => deleteAnalysis(analysis._id!, e)}
                title="Delete"
              >
                ×
              </button>
            </div>
            <div className="history-item-stats">
              {analysis.summary.critical > 0 && (
                <span className="stat critical">{analysis.summary.critical} critical</span>
              )}
              {analysis.summary.warning > 0 && (
                <span className="stat warning">{analysis.summary.warning} warnings</span>
              )}
              {analysis.summary.info > 0 && (
                <span className="stat info">{analysis.summary.info} info</span>
              )}
              {analysis.summary.critical === 0 && analysis.summary.warning === 0 && analysis.summary.info === 0 && (
                <span className="stat clean">Clean</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .history-container {
          margin-top: 32px;
        }

        .history-title {
          color: #ffffff;
          font-size: 1.125rem;
          margin: 0 0 16px 0;
        }

        .loading, .error, .empty {
          color: #8888aa;
          text-align: center;
          padding: 24px;
        }

        .error {
          color: #ff3366;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 400px;
          overflow-y: auto;
        }

        .history-item {
          background: #12121a;
          border: 1px solid #2a2a3a;
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .history-item:hover {
          border-color: #00ff88;
          background: #1a1a24;
        }

        .history-item-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .language-badge {
          background: #00ff88;
          color: #0a0a0f;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .date {
          color: #4a4a5a;
          font-size: 0.75rem;
          flex: 1;
        }

        .delete-btn {
          background: transparent;
          border: none;
          color: #4a4a5a;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
          transition: color 0.2s;
        }

        .delete-btn:hover {
          color: #ff3366;
        }

        .history-item-stats {
          display: flex;
          gap: 12px;
        }

        .stat {
          font-size: 0.75rem;
        }

        .stat.critical {
          color: #ff3366;
        }

        .stat.warning {
          color: #ffaa00;
        }

        .stat.info {
          color: #00aaff;
        }

        .stat.clean {
          color: #00ff88;
        }
      `}</style>
    </div>
  );
}
