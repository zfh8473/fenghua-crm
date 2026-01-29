/**
 * InteractionRecordFields
 *
 * 共享表单项：创建互动记录勾选、关联产品、互动类型、互动描述、可选附件。
 * 供「创建互动记录」页与「准备互动」弹窗复用。
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { CreateInteractionDto } from '../services/interactions.service';
import { Customer } from '../../customers/customers.service';
import { Product } from '../../products/products.service';
import { ProductMultiSelect } from '../../products/components/ProductMultiSelect';
import { FileUpload } from '../../attachments/components/FileUpload';
import { Input } from '../../components/ui/Input';
import { Attachment } from '../../attachments/services/attachments.service';

const MAX_DESCRIPTION_LENGTH = 5000;

export interface InteractionRecordFieldsProps {
  /** 是否创建互动记录（准备互动路径下由用户勾选） */
  createInteractionRecord: boolean;
  /** 设置是否创建互动记录 */
  setCreateInteractionRecord: (value: boolean) => void;
  /** 当前选中的客户（用于产品列表与禁用态） */
  selectedCustomer: Customer | null;
  /** 客户关联产品列表 */
  customerProducts: Product[];
  /** 客户产品是否加载中 */
  isLoadingCustomerProducts: boolean;
  /** 已选产品 */
  selectedProducts: Product[];
  /** 设置已选产品 */
  setSelectedProducts: (products: Product[]) => void;
  register: UseFormRegister<CreateInteractionDto>;
  watch: UseFormWatch<CreateInteractionDto>;
  setValue: UseFormSetValue<CreateInteractionDto>;
  errors: FieldErrors<CreateInteractionDto>;
  /** 互动类型选项 */
  interactionTypeOptions: { value: string; label: string }[];
  /** 互动类型颜色类名 */
  getInteractionTypeColorClasses: (value: string) => string;
  /** 是否显示附件上传 */
  showAttachments?: boolean;
  /** 是否显示「创建互动记录」勾选框（创建页传 false，准备互动不传则默认 true） */
  showCreateRecordCheckbox?: boolean;
  /** 已上传附件（仅当 showAttachments 时使用） */
  uploadedFiles?: Attachment[];
  /** 单文件上传完成回调（仅当 showAttachments 时使用） */
  onUploadComplete?: (file: Attachment) => void;
  /** 移除附件回调（仅当 showAttachments 时使用） */
  onRemove?: (fileId: string) => void;
  /** 是否提交中 */
  isSubmitting?: boolean;
  /** 是否显示互动时间（创建页显示，准备互动不显示） */
  showInteractionDate?: boolean;
}

/**
 * 将 FileUpload 的 onFilesUploaded(完整列表) 转为父组件的 onUploadComplete/onRemove 增量回调
 */
function useFileUploadAdapter(
  uploadedFiles: Attachment[],
  onUploadComplete?: (file: Attachment) => void,
  onRemove?: (fileId: string) => void
) {
  return React.useCallback(
    (newList: Attachment[]) => {
      if (!onUploadComplete || !onRemove) return;
      const prevIds = new Set(uploadedFiles.map((f) => f.id));
      const newIds = new Set(newList.map((f) => f.id));
      newList.filter((f) => !prevIds.has(f.id)).forEach((f) => onUploadComplete(f));
      uploadedFiles.filter((f) => !newIds.has(f.id)).forEach((f) => onRemove(f.id));
    },
    [uploadedFiles, onUploadComplete, onRemove]
  );
}

