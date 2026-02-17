'use client';

import { Bug, Summary } from '@/lib/types';
import { BugCard } from './BugCard';

interface ResultsProps {
  bugs: Bug[];
  summary: Summary;
}

export function Results({ bugs, summary }: ResultsProps) {
  const total = summary.critical + summary.warning + summary.info;

  if (total === 0) {
    return (
      <div className="results-container">
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h3>No Issues Found!</h3>
          <p>Your code looks clean. Great job!</p>
        </div>

        <style jsx>{`
          .results-container {
            margin-top: 24px;
          }

          .success-message {
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 12px;
            padding: 40px;
            text-align: center;
          }

          .success-icon {
            width: 60px;
            height: 60px;
            background: #00ff88;
            color: #0a0a0f;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: bold;
            margin: 0 auto 16px;
          }

          .success-message h3 {
            color: #00ff88;
            margin: 0 0 8px 0;
            font-size: 1.5rem;
          }

          .success-message p {
            color: #8888aa;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="results-container">
      <div className="summary-cards">
        <div className="summary-card critical">
          <div className="summary-count">{summary.critical}</div>
          <div className="summary-label">Critical</div>
        </div>
        <div className="summary-card warning">
          <div className="summary-count">{summary.warning}</div>
          <div className="summary-label">Warnings</div>
        </div>
        <div className="summary-card info">
          <div className="summary-count">{summary.info}</div>
          <div className="summary-label">Info</div>
        </div>
      </div>

      <h3 className="results-title">Issues Found ({bugs.length})</h3>
      
      <div className="bugs-list">
        {bugs.map((bug) => (
          <BugCard key={bug.id} bug={bug} />
        ))}
      </div>

      <style jsx>{`
        .results-container {
          margin-top: 24px;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .summary-card {
          background: #12121a;
          border: 1px solid #2a2a3a;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          transition: transform 0.2s;
        }

        .summary-card:hover {
          transform: translateY(-4px);
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

        .summary-count {
          font-size: 2.5rem;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
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
          color: #8888aa;
          font-size: 0.875rem;
          margin-top: 4px;
        }

        .results-title {
          color: #ffffff;
          font-size: 1.25rem;
          margin: 0 0 16px 0;
        }

        .bugs-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        @media (max-width: 640px) {
          .summary-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
