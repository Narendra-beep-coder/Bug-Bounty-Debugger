'use client';

import { useState, useEffect, useRef } from 'react';
import { Bug, Summary } from '@/lib/types';
import { BugCard } from './BugCard';

interface ResultsProps {
  bugs: Bug[];
  summary: Summary;
}

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 1000, shouldAnimate: boolean) {
  const [count, setCount] = useState(0);
  const mountedRef = useRef(false);
  
  useEffect(() => {
    if (!shouldAnimate) {
      // Skip animation if not needed
      return;
    }
    
    mountedRef.current = true;
    
    let startTime: number;
    let animationFrame: number;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      if (mountedRef.current) {
        setCount(Math.floor(eased * end));
      }
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(animationFrame);
    };
  }, [end, duration, shouldAnimate]);
  
  // If not animating, just return the end value
  if (!shouldAnimate) {
    return end;
  }
  
  return count;
}

export function Results({ bugs, summary }: ResultsProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const total = summary.critical + summary.warning + summary.info;
  
  // Use a ref to track if we should animate
  const shouldAnimateRef = useRef(true);
  
  // Animate on mount using requestAnimationFrame
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      shouldAnimateRef.current = true;
      setIsVisible(true);
    });
    return () => cancelAnimationFrame(frameId);
  }, []);
  
  const criticalCount = useAnimatedCounter(summary.critical, 800, isVisible);
  const warningCount = useAnimatedCounter(summary.warning, 1000, isVisible);
  const infoCount = useAnimatedCounter(summary.info, 1200, isVisible);
  
  const filteredBugs = bugs.filter(bug => {
    if (activeTab === 'all') return true;
    return bug.severity === activeTab;
  });
  
  if (total === 0) {
    return (
      <div className="results-container" ref={containerRef}>
        <div className={`success-message ${isVisible ? 'visible' : ''}`}>
          <div className="success-icon-wrapper">
            <div className="success-icon">✓</div>
            <div className="success-ripple"></div>
          </div>
          <h3>No Issues Found! 🎉</h3>
          <p>Your code looks clean. Great job!</p>
          <div className="success-stats">
            <div className="stat-item">
              <span className="stat-value">0</span>
              <span className="stat-label">Critical</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">0</span>
              <span className="stat-label">Warnings</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">0</span>
              <span className="stat-label">Info</span>
            </div>
          </div>
        </div>

        <style jsx>{`
          .results-container {
            margin-top: 32px;
          }

          .success-message {
            background: linear-gradient(135deg, rgba(0, 255, 136, 0.08) 0%, rgba(0, 170, 255, 0.05) 100%);
            border: 1px solid rgba(0, 255, 136, 0.2);
            border-radius: 16px;
            padding: 48px;
            text-align: center;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.5s ease-out;
          }

          .success-message.visible {
            opacity: 1;
            transform: translateY(0);
          }

          .success-icon-wrapper {
            position: relative;
            width: 80px;
            height: 80px;
            margin: 0 auto 24px;
          }

          .success-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #00ff88, #00cc6a);
            color: #0a0a0f;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: bold;
            position: relative;
            z-index: 1;
            animation: popIn 0.5s ease-out 0.2s backwards;
          }

          @keyframes popIn {
            0% {
              transform: scale(0);
            }
            70% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
            }
          }

          .success-ripple {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 2px solid #00ff88;
            transform: translate(-50%, -50%);
            animation: ripple 1.5s ease-out infinite;
          }

          @keyframes ripple {
            0% {
              width: 80px;
              height: 80px;
              opacity: 0.5;
            }
            100% {
              width: 160px;
              height: 160px;
              opacity: 0;
            }
          }

          .success-message h3 {
            color: #00ff88;
            margin: 0 0 12px 0;
            font-size: 1.75rem;
            font-weight: 700;
          }

          .success-message p {
            color: #8888aa;
            margin: 0 0 24px 0;
            font-size: 1rem;
          }

          .success-stats {
            display: flex;
            justify-content: center;
            gap: 32px;
          }

          .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: #8888aa;
            font-family: 'JetBrains Mono', monospace;
          }

          .stat-label {
            font-size: 0.75rem;
            color: #5a5a6a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="results-container" ref={containerRef}>
      <div className={`summary-section ${isVisible ? 'visible' : ''}`}>
        <div className="total-issues">
          <span className="total-number">{bugs.length}</span>
          <span className="total-label">Issues Found</span>
        </div>
        
        <div className="summary-cards">
          <div 
            className={`summary-card critical ${activeTab === 'critical' ? 'active' : ''}`}
            onClick={() => setActiveTab(activeTab === 'critical' ? 'all' : 'critical')}
          >
            <div className="card-glow"></div>
            <div className="summary-count">{criticalCount}</div>
            <div className="summary-label">Critical</div>
            {summary.critical > 0 && <div className="pulse-dot critical"></div>}
          </div>
          
          <div 
            className={`summary-card warning ${activeTab === 'warning' ? 'active' : ''}`}
            onClick={() => setActiveTab(activeTab === 'warning' ? 'all' : 'warning')}
          >
            <div className="card-glow"></div>
            <div className="summary-count">{warningCount}</div>
            <div className="summary-label">Warnings</div>
            {summary.warning > 0 && <div className="pulse-dot warning"></div>}
          </div>
          
          <div 
            className={`summary-card info ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab(activeTab === 'info' ? 'all' : 'info')}
          >
            <div className="card-glow"></div>
            <div className="summary-count">{infoCount}</div>
            <div className="summary-label">Info</div>
            {summary.info > 0 && <div className="pulse-dot info"></div>}
          </div>
        </div>

        {activeTab !== 'all' && (
          <button 
            className="clear-filter"
            onClick={() => setActiveTab('all')}
          >
            ✕ Clear filter: {activeTab}
          </button>
        )}
      </div>
      
      <div className="results-list">
        {filteredBugs.map((bug, index) => (
          <BugCard key={bug.id} bug={bug} index={index} />
        ))}
      </div>

      <style jsx>{`
        .results-container {
          margin-top: 32px;
        }

        .summary-section {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.5s ease-out;
        }

        .summary-section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .total-issues {
          text-align: center;
          margin-bottom: 24px;
        }

        .total-number {
          font-size: 3rem;
          font-weight: 800;
          color: #ffffff;
          font-family: 'JetBrains Mono', monospace;
          display: block;
          line-height: 1;
        }

        .total-label {
          color: #6a6a7a;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }

        .summary-card {
          background: #0d0d14;
          border: 2px solid #1a1a28;
          border-radius: 16px;
          padding: 24px 16px;
          text-align: center;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }

        .summary-card:hover .card-glow,
        .summary-card.active .card-glow {
          opacity: 1;
        }

        .summary-card.critical .card-glow {
          background: radial-gradient(circle at center, rgba(255, 51, 102, 0.15) 0%, transparent 70%);
        }

        .summary-card.warning .card-glow {
          background: radial-gradient(circle at center, rgba(255, 170, 0, 0.15) 0%, transparent 70%);
        }

        .summary-card.info .card-glow {
          background: radial-gradient(circle at center, rgba(0, 170, 255, 0.15) 0%, transparent 70%);
        }

        .summary-card:hover {
          transform: translateY(-4px);
          border-color: #2a2a3a;
        }

        .summary-card.active {
          transform: scale(1.02);
        }

        .summary-card.critical {
          border-color: rgba(255, 51, 102, 0.3);
        }

        .summary-card.warning {
          border-color: rgba(255, 170, 0, 0.3);
        }

        .summary-card.info {
          border-color: rgba(0, 170, 255, 0.3);
        }

        .summary-card.critical.active {
          border-color: #ff3366;
        }

        .summary-card.warning.active {
          border-color: #ffaa00;
        }

        .summary-card.info.active {
          border-color: #00aaff;
        }

        .summary-count {
          font-size: 2.5rem;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
          position: relative;
          z-index: 1;
        }

        .summary-card.critical .summary-count {
          color: #ff3366;
        }

        .summary-card.warning .summary-count {
          color: #ffaa00;
        }

        .summary-card.info .summary-count {
          color: #00aaff;
        }

        .summary-label {
          color: #6a6a7a;
          font-size: 0.8rem;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pulse-dot {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .pulse-dot.critical {
          background: #ff3366;
        }

        .pulse-dot.warning {
          background: #ffaa00;
        }

        .pulse-dot.info {
          background: #00aaff;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.5;
          }
        }

        .clear-filter {
          display: block;
          margin: 0 auto 24px;
          background: #1a1a28;
          border: 1px solid #2a2a3a;
          color: #8888aa;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-filter:hover {
          background: #252530;
          color: #ff3366;
          border-color: #ff3366;
        }

        .results-list {
          margin-top: 24px;
        }

        @media (max-width: 640px) {
          .summary-cards {
            grid-template-columns: 1fr;
          }

          .total-number {
            font-size: 2.5rem;
          }
        }
      `}</style>
    </div>
  );
}
