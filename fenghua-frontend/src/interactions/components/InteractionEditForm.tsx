/**
 * Interaction Edit Form Component
 * 
 * Form for editing an existing interaction record
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import {
  UpdateInteractionDto,
  InteractionStatus,
  InteractionWithAttachments,
  interactionsService,
} from '../services/interactions.service';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';
import { isAdmin, isDirector } from '../../common/constants/roles';
import { Customer } from '../../customers/customers.service';
import { customersService } from '../../customers/customers.service';
import { Product } from '../../products/products.service';
import { productsService } from '../../products/products.service';
import { Person, peopleService } from '../../people/people.service'; // Story 20.5: Person type and service
import { PersonSelect } from '../../people/components/PersonSelect'; // Story 20.5: Person selection component
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FileUpload } from '../../attachments/components/FileUpload';
import {
  Attachment,
  linkAttachmentToInteraction,
  deleteAttachment,
  updateAttachmentMetadata,
} from '../../attachments/services/attachments.service';
import { INTERACTION_EDIT_ERRORS, GENERIC_ERRORS } from '../../common/constants/error-messages';
import { getInteractionTypeLabel } from '../constants/interaction-types';
import {
  FrontendInteractionType,
  BackendInteractionType,
  InteractionType,
} from '../services/interactions.service';

interface InteractionEditFormProps {
  interactionId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const STATUS_OPTIONS_FRONTEND = [
  { value: InteractionStatus.IN_PROGRESS, label: '进行中' },
  { value: InteractionStatus.COMPLETED, label: '已完成' },
  { value: InteractionStatus.CANCELLED, label: '已取消' },
];

const STATUS_OPTIONS_BACKEND = [
  { value: InteractionStatus.IN_PROGRESS, label: '进行中' },
  { value: InteractionStatus.COMPLETED, label: '已完成' },
  { value: InteractionStatus.CANCELLED, label: '已取消' },
  { value: InteractionStatus.NEEDS_FOLLOW_UP, label: '需要跟进' },
];

const INTERACTION_TYPE_OPTIONS_FRONTEND = [
  { value: FrontendInteractionType.INITIAL_CONTACT, label: '初步接触' },
  { value: FrontendInteractionType.PRODUCT_INQUIRY, label: '产品询价' },
  { value: FrontendInteractionType.QUOTATION, label: '客户报价' },
  { value: FrontendInteractionType.QUOTATION_ACCEPTED, label: '接受报价' },
  { value: FrontendInteractionType.QUOTATION_REJECTED, label: '拒绝报价' },
  { value: FrontendInteractionType.ORDER_SIGNED, label: '签署订单' },
  { value: FrontendInteractionType.ORDER_FOLLOW_UP, label: '进度跟进' },
  { value: FrontendInteractionType.ORDER_COMPLETED, label: '完成订单' },
];

const INTERACTION_TYPE_OPTIONS_BACKEND = [
  { value: BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER, label: '询价产品' },
  { value: BackendInteractionType.QUOTATION_RECEIVED, label: '接收报价' },
  { value: BackendInteractionType.SPECIFICATION_CONFIRMED, label: '产品规格确认' },
  { value: BackendInteractionType.PRODUCTION_PROGRESS, label: '生产进度跟进' },
  { value: BackendInteractionType.PRE_SHIPMENT_INSPECTION, label: '发货前验收' },
  { value: BackendInteractionType.SHIPPED, label: '已发货' },
];

const MAX_DESCRIPTION_LENGTH = 5000;

/**
 * Interaction Edit Form Component
 * 
 * Allows users to edit their own interaction records.
 * Customer, product, and interaction type fields are read-only.
 * 
 * @param interactionId - ID of the interaction to edit
 * @param onSuccess - Callback when edit succeeds
 * @param onCancel - Callback when user cancels
 */