export const InteractionRecordFields: React.FC<InteractionRecordFieldsProps> = ({
  createInteractionRecord,
  setCreateInteractionRecord,
  selectedCustomer,
  customerProducts,
  isLoadingCustomerProducts,
  selectedProducts,
  setSelectedProducts,
  register,
  watch,
  setValue,
  errors,
  interactionTypeOptions,
  getInteractionTypeColorClasses,
  showAttachments = false,
  showCreateRecordCheckbox = true,
  uploadedFiles = [],
  onUploadComplete,
  onRemove,
  isSubmitting = false,
  showInteractionDate = false,
}) => {
  const handleFilesUploaded = useFileUploadAdapter(uploadedFiles, onUploadComplete, onRemove);

  const descriptionValue = watch('description');
  const descriptionLength = descriptionValue?.length || 0;

  return (
    <div className="space-y-6">
      {showCreateRecordCheckbox && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="createInteractionRecord"
            checked={createInteractionRecord}
            onChange={(e) => setCreateInteractionRecord(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-uipro-cta focus:ring-uipro-cta"
          />
          <label htmlFor="createInteractionRecord" className="text-monday-sm font-medium text-uipro-text">
            创建互动记录
          </label>
        </div>
      )}

      {/* 关联产品：错误提示在标签下方，不显示“已选 X 个” */}
      <div className="space-y-monday-2">
        <span className="block text-monday-base font-semibold text-uipro-text mb-monday-2">
          关联产品 <span className="text-semantic-error">*</span>
        </span>
        {selectedProducts.length === 0 && (
          <p className="text-monday-sm text-semantic-error mb-monday-1" role="alert">
            请至少选择一个产品
          </p>
        )}
        <ProductMultiSelect
          selectedProducts={selectedProducts}
          onChange={setSelectedProducts}
          allowedProducts={customerProducts}
          disabled={!selectedCustomer || isLoadingCustomerProducts}
          placeholder={
            !selectedCustomer ? '请先选择客户' : isLoadingCustomerProducts ? '加载中...' : '搜索产品名称、HS编码或类别...'
          }
          error={selectedProducts.length === 0}
          label=""
          required={true}
        />
      </div>

      {/* 互动类型 */}
      <div>
        <label className="block text-monday-base font-semibold text-uipro-text mb-monday-2">
          互动类型 <span className="text-semantic-error">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {interactionTypeOptions.map((option) => {
            const isSelected = watch('interactionType') === option.value;
            const colorClasses = getInteractionTypeColorClasses(option.value);
            const bgColor = colorClasses.split(' ')[0];
            return (
              <label
                key={option.value}
                className={`
                  relative flex items-center gap-2 px-3 py-2 rounded-md border-2 cursor-pointer transition-all whitespace-nowrap
                  ${isSelected ? `${colorClasses} shadow-md scale-[1.02]` : 'bg-monday-surface border-gray-200 hover:border-gray-300 hover:bg-monday-bg'}
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <input
                  type="radio"
                  {...register('interactionType', { required: '互动类型不能为空' })}
                  value={option.value}
                  checked={isSelected}
                  disabled={isSubmitting}
                  className="sr-only"
                />
                <div
                  className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                  ${isSelected ? 'border-white bg-white' : 'border-gray-300 bg-white'}
                `}
                >
                  {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${bgColor}`} />}
                </div>
                <span className={`text-sm ${isSelected ? 'text-white' : 'text-monday-text'}`}>{option.label}</span>
              </label>
            );
          })}
        </div>
        {errors.interactionType && (
          <p className="mt-monday-2 text-monday-sm text-semantic-error" role="alert">
            {errors.interactionType.message}
          </p>
        )}
      </div>

      {/* 互动时间：放在互动类型下面，宽度与客户控件一致 */}
      {showInteractionDate && (
        <div className="max-w-xl">
          <label className="block text-monday-base font-semibold text-uipro-text mb-monday-2">
            互动时间 <span className="text-semantic-error">*</span>
          </label>
          <Input
            type="datetime-local"
            {...register('interactionDate', {
              required: '互动时间是必填项',
              validate: (value) => {
                if (value) {
                  const date = new Date(value);
                  const now = new Date();
                  if (date > now) return '互动时间不能是未来时间';
                  return true;
                }
                return true;
              },
            })}
          />
          {errors.interactionDate && (
            <p className="text-monday-xs text-semantic-error mt-monday-1">
              {errors.interactionDate.message}
            </p>
          )}
        </div>
      )}

      {/* 互动描述 */}
      <div>
        <label className="block text-monday-base font-semibold text-uipro-text mb-monday-2">
          互动描述
        </label>
        <textarea
          {...register('description', {
            maxLength: {
              value: MAX_DESCRIPTION_LENGTH,
              message: `描述不能超过 ${MAX_DESCRIPTION_LENGTH} 个字符`,
            },
          })}
          rows={6}
          className="w-full px-monday-3 py-monday-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uipro-cta/50 focus:border-uipro-cta transition-colors duration-200"
          placeholder="请输入互动描述..."
        />
        <div className="flex justify-between mt-monday-1">
          {errors.description && (
            <p className="text-monday-xs text-semantic-error">{errors.description.message}</p>
          )}
          <p
            className={`text-monday-xs ml-auto ${
              descriptionLength > MAX_DESCRIPTION_LENGTH ? 'text-semantic-error' : 'text-monday-text-secondary'
            }`}
          >
            {descriptionLength} / {MAX_DESCRIPTION_LENGTH}
          </p>
        </div>
      </div>

      {/* 附件（仅创建页显示） */}
      {showAttachments && onUploadComplete && onRemove && (
        <div>
          <label className="block text-monday-base font-semibold text-uipro-text mb-monday-2">附件</label>
          <FileUpload
            initialAttachments={uploadedFiles}
            onFilesUploaded={handleFilesUploaded}
          />
        </div>
      )}
    </div>
  );
};
