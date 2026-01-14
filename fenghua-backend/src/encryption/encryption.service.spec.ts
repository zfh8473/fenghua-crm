/**
 * Encryption Service Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionService],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt plaintext successfully', () => {
      const key = service.generateKey();
      const plaintext = 'sensitive data: bank account 1234567890';

      const ciphertext = service.encrypt(plaintext, key);
      expect(ciphertext).toBeDefined();
      expect(ciphertext).not.toBe(plaintext);
      expect(ciphertext.length).toBeGreaterThan(0);

      const decrypted = service.decrypt(ciphertext, key);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext (IV randomization)', () => {
      const key = service.generateKey();
      const plaintext = 'same plaintext';

      const ciphertext1 = service.encrypt(plaintext, key);
      const ciphertext2 = service.encrypt(plaintext, key);

      expect(ciphertext1).not.toBe(ciphertext2);
      
      // Both should decrypt to the same plaintext
      expect(service.decrypt(ciphertext1, key)).toBe(plaintext);
      expect(service.decrypt(ciphertext2, key)).toBe(plaintext);
    });

    it('should handle empty string', () => {
      const key = service.generateKey();

      const ciphertext = service.encrypt('', key);
      expect(ciphertext).toBe('');

      const decrypted = service.decrypt('', key);
      expect(decrypted).toBe('');
    });

    it('should handle special characters and unicode', () => {
      const key = service.generateKey();
      const plaintext = '特殊字符: 中文测试 🎉 émoji';

      const ciphertext = service.encrypt(plaintext, key);
      const decrypted = service.decrypt(ciphertext, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error if key length is incorrect', () => {
      const wrongKey = Buffer.from('short key');
      const plaintext = 'test data';

      expect(() => service.encrypt(plaintext, wrongKey)).toThrow('Encryption key must be 32 bytes');
      expect(() => service.decrypt('ciphertext', wrongKey)).toThrow('Decryption key must be 32 bytes');
    });

    it('should throw error if ciphertext is tampered', () => {
      const key = service.generateKey();
      const plaintext = 'sensitive data';
      const ciphertext = service.encrypt(plaintext, key);

      // Tamper with ciphertext
      const tampered = ciphertext.slice(0, -5) + 'XXXXX';

      expect(() => service.decrypt(tampered, key)).toThrow();
    });

    it('should throw error if wrong key is used', () => {
      const key1 = service.generateKey();
      const key2 = service.generateKey();
      const plaintext = 'sensitive data';

      const ciphertext = service.encrypt(plaintext, key1);

      expect(() => service.decrypt(ciphertext, key2)).toThrow();
    });
  });

  describe('key generation and conversion', () => {
    it('should generate a 32-byte key', () => {
      const key = service.generateKey();
      expect(key.length).toBe(32);
    });

    it('should convert key to Base64 and back', () => {
      const originalKey = service.generateKey();
      const keyBase64 = service.keyToBase64(originalKey);
      const restoredKey = service.keyFromBase64(keyBase64);

      expect(restoredKey).toEqual(originalKey);
    });

    it('should generate unique keys', () => {
      const key1 = service.generateKey();
      const key2 = service.generateKey();

      expect(key1).not.toEqual(key2);
    });
  });
});
