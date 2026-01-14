/**
 * Key Management Service Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KeyManagementService } from './key-management.service';
import { EncryptionService } from './encryption.service';
import { KeyStorageMethod } from './dto/encryption-key.dto';

describe('KeyManagementService', () => {
  let service: KeyManagementService;
  let encryptionService: EncryptionService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockPgPool: any;

  beforeEach(async () => {
    // Mock PostgreSQL pool
    mockPgPool = {
      query: jest.fn(),
      end: jest.fn(),
    };

    // Mock ConfigService
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'DATABASE_URL' || key === 'PG_DATABASE_URL') {
          return 'postgresql://test:test@localhost:5432/test';
        }
        if (key === 'ENCRYPTION_KEY_STORAGE_METHOD') {
          return 'database';
        }
        if (key === 'ENCRYPTION_KEY_CACHE_TTL') {
          return 300;
        }
        return undefined;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeyManagementService,
        EncryptionService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<KeyManagementService>(KeyManagementService);
    encryptionService = module.get<EncryptionService>(EncryptionService);

    // Mock the pgPool
    (service as any).pgPool = mockPgPool;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateKey', () => {
    it('should generate a 32-byte key', () => {
      const key = service.generateKey();
      expect(key.length).toBe(32);
    });

    it('should generate unique keys', () => {
      const key1 = service.generateKey();
      const key2 = service.generateKey();
      expect(key1).not.toEqual(key2);
    });
  });

  describe('storeKey and getKey', () => {
    it('should store and retrieve key successfully (database method)', async () => {
      const version = 1;
      const key = service.generateKey();
      const keyBase64 = encryptionService.keyToBase64(key);

      // Mock store
      mockPgPool.query.mockResolvedValueOnce({
        rows: [{ id: 'key-id-123' }],
      });

      await service.storeKey(version, key, true);

      expect(mockPgPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO encryption_keys'),
        expect.arrayContaining([version, keyBase64, true]),
      );

      // Mock retrieve
      mockPgPool.query.mockResolvedValueOnce({
        rows: [{ key_data: keyBase64, version }],
      });

      const retrievedKey = await service.getKey(version);

      expect(retrievedKey).toBeDefined();
      expect(retrievedKey).toEqual(key);
    });

    it('should return null if key not found', async () => {
      mockPgPool.query.mockResolvedValueOnce({
        rows: [],
      });

      const key = await service.getKey(999);
      expect(key).toBeNull();
    });
  });

  describe('getActiveKey', () => {
    it('should retrieve active key successfully', async () => {
      const version = 1;
      const key = service.generateKey();
      const keyBase64 = encryptionService.keyToBase64(key);

      // Mock get active version
      mockPgPool.query.mockResolvedValueOnce({
        rows: [{ version }],
      });

      // Mock get key
      mockPgPool.query.mockResolvedValueOnce({
        rows: [{ key_data: keyBase64, version }],
      });

      const activeKey = await service.getActiveKey();

      expect(activeKey).toBeDefined();
      expect(activeKey).toEqual(key);
    });

    it('should return null if no active key found', async () => {
      mockPgPool.query.mockResolvedValueOnce({
        rows: [],
      });

      const activeKey = await service.getActiveKey();
      expect(activeKey).toBeNull();
    });
  });

  describe('rotateKey', () => {
    it('should rotate key successfully', async () => {
      const oldVersion = 1;
      const newVersion = 2;
      const oldKey = service.generateKey();
      const newKey = service.generateKey();

      // Mock get active version
      mockPgPool.query.mockResolvedValueOnce({
        rows: [{ version: oldVersion }],
      });

      // Mock store new key
      mockPgPool.query.mockResolvedValueOnce({
        rows: [{ id: 'new-key-id' }],
      });

      // Mock deactivate old key
      mockPgPool.query.mockResolvedValueOnce({
        rows: [],
      });

      const result = await service.rotateKey();

      expect(result.newVersion).toBe(newVersion);
      expect(result.oldVersion).toBe(oldVersion);
      expect(mockPgPool.query).toHaveBeenCalledTimes(3);
    });

    it('should create first key if no active key exists', async () => {
      // Mock no active key
      mockPgPool.query.mockResolvedValueOnce({
        rows: [],
      });

      // Mock store new key
      mockPgPool.query.mockResolvedValueOnce({
        rows: [{ id: 'first-key-id' }],
      });

      const result = await service.rotateKey();

      expect(result.newVersion).toBe(1);
      expect(result.oldVersion).toBeNull();
    });
  });
});
