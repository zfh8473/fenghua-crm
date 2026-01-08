/**
 * Attachments Service Tests
 * 
 * Unit tests for AttachmentsService
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { LocalStorageService } from './storage/local-storage.service';

describe('AttachmentsService', () => {
  let service: AttachmentsService;
  let localStorageService: LocalStorageService;
  let configService: ConfigService;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 1024, // 1MB
    buffer: Buffer.from('test file content'),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwid29ya3NwYWNlSWQiOiJ3b3Jrc3BhY2UtaWQifQ.test';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
                STORAGE_PROVIDER: 'local',
                DEFAULT_WORKSPACE_ID: 'workspace-id',
                BASE_URL: 'http://localhost:3001',
                UPLOAD_DIR: './uploads',
              };
              return config[key] || defaultValue;
            }),
          },
        },
        LocalStorageService,
        {
          provide: LocalStorageService,
          useValue: {
            upload: jest.fn().mockResolvedValue('http://localhost:3001/uploads/test.jpg'),
            delete: jest.fn().mockResolvedValue(undefined),
            getSignedUrl: jest.fn().mockResolvedValue('http://localhost:3001/uploads/test.jpg'),
          },
        },
      ],
    }).compile();

    service = module.get<AttachmentsService>(AttachmentsService);
    localStorageService = module.get<LocalStorageService>(LocalStorageService);
    configService = module.get<ConfigService>(ConfigService);

    // Mock database pool
    (service as any).pgPool = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            id: 'attachment-id',
            interaction_id: null,
            product_id: null,
            file_name: 'test.jpg',
            file_url: 'http://localhost:3001/uploads/test.jpg',
            file_size: 1024 * 1024,
            file_type: 'photo',
            mime_type: 'image/jpeg',
            storage_provider: 'local',
            storage_key: 'test-key.jpg',
            metadata: null,
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
            created_by: 'user-id',
            workspace_id: 'workspace-id',
          },
        ],
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const result = await service.uploadFile(mockFile, 'user-id', mockToken);

      expect(result).toBeDefined();
      expect(result.fileName).toBe('test.jpg');
      expect(result.fileSize).toBe(1024 * 1024);
      expect(localStorageService.upload).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid file type', async () => {
      const invalidFile = { ...mockFile, mimetype: 'application/zip' };

      await expect(
        service.uploadFile(invalidFile, 'user-id', mockToken),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for file size exceeding limit', async () => {
      const largeFile = { ...mockFile, size: 11 * 1024 * 1024 }; // 11MB

      await expect(
        service.uploadFile(largeFile, 'user-id', mockToken),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('linkToInteraction', () => {
    it('should link attachment to interaction successfully', async () => {
      await service.linkToInteraction('attachment-id', 'interaction-id');

      expect((service as any).pgPool.query).toHaveBeenCalled();
    });

    it('should throw BadRequestException if attachment does not exist', async () => {
      (service as any).pgPool.query = jest.fn().mockResolvedValue({ rows: [] });

      await expect(
        service.linkToInteraction('non-existent-id', 'interaction-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteAttachment', () => {
    it('should delete attachment successfully', async () => {
      await service.deleteAttachment('attachment-id', 'user-id');

      expect(localStorageService.delete).toHaveBeenCalled();
      expect((service as any).pgPool.query).toHaveBeenCalled();
    });

    it('should throw BadRequestException if attachment does not exist', async () => {
      (service as any).pgPool.query = jest.fn().mockResolvedValue({ rows: [] });

      await expect(
        service.deleteAttachment('non-existent-id', 'user-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is not the creator', async () => {
      await expect(
        service.deleteAttachment('attachment-id', 'other-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

