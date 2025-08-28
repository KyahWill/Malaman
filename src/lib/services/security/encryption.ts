/**
 * Data Encryption Service
 * Handles encryption/decryption of sensitive data
 */

import { dev } from '$app/environment';

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
}

export class EncryptionService {
  private static instance: EncryptionService;
  private config: EncryptionConfig = {
    algorithm: 'AES-GCM',
    keyLength: 256,
    ivLength: 12
  };

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Generate a new encryption key
   */
  async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.config.algorithm,
        length: this.config.keyLength
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt sensitive data
   */
  async encrypt(data: string, key: CryptoKey): Promise<{ encrypted: string; iv: string }> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(this.config.ivLength));
      
      // Encrypt data
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.config.algorithm,
          iv: iv
        },
        key,
        dataBuffer
      );

      return {
        encrypted: this.arrayBufferToBase64(encrypted),
        iv: this.arrayBufferToBase64(iv)
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decrypt(encryptedData: string, iv: string, key: CryptoKey): Promise<string> {
    try {
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedData);
      const ivBuffer = this.base64ToArrayBuffer(iv);
      
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.config.algorithm,
          iv: ivBuffer
        },
        key,
        encryptedBuffer
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  async hash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export const encryptionService = EncryptionService.getInstance();