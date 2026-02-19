'use client';

import { useState, useCallback } from 'react';
import { generateKey, exportKey, encryptCode, EncryptedData } from '@/lib/encryption';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
}

export function ShareModal({ isOpen, onClose, code, language }: ShareModalProps) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [decryptionKey, setDecryptionKey] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleShare = useCallback(async () => {
    if (!recipientEmail.trim()) {
      setError('Please enter recipient email');
      return;
    }

    if (!code.trim()) {
      setError('No code to share');
      return;
    }

    setIsEncrypting(true);
    setError('');

    try {
      // Check if Web Crypto API is available
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API is not available. Please use HTTPS or localhost.');
      }

      // Generate encryption key
      const key = await generateKey();
      const keyString = await exportKey(key);
      setDecryptionKey(keyString);

      // Encrypt the code
      const encryptedCode: EncryptedData = await encryptCode(code, key);

      setIsEncrypting(false);
      setIsSending(true);

      // Send email with encrypted code
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: recipientEmail,
          encryptedCode,
          decryptionKey: keyString,
          language,
          senderName: senderName || undefined,
          message: message || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setSent(true);
        // If in simulation mode, show a message
        if (data.message && data.message.includes('simulation')) {
          console.log('Share simulation mode:', data.preview);
        }
      } else {
        setError(data.error || 'Failed to send email');
      }
    } catch (err) {
      console.error('Share error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to encrypt and send code';
      setError(errorMessage);
    } finally {
      setIsSending(false);
    }
  }, [code, language, recipientEmail, senderName, message]);

  const handleClose = useCallback(() => {
    setRecipientEmail('');
    setSenderName('');
    setMessage('');
    setDecryptionKey('');
    setSent(false);
    setError('');
    onClose();
  }, [onClose]);

  const copyKey = useCallback(() => {
    navigator.clipboard.writeText(decryptionKey);
  }, [decryptionKey]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>×</button>
        
        <div className="modal-header">
          <span className="modal-icon">🔒</span>
          <h2>Share Encrypted Code</h2>
        </div>

        {sent ? (
          <div className="success-state">
            <div className="success-icon">✅</div>
            <h3>Email Sent Successfully!</h3>
            <p>The encrypted code has been sent to {recipientEmail}</p>
            
            <div className="key-display">
              <div className="key-label">Decryption Key (share separately)</div>
              <div className="key-value">
                <code>{decryptionKey}</code>
                <button className="copy-btn" onClick={copyKey}>📋</button>
              </div>
              <p className="key-warning">⚠️ Share this key through a different channel (phone, chat, etc.) for security</p>
            </div>

            <button className="done-btn" onClick={handleClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label>Recipient Email *</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                placeholder="friend@example.com"
              />
            </div>

            <div className="form-group">
              <label>Your Name (optional)</label>
              <input
                type="text"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label>Message (optional)</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Check out this code I found..."
                rows={3}
              />
            </div>

            <div className="code-preview">
              <div className="preview-label">Code to share</div>
              <pre>{code.slice(0, 200)}{code.length > 200 ? '...' : ''}</pre>
              <div className="preview-info">
                <span>Language: {language}</span>
                <span>Chars: {code.length}</span>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              className={`share-btn ${isEncrypting || isSending ? 'loading' : ''}`}
              onClick={handleShare}
              disabled={isEncrypting || isSending || !code.trim()}
            >
              {isEncrypting ? '🔐 Encrypting...' : isSending ? '📧 Sending...' : '🔒 Encrypt & Send'}
            </button>
          </>
        )}

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.2s ease-out;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .modal-content {
            background: #16161e;
            border: 1px solid #2a2a3a;
            border-radius: 16px;
            padding: 32px;
            width: 90%;
            max-width: 480px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            animation: slideUp 0.3s ease-out;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          }

          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          .modal-close {
            position: absolute;
            top: 16px;
            right: 16px;
            background: none;
            border: none;
            color: #6a6a7a;
            font-size: 24px;
            cursor: pointer;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            transition: all 0.2s;
          }

          .modal-close:hover {
            background: #1a1a24;
            color: #ffffff;
          }

          .modal-header {
            text-align: center;
            margin-bottom: 24px;
          }

          .modal-icon {
            font-size: 48px;
            display: block;
            margin-bottom: 12px;
          }

          .modal-header h2 {
            color: #ffffff;
            margin: 0;
            font-size: 1.5rem;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-group label {
            display: block;
            color: #8888aa;
            font-size: 0.875rem;
            margin-bottom: 8px;
          }

          .form-group input,
          .form-group textarea {
            width: 100%;
            background: #0a0a0f;
            border: 1px solid #2a2a3a;
            border-radius: 8px;
            padding: 12px;
            color: #ffffff;
            font-size: 0.95rem;
            transition: border-color 0.2s;
          }

          .form-group input:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: #00ff88;
          }

          .form-group textarea {
            resize: vertical;
            min-height: 80px;
          }

          .code-preview {
            background: #0a0a0f;
            border: 1px solid #2a2a3a;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 20px;
          }

          .preview-label {
            color: #6a6a7a;
            font-size: 0.75rem;
            text-transform: uppercase;
            margin-bottom: 8px;
          }

          .code-preview pre {
            color: #8888aa;
            font-size: 0.8rem;
            margin: 0;
            white-space: pre-wrap;
            word-break: break-all;
            max-height: 80px;
            overflow: hidden;
          }

          .preview-info {
            display: flex;
            gap: 16px;
            margin-top: 8px;
            font-size: 0.75rem;
            color: #6a6a7a;
          }

          .error-message {
            background: rgba(255, 82, 82, 0.1);
            border: 1px solid rgba(255, 82, 82, 0.3);
            color: #ff5252;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 0.875rem;
          }

          .share-btn {
            width: 100%;
            background: linear-gradient(135deg, #00ff88, #00cc6a);
            color: #0a0a0f;
            border: none;
            padding: 14px 24px;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
          }

          .share-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 255, 136, 0.3);
          }

          .share-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .share-btn.loading {
            background: linear-gradient(135deg, #00aaff, #0066cc);
          }

          .success-state {
            text-align: center;
          }

          .success-icon {
            font-size: 64px;
            margin-bottom: 16px;
          }

          .success-state h3 {
            color: #00ff88;
            margin: 0 0 8px;
          }

          .success-state p {
            color: #8888aa;
            margin: 0 0 24px;
          }

          .key-display {
            background: #0a0a0f;
            border: 1px solid #00ff88;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
          }

          .key-label {
            color: #00ff88;
            font-size: 0.875rem;
            margin-bottom: 12px;
          }

          .key-value {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #1a1a24;
            padding: 12px;
            border-radius: 8px;
          }

          .key-value code {
            flex: 1;
            color: #ffffff;
            font-size: 0.8rem;
            word-break: break-all;
          }

          .copy-btn {
            background: #2a2a3a;
            border: none;
            padding: 8px;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s;
          }

          .copy-btn:hover {
            background: #3a3a4a;
          }

          .key-warning {
            color: #ffaa00;
            font-size: 0.8rem;
            margin: 12px 0 0;
          }

          .done-btn {
            width: 100%;
            background: #1a1a24;
            border: 1px solid #2a2a3a;
            color: #ffffff;
            padding: 14px 24px;
            border-radius: 10px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s;
          }

          .done-btn:hover {
            background: #2a2a3a;
          }
        `}</style>
      </div>
    </div>
  );
}
