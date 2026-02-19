import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Email configuration
// In production, use environment variables for credentials
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';

export interface SendEmailRequest {
  toEmail: string;
  encryptedCode: {
    iv: string;
    encryptedData: string;
  };
  decryptionKey: string;
  language: string;
  senderName?: string;
  message?: string;
}

export async function POST(request: Request) {
  try {
    const body: SendEmailRequest = await request.json();
    const { toEmail, encryptedCode, decryptionKey, language, senderName, message } = body;

    // Validate required fields
    if (!toEmail || !encryptedCode || !decryptionKey || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: toEmail, encryptedCode, decryptionKey, language' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Create reusable transporter
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: `"BugHunter" <${EMAIL_USER}>`,
      to: toEmail,
      subject: senderName 
        ? `${senderName} shared encrypted code with you via BugHunter` 
        : 'Someone shared encrypted code with you via BugHunter',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0f; color: #ffffff; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #16161e; border-radius: 12px; padding: 30px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; color: #00ff88; }
            .content { background: #1a1a24; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .key-box { background: #0a0a0f; border: 1px solid #00ff88; border-radius: 6px; padding: 15px; margin: 15px 0; word-break: break-all; font-family: monospace; color: #00ff88; }
            .label { color: #8888aa; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
            .value { color: #ffffff; }
            .message-box { background: #1a1a24; border-left: 3px solid #00aaff; padding: 15px; margin: 15px 0; font-style: italic; }
            .footer { text-align: center; margin-top: 30px; color: #6a6a7a; font-size: 12px; }
            .btn { display: inline-block; background: linear-gradient(135deg, #00ff88, #00cc6a); color: #0a0a0f; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="logo">⬡</span> BugHunter
              <h1>Encrypted Code Shared With You</h1>
            </div>
            
            ${senderName ? `<p><strong>From:</strong> ${senderName}</p>` : ''}
            
            ${message ? `
            <div class="message-box">
              "${message}"
            </div>
            ` : ''}
            
            <div class="content">
              <div class="label">Programming Language</div>
              <div class="value">${language}</div>
              
              <div class="label" style="margin-top: 20px;">Decryption Key</div>
              <div class="key-box">${decryptionKey}</div>
              
              <div class="label" style="margin-top: 20px;">Encrypted Code (Base64)</div>
              <div class="key-box" style="max-height: 150px; overflow-y: auto;">
                IV: ${encryptedCode.iv}
                <br/><br/>
                Data: ${encryptedCode.encryptedData}
              </div>
            </div>
            
            <p style="color: #8888aa; font-size: 14px;">
              🔒 The code has been encrypted using AES-256-GCM encryption. 
              Use the decryption key above to decrypt the code in BugHunter.
            </p>
            
            <div class="footer">
              <p>Powered by BugHunter - Multi-Language Bug Detector</p>
              <p>This is an automated message from BugHunter</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
${senderName ? `From: ${senderName}` : ''}

Someone shared encrypted code with you via BugHunter.

${message ? `Message: "${message}"` : ''}

Programming Language: ${language}

DECRYPTION KEY:
${decryptionKey}

ENCRYPTED CODE:
IV: ${encryptedCode.iv}
Data: ${encryptedCode.encryptedData}

---
The code has been encrypted using AES-256-GCM encryption.
Use the decryption key above to decrypt the code in BugHunter.

Powered by BugHunter - Multi-Language Bug Detector
      `.trim(),
    };

    // For demo purposes, if no email credentials are configured
    // We'll simulate sending and return success
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.log('Email would be sent (simulation mode):', {
        to: toEmail,
        subject: mailOptions.subject,
        key: decryptionKey,
        iv: encryptedCode.iv,
        dataLength: encryptedCode.encryptedData.length,
      });
      
      return NextResponse.json({
        success: true,
        message: 'Email simulation mode - no email credentials configured. Configure EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in .env.local to send real emails.',
        simulation: true,
        preview: {
          to: toEmail,
          decryptionKey: decryptionKey,
          language: language,
          encryptedCode: {
            iv: encryptedCode.iv,
            encryptedData: encryptedCode.encryptedData.substring(0, 50) + '...',
          },
        },
      });
    }

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
