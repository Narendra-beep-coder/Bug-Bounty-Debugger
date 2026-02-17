'use client';

import { useState, useCallback } from 'react';
import { Bug, Summary } from '@/lib/types';
import { CodeEditor } from './components/CodeEditor';
import { Results } from './components/Results';
import { History } from './components/History';

export default function Home() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [summary, setSummary] = useState<Summary>({ critical: 0, warning: 0, info: 0 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showHistory, setShowHistory] = useState(true);

  const analyzeCode = useCallback(async () => {
    if (!code.trim()) return;

    setIsAnalyzing(true);
    setHasAnalyzed(false);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      const data = await response.json();
      
      if (data.bugs) {
        setBugs(data.bugs);
        setSummary(data.summary);
      }
      
      setHasAnalyzed(true);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [code, language]);

  const handleSelectAnalysis = useCallback((analysis: { code: string; language: string }) => {
    setCode(analysis.code);
    setLanguage(analysis.language);
    setShowHistory(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      analyzeCode();
    }
  }, [analyzeCode]);

  return (
    <div className="page">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">⬡</span>
            <span className="logo-text">BugHunter</span>
          </div>
          <nav className="nav">
            <button 
              className={`nav-btn ${showHistory ? 'active' : ''}`}
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? '◀ Hide' : '▶ History'}
            </button>
          </nav>
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <h1 className="hero-title">
            <span className="gradient-text">Multi-Language</span> Bug Detector
          </h1>
          <p className="hero-subtitle">
            Paste your code and discover bugs, security vulnerabilities, and code quality issues instantly.
            Supports 13+ programming languages.
          </p>
        </section>

        <div className="content-grid">
          <div className="editor-section">
            <div className="analyze-button-container">
              <button
                className={`analyze-btn ${isAnalyzing ? 'loading' : ''}`}
                onClick={analyzeCode}
                disabled={isAnalyzing || !code.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <span className="spinner"></span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">⚡</span>
                    Analyze Code
                  </>
                )}
              </button>
              <span className="hint">Ctrl + Enter</span>
            </div>

            <div onKeyDown={handleKeyDown}>
              <CodeEditor
                code={code}
                onChange={setCode}
                language={language}
                onLanguageChange={setLanguage}
              />
            </div>

            {hasAnalyzed && (
              <Results bugs={bugs} summary={summary} />
            )}
          </div>

          {showHistory && (
            <aside className="history-section">
              <History 
                onSelectAnalysis={handleSelectAnalysis}
                refreshTrigger={refreshTrigger}
              />
            </aside>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>🔍 Powered by BugHunter - Static Code Analysis Engine</p>
      </footer>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #0a0a0f;
          background-image: 
            radial-gradient(ellipse at 20% 0%, rgba(0, 255, 136, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 100%, rgba(0, 170, 255, 0.08) 0%, transparent 50%);
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(10, 10, 15, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #1a1a24;
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          font-size: 1.75rem;
          color: #00ff88;
          filter: drop-shadow(0 0 8px rgba(0, 255, 136, 0.5));
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.5px;
        }

        .nav-btn {
          background: #1a1a24;
          border: 1px solid #2a2a3a;
          color: #8888aa;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .nav-btn:hover,
        .nav-btn.active {
          color: #00ff88;
          border-color: #00ff88;
        }

        .main {
          max-width: 1400px;
          margin: 0 auto;
          padding: 48px 24px;
        }

        .hero {
          text-align: center;
          margin-bottom: 48px;
        }

        .hero-title {
          font-size: 3rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 16px 0;
          letter-spacing: -1px;
        }

        .gradient-text {
          background: linear-gradient(135deg, #00ff88, #00aaff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.125rem;
          color: #8888aa;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 32px;
        }

        @media (max-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
          
          .history-section {
            order: -1;
          }
        }

        .analyze-button-container {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .analyze-btn {
          background: linear-gradient(135deg, #00ff88, #00cc6a);
          color: #0a0a0f;
          border: none;
          padding: 14px 32px;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s;
          box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
        }

        .analyze-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 30px rgba(0, 255, 136, 0.4);
        }

        .analyze-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .analyze-btn.loading {
          background: #1a1a24;
          color: #00ff88;
          box-shadow: none;
        }

        .btn-icon {
          font-size: 1.25rem;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid #00ff88;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .hint {
          color: #4a4a5a;
          font-size: 0.75rem;
        }

        .footer {
          text-align: center;
          padding: 32px;
          color: #4a4a5a;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
