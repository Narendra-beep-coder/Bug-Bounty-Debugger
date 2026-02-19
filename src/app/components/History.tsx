'use client';

import { useState, useEffect } from 'react';
import { Analysis, Summary } from '@/lib/types';

interface HistoryProps {
  onSelectAnalysis: (analysis: { code: string; language: string }) => void;
  refreshTrigger?: number;
}

// Skeleton loading component
function HistorySkeleton() {
  return (
    <div className="skeleton-list">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-item">
          <div className="skeleton-header">
            <div className="skeleton-badge"></div>
            <div className="skeleton-date"></div>
          </div>
          <div className="skeleton-stats">
            <div className="skeleton-stat"></div>
          </div>
        </div>
      ))}
      <style jsx>{`
        .skeleton-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .skeleton-item {
          background: #12121a;
          border: 1px solid #1a1a24;
          border-radius: 10px;
          padding: 14px;
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        .skeleton-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        
        .skeleton-badge {
          width: 32px;
          height: 18px;
          background: #1a1a24;
          border-radius: 4px;
        }
        
        .skeleton-date {
          width: 60px;
          height: 14px;
          background: #1a1a24;
          border-radius: 4px;
          flex: 1;
        }
        
        .skeleton-stats {
          display: flex;
          gap: 8px;
        }
        
        .skeleton-stat {
          width: 50px;
          height: 14px;
          background: #1a1a24;
          border-radius: 4px;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export function History({ onSelectAnalysis, refreshTrigger }: HistoryProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger]);

  // Animate items appearing
  useEffect(() => {
    if (!loading && analyses.length > 0) {
    const timer = setTimeout(() => {
      setVisibleItems(new Set(analyses.filter(a => a._id).map(a => a._id as string)));
    }, 100);
    return () => clearTimeout(timer);
  }
  }, [loading, analyses]);

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
    // Animate out before removing
    setVisibleItems(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    
    setTimeout(async () => {
      try {
        await fetch(`/api/history/${id}`, { method: 'DELETE' });
        setAnalyses(analyses.filter(a => a._id !== id));
      } catch (err) {
        console.error('Failed to delete analysis:', err);
      }
    }, 300);
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

  if (loading) {
    return (
      <div className="history-container">
        <h3 className="history-title">
          <span className="title-icon">📊</span>
          Recent Analyses
        </h3>
        <HistorySkeleton />
        <style jsx>{historyStyles}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-container">
        <h3 className="history-title">
          <span className="title-icon">📊</span>
          Recent Analyses
        </h3>
        <div className="error-container">
          <div className="error-icon">⚠</div>
          <p className="error-text">{error}</p>
          <button className="retry-btn" onClick={fetchHistory}>
            🔄 Retry
          </button>
        </div>
        <style jsx>{historyStyles}</style>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="history-container">
        <h3 className="history-title">
          <span className="title-icon">📊</span>
          Recent Analyses
        </h3>
        <div className="empty-container">
          <div className="empty-icon">🔍</div>
          <p className="empty-text">No analysis history yet</p>
          <p className="empty-hint">Run your first analysis to see it here!</p>
        </div>
        <style jsx>{historyStyles}</style>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h3 className="history-title">
          <span className="title-icon">📊</span>
          Recent Analyses
        </h3>
        <span className="count-badge">{analyses.length}</span>
      </div>
      
      <div className="history-list">
        {analyses.map((analysis, index) => (
          <div
            key={analysis._id}
            className={`history-item ${visibleItems.has(analysis._id || '') ? 'visible' : ''}`}
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => onSelectAnalysis({ code: analysis.code, language: analysis.language })}
          >
            <div className="history-item-header">
              <span 
                className="language-badge" 
                style={{ background: getLanguageColor(analysis.language) }}
              >
                {getLanguageLabel(analysis.language)}
              </span>
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
                <span className="stat critical">
                  <span className="stat-dot"></span>
                  {analysis.summary.critical}
                </span>
              )}
              {analysis.summary.warning > 0 && (
                <span className="stat warning">
                  <span className="stat-dot"></span>
                  {analysis.summary.warning}
                </span>
              )}
              {analysis.summary.info > 0 && (
                <span className="stat info">
                  <span className="stat-dot"></span>
                  {analysis.summary.info}
                </span>
              )}
              {analysis.summary.critical === 0 && analysis.summary.warning === 0 && analysis.summary.info === 0 && (
                <span className="stat clean">
                  ✓ Clean
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{historyStyles}</style>
    </div>
  );
}

const historyStyles = `
  .history-container {
    margin-top: 32px;
  }

  .history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .history-title {
    color: #ffffff;
    font-size: 1.1rem;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .title-icon {
    font-size: 1rem;
  }

  .count-badge {
    background: #1a1a28;
    color: #8888aa;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 450px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .history-item {
    background: #0d0d14;
    border: 1px solid #1a1a28;
    border-radius: 10px;
    padding: 14px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
    transform: translateX(-10px);
  }

  .history-item.visible {
    opacity: 1;
    transform: translateX(0);
  }

  .history-item:hover {
    border-color: #00ff88;
    background: #10101a;
    transform: translateX(4px);
    box-shadow: 0 4px 20px rgba(0, 255, 136, 0.1);
  }

  .history-item-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .language-badge {
    color: #0a0a0f;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 0.65rem;
    font-weight: 700;
    min-width: 28px;
    text-align: center;
  }

  .date {
    color: #5a5a6a;
    font-size: 0.7rem;
    flex: 1;
    font-family: 'JetBrains Mono', monospace;
  }

  .delete-btn {
    background: transparent;
    border: none;
    color: #3a3a4a;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
    transition: all 0.2s;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .delete-btn:hover {
    color: #ff3366;
    background: rgba(255, 51, 102, 0.1);
  }

  .history-item-stats {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .stat {
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .stat-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .stat.critical {
    color: #ff3366;
  }

  .stat.critical .stat-dot {
    background: #ff3366;
  }

  .stat.warning {
    color: #ffaa00;
  }

  .stat.warning .stat-dot {
    background: #ffaa00;
  }

  .stat.info {
    color: #00aaff;
  }

  .stat.info .stat-dot {
    background: #00aaff;
  }

  .stat.clean {
    color: #00ff88;
  }

  /* Empty state */
  .empty-container {
    text-align: center;
    padding: 40px 20px;
    background: #0d0d14;
    border: 1px dashed #2a2a3a;
    border-radius: 12px;
  }

  .empty-icon {
    font-size: 2.5rem;
    margin-bottom: 12px;
    opacity: 0.6;
  }

  .empty-text {
    color: #8888aa;
    margin: 0 0 6px 0;
    font-size: 0.95rem;
  }

  .empty-hint {
    color: #5a5a6a;
    margin: 0;
    font-size: 0.8rem;
  }

  /* Error state */
  .error-container {
    text-align: center;
    padding: 30px 20px;
    background: rgba(255, 51, 102, 0.05);
    border: 1px solid rgba(255, 51, 102, 0.2);
    border-radius: 12px;
  }

  .error-icon {
    font-size: 2rem;
    margin-bottom: 12px;
    color: #ff3366;
  }

  .error-text {
    color: #8888aa;
    margin: 0 0 16px 0;
    font-size: 0.9rem;
  }

  .retry-btn {
    background: #1a1a28;
    border: 1px solid #2a2a3a;
    color: #8888aa;
    padding: 8px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .retry-btn:hover {
    background: #252530;
    color: #00ff88;
    border-color: #00ff88;
  }

  /* Scrollbar */
  .history-list::-webkit-scrollbar {
    width: 6px;
  }

  .history-list::-webkit-scrollbar-track {
    background: #0d0d14;
    border-radius: 3px;
  }

  .history-list::-webkit-scrollbar-thumb {
    background: #2a2a3a;
    border-radius: 3px;
  }

  .history-list::-webkit-scrollbar-thumb:hover {
    background: #3a3a4a;
  }
`;