export const InteractionEditForm: React.FC<InteractionEditFormProps> = ({
  interactionId,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  /** Story 20.5: Selected person (contact) for interaction */
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [newAttachments, setNewAttachments] = useState<Attachment[]>([]);
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<string[]>([]);

  const isBackendSpecialist = user?.role === 'BACKEND_SPECIALIST';
  const statusOptions = isBackendSpecialist ? STATUS_OPTIONS_BACKEND : STATUS_OPTIONS_FRONTEND;
  const interactionTypeOptions = isBackendSpecialist ? INTERACTION_TYPE_OPTIONS_BACKEND : INTERACTION_TYPE_OPTIONS_FRONTEND;

  // Fetch interaction data
  const {
    data: interaction,
    isLoading,
    error,
  } = useQuery<InteractionWithAttachments>({
    queryKey: ['interaction', interactionId],
    queryFn: () => interactionsService.getInteraction(interactionId),
    enabled: !!interactionId,
  });

  // Load customer and product data when interaction is loaded
  useEffect(() => {
    if (interaction) {
      // Load customer
      customersService
        .getCustomer(interaction.customerId)
        .then((customer) => {
          setSelectedCustomer(customer);
        })
        .catch((error) => {
          console.error('Failed to load customer', error);
          toast.error('加载客户信息失败');
        });

      // Story 20.8: Load products (multi-product support)
      // Note: Products are now loaded from interaction.products array
      // For legacy data, fallback to productId if products array is empty
      if (interaction.products && interaction.products.length > 0) {
        // Products are already included in interaction response
        // No need to fetch separately
      } else if (interaction.productId) {
        // Fallback for legacy data
        productsService
          .getProduct(interaction.productId)
          .then((product) => {
            setSelectedProduct(product);
          })
          .catch((error) => {
            console.error('Failed to load product', error);
            toast.error('加载产品信息失败');
          });
      }

      // Story 20.5: Load person if personId exists
      if (interaction.personId) {
        peopleService
          .getPerson(interaction.personId)
          .then((person) => {
            // Validate person belongs to current customer
            if (person.companyId === interaction.customerId) {
              setSelectedPerson(person);
            } else {
              console.warn('Person does not belong to interaction customer');
            }
          })
          .catch((error) => {
            console.error('Failed to load person', error);
            // Don't show error toast as person is optional
          });
      }

      // Load existing attachments
      if (interaction.attachments && interaction.attachments.length > 0) {
        const existing: Attachment[] = interaction.attachments.map((att) => ({
          id: att.id,
          fileName: att.fileName,
          fileUrl: att.fileUrl,
          fileSize: att.fileSize,
          fileType: att.fileType,
          mimeType: att.mimeType,
          storageProvider: 'interaction-edit',
          storageKey: att.id,
          createdAt: new Date(),
          createdBy: '',
        }));
        setExistingAttachments(existing);
      }
    }
  }, [interaction]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdateInteractionDto>({
    defaultValues: {
      interactionType: interaction?.interactionType,
      description: interaction?.description || '',
      interactionDate: interaction?.interactionDate
        ? new Date(interaction.interactionDate).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      status: interaction?.status || InteractionStatus.IN_PROGRESS,
    },
  });

  // Reset form when interaction data is loaded
  useEffect(() => {
    if (interaction) {
      reset({
        interactionType: interaction.interactionType,
        description: interaction.description || '',
        interactionDate: interaction.interactionDate
          ? new Date(interaction.interactionDate).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        status: interaction.status || InteractionStatus.IN_PROGRESS,
      });
    }
  }, [interaction, reset]);

  // Watch description field for character count
  const descriptionValue = watch('description');
  const descriptionLength = descriptionValue?.length || 0;

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateInteractionDto) =>
      interactionsService.updateInteraction(interactionId, data),
    onSuccess: async () => {
      // Handle attachments
      try {
        // 1. Delete attachments marked for deletion
        for (const attachmentId of attachmentsToDelete) {
          await deleteAttachment(attachmentId);
        }

        // 2. Link new attachments to interaction
        for (let i = 0; i < newAttachments.length; i++) {
          const attachment = newAttachments[i];
          await linkAttachmentToInteraction(attachment.id, interactionId);

          // Update metadata (order and annotation)
          await updateAttachmentMetadata(attachment.id, {
            order: existingAttachments.length + i,
            annotation: attachment.metadata?.annotation,
          });
        }

        // 3. Update existing attachments metadata if needed
        for (let i = 0; i < existingAttachments.length; i++) {
          const attachment = existingAttachments[i];
          if (attachment.metadata) {
            await updateAttachmentMetadata(attachment.id, {
              order: i,
              annotation: attachment.metadata.annotation,
            });
          }
        }

        toast.success('互动记录更新成功');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '更新附件失败';
        toast.error(`互动记录已更新，但${errorMessage}`);
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['interaction', interactionId] });
      queryClient.invalidateQueries({ queryKey: ['customer-interactions'] });
      queryClient.invalidateQueries({ queryKey: ['product-interactions'] });
      queryClient.invalidateQueries({ queryKey: ['customer-product-interactions'] });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate(-1); // Go back to previous page
      }
    },
    onError: (error: Error) => {
      const errorMessage =
        error.message || INTERACTION_EDIT_ERRORS.UPDATE_FAILED;
      toast.error(errorMessage);
    },
  });

  const onSubmit = async (data: UpdateInteractionDto) => {
    // Validate interactionDate is not in the future
    if (data.interactionDate) {
      const interactionDate = new Date(data.interactionDate);
      const now = new Date();
      if (interactionDate > now) {
        toast.error(INTERACTION_EDIT_ERRORS.FUTURE_DATE_ERROR);
        return;
      }
    }

    // datetime-local 产出 "YYYY-MM-DDTHH:mm"，后端 @IsDateString 需要带秒的 ISO 8601，补全 ":00"
    const payload: UpdateInteractionDto = { ...data };
    if (payload.interactionDate && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(payload.interactionDate)) {
      payload.interactionDate = payload.interactionDate + ':00';
    }

    // Story 20.5: Include personId if selected, or set to undefined if cleared
    if (selectedPerson) {
      // Validate person belongs to current customer
      if (selectedPerson.companyId !== interaction?.customerId) {
        toast.error('该联系人不属于当前客户');
        return;
      }
      payload.personId = selectedPerson.id;
    } else {
      // If person selection is cleared, set personId to undefined (backend will handle as null)
      payload.personId = undefined;
    }

    await updateMutation.mutateAsync(payload);
  };

  /**
   * Handle attachment deletion
   */
  const handleDeleteAttachment = (attachmentId: string) => {
    // Confirm deletion
    if (!window.confirm('确定要删除这个附件吗？')) {
      return;
    }

    // Remove from existing attachments
    setExistingAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
    // Mark for deletion
    setAttachmentsToDelete((prev) => [...prev, attachmentId]);
  };

  /**
   * Handle new attachment upload
   */
  const handleNewAttachments = (attachments: Attachment[]) => {
    setNewAttachments(attachments);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-monday-8">
        <span className="animate-spin">⏳</span>
        <span className="ml-monday-2 text-monday-sm text-monday-text-secondary">
          {GENERIC_ERRORS.LOAD_FAILED}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-monday-8">
        <p className="text-monday-sm text-semantic-error mb-monday-2">
          {error instanceof Error
            ? error.message
            : INTERACTION_EDIT_ERRORS.LOAD_FAILED}
        </p>
        <Button size="sm" onClick={() => window.location.reload()}>
          {GENERIC_ERRORS.RETRY}
        </Button>
      </div>
    );
  }

  if (!interaction) {
    return (
      <div className="text-center py-monday-8">
        <p className="text-monday-sm text-semantic-error">
          {INTERACTION_EDIT_ERRORS.NOT_FOUND}
        </p>
      </div>
    );
  }

  // Check if current user is the creator OR is admin/director
  const userIsAdmin = isAdmin(user?.role);
  const userIsDirector = isDirector(user?.role);
  const isOwner = interaction.createdBy === user?.id;
  const canEdit = isOwner || userIsAdmin || userIsDirector;
  
  if (!canEdit) {
    return (
      <div className="text-center py-monday-8">
        <p className="text-monday-sm text-semantic-error">
          {INTERACTION_EDIT_ERRORS.NO_PERMISSION}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-monday-6">
      {/* Customer field (read-only) */}
      <div>
        <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
          客户 <span className="text-semantic-error">*</span>
        </label>
        <Input
          value={selectedCustomer?.name || '加载中...'}
          disabled
          className="bg-gray-50 cursor-not-allowed"
        />
      </div>

      {/* Story 20.5: Person Selection */}
      <div>
        <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
          关联联系人（可选）
        </label>
        {!selectedCustomer ? (
          <div className="p-monday-4 bg-gray-100 border-2 border-dashed border-gray-300 rounded-monday-md text-center">
            <p className="text-monday-sm text-monday-text-secondary font-medium">
              加载客户信息中...
            </p>
          </div>
        ) : (
          <PersonSelect
            selectedPerson={selectedPerson}
            onChange={(person) => {
              // Story 20.5: Validate person belongs to current customer
              if (person && person.companyId !== interaction.customerId) {
                toast.error('该联系人不属于当前客户');
                return;
              }
              setSelectedPerson(person);
            }}
            companyId={interaction.customerId}
            placeholder="搜索联系人（姓名、邮箱、职位）..."
            disabled={isSubmitting}
          />
        )}
      </div>

      {/* Story 20.8: Products field (read-only, multi-product support) */}
      <div>
        <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
          关联产品 <span className="text-semantic-error">*</span>
        </label>
        {interaction.products && interaction.products.length > 0 ? (
          <div className="space-y-2">
            {interaction.products.map((product) => (
              <Input
                key={product.id}
                value={product.name}
                disabled
                className="bg-gray-50 cursor-not-allowed"
              />
            ))}
          </div>
        ) : selectedProduct ? (
          <Input
            value={selectedProduct.name}
            disabled
            className="bg-gray-50 cursor-not-allowed"
          />
        ) : (
          <Input
            value="加载中..."
            disabled
            className="bg-gray-50 cursor-not-allowed"
          />
        )}
        <p className="mt-1 text-xs text-gray-500">
          注意：产品关联暂不支持在编辑时修改，如需修改请删除后重新创建
        </p>
      </div>

      {/* Interaction type field (editable) - Radio buttons */}
      <div>
        <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
          互动类型 <span className="text-semantic-error">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {interactionTypeOptions.map((option) => {
            const isSelected = watch('interactionType') === option.value;
            
            // 为每个互动类型分配不同的颜色 - 从冷到暖的渐变
            const getColorClasses = (value: string): string => {
              const colorMap: Record<string, string> = {
                // 采购商类型 - 从冷到暖（蓝色 → 绿色 → 黄色）
                [FrontendInteractionType.INITIAL_CONTACT]: 'bg-blue-600 text-white border-blue-600',        // 最冷 - 深蓝
                [FrontendInteractionType.PRODUCT_INQUIRY]: 'bg-blue-500 text-white border-blue-500',      // 蓝色
                [FrontendInteractionType.QUOTATION]: 'bg-cyan-500 text-white border-cyan-500',           // 青色
                [FrontendInteractionType.QUOTATION_ACCEPTED]: 'bg-teal-500 text-white border-teal-500',  // 青绿色
                [FrontendInteractionType.QUOTATION_REJECTED]: 'bg-semantic-error text-white border-semantic-error',
                [FrontendInteractionType.ORDER_SIGNED]: 'bg-green-500 text-white border-green-500',     // 绿色
                [FrontendInteractionType.ORDER_FOLLOW_UP]: 'bg-lime-500 text-white border-lime-500',    // 黄绿色（进度跟进）
                [FrontendInteractionType.ORDER_COMPLETED]: 'bg-emerald-500 text-white border-emerald-500', // 翠绿
                // 供应商类型 - 继续从暖到更暖（黄色 → 橙色 → 红色）
                [BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER]: 'bg-yellow-500 text-gray-800 border-yellow-500', // 黄色（文字用深色）
                [BackendInteractionType.QUOTATION_RECEIVED]: 'bg-amber-500 text-white border-amber-500',  // 琥珀
                [BackendInteractionType.SPECIFICATION_CONFIRMED]: 'bg-orange-500 text-white border-orange-500', // 橙色
                [BackendInteractionType.PRODUCTION_PROGRESS]: 'bg-orange-600 text-white border-orange-600', // 深橙
                [BackendInteractionType.PRE_SHIPMENT_INSPECTION]: 'bg-semantic-error text-white border-semantic-error',
                [BackendInteractionType.SHIPPED]: 'bg-semantic-error text-white border-semantic-error',
              };
              return colorMap[value] || 'bg-gray-500 text-white border-gray-500';
            };
            
            const colorClasses = getColorClasses(option.value);
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
                <div className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                  ${isSelected ? 'border-white bg-white' : 'border-gray-300 bg-white'}
                `}>
                  {isSelected && (
                    <div className={`w-2.5 h-2.5 rounded-full ${bgColor}`} />
                  )}
                </div>
                <span className={`text-sm ${isSelected ? 'text-white' : 'text-monday-text'}`}>
                  {option.label}
                </span>
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

      {/* Interaction date field */}
      <div>
        <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
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
                if (date > now) {
                  return '互动时间不能是未来时间';
                }
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

      {/* Description field */}
      <div>
        <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
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
            <p className="text-monday-xs text-semantic-error">
              {errors.description.message}
            </p>
          )}
          <p
            className={`text-monday-xs ml-auto ${
              descriptionLength > MAX_DESCRIPTION_LENGTH
                ? 'text-semantic-error'
                : 'text-monday-text-secondary'
            }`}
          >
            {descriptionLength} / {MAX_DESCRIPTION_LENGTH}
          </p>
        </div>
      </div>

      {/* Status field */}
      <div>
        <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
          状态
        </label>
        <select
          {...register('status')}
          className="w-full px-monday-3 py-monday-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-uipro-cta/50 focus:border-uipro-cta transition-colors duration-200"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Existing attachments */}
      {existingAttachments.length > 0 && (
        <div>
          <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
            现有附件
          </label>
          <div className="space-y-monday-2">
            {existingAttachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-monday-2 border border-gray-200 rounded"
              >
                <span className="text-monday-sm">{attachment.fileName}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteAttachment(attachment.id)}
                  className="text-semantic-error hover:text-semantic-error/80"
                >
                  删除
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New attachments upload */}
      <div>
        <label className="block text-monday-sm font-medium text-monday-text mb-monday-2">
          添加附件
        </label>
        <FileUpload
          onFilesUploaded={handleNewAttachments}
          maxFiles={10}
          maxFileSize={10 * 1024 * 1024}
        />
      </div>

      {/* Form actions */}
      <div className="flex gap-monday-3 justify-end pt-monday-4 border-t border-gray-200">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="cursor-pointer transition-colors duration-200">
            取消
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={isSubmitting || updateMutation.isPending}>
          {isSubmitting || updateMutation.isPending ? '保存中...' : '保存'}
        </Button>
      </div>
    </form>
  );
};

