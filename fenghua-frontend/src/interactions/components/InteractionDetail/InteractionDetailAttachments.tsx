/**
 * InteractionDetailAttachments
 *
 * 附件列表：文件名、大小、预览/下载
 * All custom code is proprietary and not open source.
 */

import React from 'react';

export interface AttachmentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface InteractionDetailAttachmentsProps {
  attachments: AttachmentItem[];
}

const PaperClipIcon = (
  <svg className="w-5 h-5 text-uipro-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

const DocIcon = (
  <svg className="w-5 h-5 text-uipro-cta" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
  </svg>
);

function formatSize(bytes?: number): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const InteractionDetailAttachments: React.FC<InteractionDetailAttachmentsProps> = ({
  attachments,
}) => {
  if (!attachments.length) {
    return (
      <div className="bg-monday-surface rounded-monday-lg shadow-monday-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-uipro-text font-uipro-heading mb-4 flex items-center gap-2">
          {PaperClipIcon}
          附件
          <span className="text-sm font-normal text-uipro-secondary">(0个)</span>
        </h2>
        <p className="text-sm text-uipro-secondary">暂无附件</p>
      </div>
    );
  }

  return (
    <div className="bg-monday-surface rounded-monday-lg shadow-monday-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-uipro-text font-uipro-heading mb-4 flex items-center gap-2">
        {PaperClipIcon}
        附件
        <span className="text-sm font-normal text-uipro-secondary">({attachments.length}个)</span>
      </h2>
      <div className="space-y-3">
        {attachments.map((att) => (
          <div
            key={att.id}
            className="flex items-center justify-between p-3 bg-uipro-bg/50 rounded-monday-lg border border-gray-200 hover:border-uipro-cta/30 transition-colors duration-200"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-uipro-cta/10 rounded-monday-md flex items-center justify-center flex-shrink-0">
                {DocIcon}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-uipro-text truncate">{att.fileName}</div>
                <div className="text-xs text-uipro-secondary">
                  {att.fileSize != null && formatSize(att.fileSize)}
                  {att.fileSize != null && ' • '}
                  点击下载
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <a
                href={att.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm text-uipro-cta hover:bg-uipro-cta/10 rounded-monday-md cursor-pointer transition-colors duration-200"
              >
                预览
              </a>
              <a
                href={att.fileUrl}
                download={att.fileName}
                className="px-3 py-1.5 text-sm text-uipro-secondary hover:bg-monday-bg rounded-monday-md cursor-pointer transition-colors duration-200"
              >
                下载
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
