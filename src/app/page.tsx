'use client';

import { useState, useCallback, useEffect } from 'react';
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
  const [pageLoaded, setPageLoaded] = useState(false);
  const [keyboardHint, setKeyboardHint] = useState(false);

  // Animate page load
  useEffect(() => {
    setPageLoaded(true);
  }, []);

  // Show keyboard hint after a delay
  useEffect(() => {
    const timer = setTimeout(() => setKeyboardHint(true), 3000);
    return () => clearTimeout(timer);
  }, []);

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
      e.preventDefault();
      analyzeCode();
    }
  }, [analyzeCode]);

  const getRandomTip = () => {
    const tips = [
      "Try adding console.log statements to debug",
      "Check for null/undefined values",
      "Validate user input to prevent security issues",
      "Use const instead of var for better scoping",
      "Add error handling for better robustness",
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  return (
    <div className={`page ${pageLoaded ? 'loaded' : ''}`}>
      <div className="background-effects">
        <div className="grid-pattern"></div>
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
      </div>

      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">⬡</span>
            <span className="logo-text">BugHunter</span>
            <span className="logo-badge">v2.0</span>
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
        <section className={`hero ${pageLoaded ? 'visible' : ''}`}>
          <div className="hero-badge">
            <span className="badge-icon">🛡️</span>
            <span>AI-Powered Code Analysis</span>
          </div>
          <h1 className="hero-title">
            <span className="gradient-text">Multi-Language</span> Bug Detector
          </h1>
          <p className="hero-subtitle">
            Paste your code and discover bugs, security vulnerabilities, and code quality issues instantly.
            Supports 13+ programming languages.
          </p>
          <div className="hero-features">
            <div className="feature">
              <span className="feature-icon">🔍</span>
              <span>Instant Analysis</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🎯</span>
              <span>13+ Languages</span>
            </div>
            <div className="feature">
              <span className="feature-icon">⚡</span>
              <span>Real-time Results</span>
            </div>
          </div>
        </section>

        <div className="content-grid">
          <div className="editor-section">
            <div className="analyze-button-container">
              <button
                className={`analyze-btn ${isAnalyzing ? 'loading' : ''} ${!code.trim() ? 'disabled' : ''}`}
                onClick={analyzeCode}
                disabled={isAnalyzing || !code.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <span className="spinner"></span>
                    <span className="btn-text">Analyzing your code...</span>
                  </>
                ) : (
                  <>
                    <span className="btn-icon">⚡</span>
                    <span className="btn-text">Analyze Code</span>
                  </>
                )}
              </button>
              <div className="hint-container">
                <span className="hint">Ctrl + Enter</span>
                {keyboardHint && (
                  <span className="keyboard-hint">Press to analyze</span>
                )}
              </div>
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

            {!hasAnalyzed && !isAnalyzing && code.trim() === '' && (
              <div className="tip-container">
                <div className="tip-icon">💡</div>
                <p className="tip-text">{getRandomTip()}</p>
              </div>
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
          position: relative;
          overflow-x: hidden;
        }

        .background-effects {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 0;
        }

        .grid-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.4;
          animation: float 20s ease-in-out infinite;
        }

        .orb-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(0, 255, 136, 0.15) 0%, transparent 70%);
          top: -200px;
          left: -200px;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(0, 170, 255, 0.15) 0%, transparent 70%);
          bottom: -150px;
          right: -150px;
          animation-delay: -10s;
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.05);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.95);
          }
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(10, 10, 15, 0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid #1a1a24;
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 14px 24px;
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
          filter: drop-shadow(0 0 12px rgba(0, 255, 136, 0.6));
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(0, 255, 136, 0.4));
          }
          50% {
            filter: drop-shadow(0 0 16px rgba(0, 255, 136, 0.7));
          }
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.5px;
        }

        .logo-badge {
          background: linear-gradient(135deg, #00ff88, #00cc6a);
          color: #0a0a0f;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 700;
        }

        .nav-btn {
          background: #1a1a24;
          border: 1px solid #2a2a3a;
          color: #8888aa;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.25s;
        }

        .nav-btn:hover,
        .nav-btn.active {
          color: #00ff88;
          border-color: #00ff88;
          background: #1a1a28;
        }

        .main {
          max-width: 1400px;
          margin: 0 auto;
          padding: 48px 24px;
          position: relative;
          z-index: 1;
        }

        .hero {
          text-align: center;
          margin-bottom: 48px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s ease-out;
        }

        .hero.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid rgba(0, 255, 136, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
          margin-bottom: 20px;
          color: #00ff88;
          font-size: 0.85rem;
        }

        .badge-icon {
          font-size: 1rem;
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 20px 0;
          letter-spacing: -1.5px;
          line-height: 1.1;
        }

        .gradient-text {
          background: linear-gradient(135deg, #00ff88 0%, #00aaff 50%, #00ff88 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 3s ease-in-out infinite;
        }

        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% center;
          }
          50% {
            background-position: 100% center;
          }
        }

        .hero-subtitle {
          font-size: 1.2rem;
          color: #8888aa;
          max-width: 600px;
          margin: 0 auto 32px;
          line-height: 1.7;
        }

        .hero-features {
          display: flex;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6a6a7a;
          font-size: 0.9rem;
          transition: color 0.2s;
        }

        .feature:hover {
          color: #00ff88;
        }

        .feature-icon {
          font-size: 1.1rem;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 32px;
        }

        @media (max-width: 1200px) {
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
          flex-wrap: wrap;
        }

        .analyze-btn {
          background: linear-gradient(135deg, #00ff88, #00cc6a);
          color: #0a0a0f;
          border: none;
          padding: 16px 36px;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 24px rgba(0, 255, 136, 0.3);
          position: relative;
          overflow: hidden;
        }

        .analyze-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .analyze-btn:hover::before {
          left: 100%;
        }

        .analyze-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(0, 255, 136, 0.4);
        }

        .analyze-btn:active:not(:disabled) {
          transform: translateY(-1px);
        }

        .analyze-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .analyze-btn.disabled {
          opacity: 0.6;
        }

        .analyze-btn.loading {
          background: linear-gradient(135deg, #1a1a24, #252530);
          color: #00ff88;
          box-shadow: none;
        }

        .btn-icon {
          font-size: 1.3rem;
        }

        .btn-text {
          position: relative;
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

        .hint-container {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hint {
          color: #4a4a5a;
          font-size: 0.75rem;
          font-family: 'JetBrains Mono', monospace;
        }

        .keyboard-hint {
          color: #00ff88;
          font-size: 0.7rem;
          animation: fadeInOut 2s ease-in-out infinite;
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .tip-container {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(0, 170, 255, 0.08);
          border: 1px dashed rgba(0, 170, 255, 0.3);
          border-radius: 12px;
          padding: 16px 20px;
          margin-top: 24px;
        }

        .tip-icon {
          font-size: 1.5rem;
        }

        .tip-text {
          color: #8888aa;
          margin: 0;
          font-size: 0.9rem;
        }

        .footer {
          text-align: center;
          padding: 32px;
          color: #4a4a5a;
          font-size: 0.875rem;
          position: relative;
          z-index: 1;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }

          .hero-subtitle {
            font-size: 1rem;
          }

          .hero-features {
            gap: 20px;
          }

          .content-grid {
            gap: 24px;
          }
        }
      `}</style>
    </div>
  );
}
