/**
 * Attachments Controller Tests
 * 
 * Unit tests for AttachmentsController
 * All custom code is proprietary and not open source.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { AuthService } from '../auth/auth.service';

describe('AttachmentsController', () => {
  let controller: AttachmentsController;
  let attachmentsService: AttachmentsService;
  let authService: AuthService;

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

  const mockAttachment = {
    id: 'attachment-id',
    fileName: 'test.jpg',
    fileUrl: 'http://localhost:3001/uploads/test.jpg',
    fileSize: 1024 * 1024,
    fileType: 'photo',
    mimeType: 'image/jpeg',
    storageProvider: 'local',
    storageKey: 'test-key.jpg',
    createdAt: new Date(),
    createdBy: 'user-id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttachmentsController],
      providers: [
        {
          provide: AttachmentsService,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue(mockAttachment),
            linkToInteraction: jest.fn().mockResolvedValue(undefined),
            deleteAttachment: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: AuthService,
          useValue: {
            validateToken: jest.fn().mockResolvedValue({
              id: 'user-id',
              email: 'test@example.com',
              role: 'FRONTEND_SPECIALIST',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AttachmentsController>(AttachmentsController);
    attachmentsService = module.get<AttachmentsService>(AttachmentsService);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const result = await controller.uploadFile(mockFile, 'token');

      expect(result).toEqual(mockAttachment);
      expect(attachmentsService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'user-id',
        'token',
      );
    });

    it('should throw BadRequestException if file is not provided', async () => {
      await expect(controller.uploadFile(null as any, 'token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('linkToInteraction', () => {
    it('should link attachment to interaction successfully', async () => {
      await controller.linkToInteraction(
        'attachment-id',
        { interactionId: 'interaction-id' },
        'token',
      );

      expect(attachmentsService.linkToInteraction).toHaveBeenCalledWith(
        'attachment-id',
        'interaction-id',
      );
    });
  });

  describe('deleteAttachment', () => {
    it('should delete attachment successfully', async () => {
      await controller.deleteAttachment('attachment-id', 'token');

      expect(attachmentsService.deleteAttachment).toHaveBeenCalledWith(
        'attachment-id',
        'user-id',
      );
    });
  });
});

