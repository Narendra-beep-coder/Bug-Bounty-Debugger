/**
 * Encryption utilities for secure code sharing
 * Uses AES-GCM encryption with Web Crypto API
 */

export interface EncryptedData {
  iv: string;
  encryptedData: string;
}

export interface SharePackage {
  encryptedCode: EncryptedData;
  language: string;
  senderName?: string;
  message?: string;
}

/**
 * Generate a random encryption key
 */
export async function generateKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export key to base64 string for sharing
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Import key from base64 string
 */
export async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt code using AES-GCM
 */
export async function encryptCode(code: string, key: CryptoKey): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );
  
  return {
    iv: btoa(String.fromCharCode(...iv)),
    encryptedData: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
  };
}

/**
 * Decrypt code using AES-GCM
 */
export async function decryptCode(encryptedData: EncryptedData, key: CryptoKey): Promise<string> {
  const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
  const data = Uint8Array.from(atob(encryptedData.encryptedData), c => c.charCodeAt(0));
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Create a shareable link with encrypted code
 */
export async function createShareableLink(
  code: string,
  language: string,
  key: CryptoKey,
  senderName?: string,
  message?: string
): Promise<SharePackage> {
  const encryptedCode = await encryptCode(code, key);
  
  return {
    encryptedCode,
    language,
    senderName,
    message,
  };
}

/**
 * Helper to generate a random key and return as base64 string
 */
export async function generateKeyString(): Promise<string> {
  const key = await generateKey();
  return await exportKey(key);
}
