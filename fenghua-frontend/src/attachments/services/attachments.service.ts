/**
 * Attachments Service
 * 
 * Handles attachment API calls
 * All custom code is proprietary and not open source.
 */

// Use relative path /api to leverage Vite proxy in development
// In production, set VITE_API_BASE_URL to the full backend URL
const API_URL = (import.meta.env?.VITE_API_BASE_URL as string) || (import.meta.env?.VITE_BACKEND_URL as string) || '/api';

/**
 * Attachment metadata structure
 */
export interface AttachmentMetadata {
  order?: number;
  annotation?: string;
}

export interface Attachment {
  id: string;
  interactionId?: string;
  productId?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  mimeType?: string;
  storageProvider: string;
  storageKey: string;
  metadata?: AttachmentMetadata;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface LinkAttachmentDto {
  interactionId: string;
}

export interface UpdateAttachmentMetadataDto {
  order?: number;
  annotation?: string;
}

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Upload file with progress tracking
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<Attachment> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(percentComplete);
      }
    });

    xhr.onload = () => {
      if (xhr.status === 201) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('解析响应失败'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.message || '文件上传失败'));
        } catch {
          reject(new Error(`文件上传失败: ${xhr.statusText}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('文件上传失败，网络错误'));
    };

    xhr.open('POST', `${API_URL}/api/attachments/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

/**
 * Link attachment to interaction
 */
export async function linkAttachmentToInteraction(
  attachmentId: string,
  interactionId: string,
): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`${API_URL}/api/attachments/${attachmentId}/link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ interactionId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '关联附件失败' }));
    throw new Error(error.message || '关联附件失败');
  }
}

/**
 * Delete attachment
 */
export async function deleteAttachment(attachmentId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`${API_URL}/api/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '删除附件失败' }));
    throw new Error(error.message || '删除附件失败');
  }
}

/**
 * Update attachment metadata (order and annotation)
 */
export async function updateAttachmentMetadata(
  attachmentId: string,
  metadata: UpdateAttachmentMetadataDto,
): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`${API_URL}/api/attachments/${attachmentId}/metadata`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '更新附件 metadata 失败' }));
    throw new Error(error.message || '更新附件 metadata 失败');
  }
}

