/**
 * Interaction Create Form Component
 * 
 * Form for creating a new interaction record
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { getInteractionTypeLabel } from '../constants/interaction-types';
import {
  CreateInteractionDto,
  FrontendInteractionType,
  BackendInteractionType,
  InteractionStatus,
  interactionsService,
  InteractionType, // Story 20.4: For type recommendation
} from '../services/interactions.service';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';
import { CustomerSelect } from '../../customers/components/CustomerSelect';
import { SelectedCustomerCard } from '../../customers/components/SelectedCustomerCard';
import { Customer } from '../../customers/customers.service';
import { customersService } from '../../customers/customers.service';
import { Product } from '../../products/products.service';
import { productsService } from '../../products/products.service';
import { ProductMultiSelect } from '../../products/components/ProductMultiSelect';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Attachment, linkAttachmentToInteraction } from '../../attachments/services/attachments.service';
import { peopleService, Person } from '../../people/people.service';
import { ContactMethodType } from '../../people/utils/contact-protocols';
import { PersonSelect } from '../../people/components/PersonSelect';
import { SelectedPersonCard } from '../../people/components/SelectedPersonCard';
import { InteractionRecordFields } from './InteractionRecordFields';

/**
 * 仅用于「创建互动记录」路径（独立页 / 从客户/产品页跳转）。
 * 准备互动路径请使用 PrepareInteractionForm。
 */
export interface InteractionCreateFormProps {
  initialCustomerId?: string;
  initialProductId?: string;
  initialPersonId?: string;
  initialContactMethod?: ContactMethodType;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const InteractionCreateForm: React.FC<InteractionCreateFormProps> = ({
  initialCustomerId,
  initialProductId,
  initialPersonId,
  initialContactMethod,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>(
    []
  );
  const [uploadedFiles, setUploadedFiles] = useState<Attachment[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
    reset,
    clearErrors,
  } = useForm<CreateInteractionDto>({
    defaultValues: {
      interactionType: undefined,
      interactionDate: new Date().toISOString().slice(0, 16),
      status: InteractionStatus.IN_PROGRESS, // Story 20.9: Default to "进行中" (in progress)
      description: '',
      personId: initialPersonId, // Story 20.5: Set initial person ID
    },
    mode: 'onSubmit', // Only validate on submit, not on change/blur
  });

  // Watch interaction type for dynamic validation or UI changes
  const interactionType = watch('interactionType');

  // Clear interactionType error when value is selected
  // This fixes the issue where validation error persists even after selecting a type
  useEffect(() => {
    if (interactionType && errors.interactionType) {
      clearErrors('interactionType');
    }
  }, [interactionType, errors.interactionType, clearErrors]);

  // Fetch initial customer if ID provided
  useEffect(() => {
    if (initialCustomerId) {
      customersService.getCustomer(initialCustomerId).then((customer) => {
        setSelectedCustomer(customer);
        setValue('customerId', customer.id);
      });
    }
  }, [initialCustomerId, setValue]);

  // Fetch initial person if ID provided (Story 20.5)
  useEffect(() => {
    if (initialPersonId) {
      peopleService.getPerson(initialPersonId).then((person) => {
        setSelectedPerson(person);
        // Story 20.9: Ensure personId is set in form even when UI is hidden
        setValue('personId', person.id);
        // If customer is not set yet, set it from person's company
        if (!selectedCustomer && person.company) {
          // We need to fetch full customer object to ensure compatibility
          customersService.getCustomer(person.company.id).then((customer) => {
            setSelectedCustomer(customer);
            setValue('customerId', customer.id);
          });
        }
      }).catch(err => {
        console.error('Failed to fetch initial person:', err);
      });
    }
  }, [initialPersonId, selectedCustomer, setValue]);

  // Fetch associated products when customer changes
  const { data: customerProducts = [], isLoading: isLoadingCustomerProducts } = useQuery({
    queryKey: ['customer-products', selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer?.id) return [];
      const response = await productsService.getCustomerProducts(selectedCustomer.id);
      return response.products;
    },
    enabled: !!selectedCustomer?.id,
  });

  // Fetch initial product if ID provided
  useEffect(() => {
    if (initialProductId && customerProducts.length > 0) {
      const product = customerProducts.find(p => p.id === initialProductId);
      if (product) {
        setSelectedProducts([product]);
      }
    }
  }, [initialProductId, customerProducts]);

  // Story 20.4: Recommendation logic for interaction type
  const recommendedType = useMemo(() => {
    if (!user?.role) return undefined;
    
    // Frontend Specialist (Buyer)
    if (user.role === 'FRONTEND_SPECIALIST') {
      return FrontendInteractionType.PRODUCT_INQUIRY; // Default recommendation
    }
    
    // Backend Specialist (Supplier)
    if (user.role === 'BACKEND_SPECIALIST') {
      return BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER; // Default recommendation
    }
    
    return undefined;
  }, [user?.role]);

  // Set default interaction type based on recommendation if not set
  useEffect(() => {
    if (!interactionType && recommendedType) {
      setValue('interactionType', recommendedType);
    }
  }, [recommendedType, interactionType, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateInteractionDto) => {
      // 1. Create interaction record(s)
      const result = await interactionsService.createInteraction(data);
      
      // 2. Link uploaded attachments to the created interaction(s)
      if (uploadedFiles.length > 0) {
        // If multiple interactions were created (legacy behavior), link to all
        // New behavior: result is a single interaction with product associations
        // We link attachments to this single interaction ID
        
        // Check if result has createdInteractionIds (legacy) or just id
        // The new API returns a single ID for 1:N model
        const targetIds = [result.id];
        
        await Promise.all(
          targetIds.flatMap(interactionId => 
            uploadedFiles.map(file => 
              linkAttachmentToInteraction(file.id, interactionId)
            )
          )
        );
      }
      
      return result;
    },
    onSuccess: () => {
      toast.success('互动记录创建成功');
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      // Story 20.9: Invalidate person interaction stats to refresh contact frequency display
      // Invalidate all person stats queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['personInteractionStatsBatch'] });
      queryClient.invalidateQueries({ queryKey: ['personInteractionStats'] });
      // Also invalidate people list to refresh stats when modal is reopened
      if (selectedPerson?.id) {
        queryClient.invalidateQueries({ queryKey: ['people'] });
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/interactions');
      }
    },
    onError: (error: Error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const onSubmit = (data: CreateInteractionDto) => {
    if (!selectedCustomer) {
      toast.error('请选择客户');
      return;
    }
    // 联系人为可选，不校验

    // 创建页始终创建互动记录
    // This fixes the intermittent issue where interactionType appears selected but validation fails
    const currentInteractionType = getValues('interactionType') || watch('interactionType');
    if (!currentInteractionType) {
      toast.error('请选择互动类型');
      return;
    }

    // Only validate products when creating interaction record
    if (selectedProducts.length === 0) {
      toast.error('请至少选择一个产品');
      return;
    }

    // Story 20.9: Set interaction date to current time and status to "进行中" when creating interaction record
    let interactionDate = data.interactionDate || new Date().toISOString().slice(0, 16);
    if (interactionDate && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(interactionDate)) {
      interactionDate = interactionDate + ':00';
    }
    const payload: CreateInteractionDto = {
      ...data,
      interactionType: currentInteractionType,
      interactionDate,
      status: InteractionStatus.IN_PROGRESS,
      customerId: selectedCustomer.id,
      productIds: selectedProducts.map(p => p.id),
      personId: selectedPerson?.id, // Story 20.5: Include person ID
    };

    createMutation.mutate(payload);
  };

  // Filter interaction types based on user role (Story 20.4)
  const availableInteractionTypes = useMemo(() => {
    if (user?.role === 'FRONTEND_SPECIALIST') {
      return Object.values(FrontendInteractionType);
    }
    if (user?.role === 'BACKEND_SPECIALIST') {
      return Object.values(BackendInteractionType);
    }
    return [...Object.values(FrontendInteractionType), ...Object.values(BackendInteractionType)];
  }, [user?.role]);

  // Story 20.9: Create interaction type options array for radio buttons
  const interactionTypeOptions = useMemo(() => {
    return availableInteractionTypes.map((type) => ({
      value: type,
      label: getInteractionTypeLabel(type),
    }));
  }, [availableInteractionTypes]);

  // Story 20.9: Color mapping function for interaction types (matching edit form)
  const getInteractionTypeColorClasses = (value: string): string => {
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

  const buttonText = '创建互动记录';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-uipro-body">
      {/* 创建路径：客户与联系人选择，客户选中后仅显示卡片（与联系人一致） */}
      <div className="space-y-monday-2 max-w-xl">
        <label className="block text-monday-base font-semibold text-uipro-text mb-monday-2">
          客户 <span className="text-semantic-error">*</span>
        </label>
        {selectedCustomer ? (
          <SelectedCustomerCard
            customer={selectedCustomer}
            onRemove={() => {
              setSelectedCustomer(null);
              setValue('customerId', undefined);
              setSelectedProducts([]);
              setSelectedPerson(null);
              setValue('personId', undefined);
            }}
          />
        ) : (
          <CustomerSelect
            selectedCustomer={null}
            onChange={(customer) => {
              setSelectedCustomer(customer);
              setValue('customerId', customer?.id);
              setSelectedProducts([]);
              setSelectedPerson(null);
              setValue('personId', undefined);
            }}
            error={!!errors.customerId?.message}
          />
        )}
      </div>

      {selectedCustomer && (
        <>
          <input type="hidden" {...register('personId')} value={selectedPerson?.id || initialPersonId || ''} />
          <div className="space-y-monday-2 max-w-xl">
            <label className="block text-monday-base font-semibold text-uipro-text mb-monday-2">
              联系人（可选）
            </label>
            {selectedPerson ? (
              /* 选中后只显示卡片，不显示中间输入框 */
              <SelectedPersonCard
                person={selectedPerson}
                onRemove={() => {
                  setSelectedPerson(null);
                  setValue('personId', undefined);
                }}
              />
            ) : (
              <PersonSelect
                selectedPerson={null}
                onChange={(p) => {
                  setSelectedPerson(p);
                  setValue('personId', p?.id);
                }}
                companyId={selectedCustomer.id}
                placeholder="搜索联系人（姓名、邮箱、职位）..."
                error={!!errors.personId?.message}
              />
            )}
          </div>
        </>
      )}

      <InteractionRecordFields
        createInteractionRecord={true}
        setCreateInteractionRecord={() => {}}
        selectedCustomer={selectedCustomer}
        customerProducts={customerProducts}
        isLoadingCustomerProducts={isLoadingCustomerProducts}
        selectedProducts={selectedProducts}
        setSelectedProducts={setSelectedProducts}
        register={register}
        watch={watch}
        setValue={setValue}
        errors={errors}
        interactionTypeOptions={interactionTypeOptions}
        getInteractionTypeColorClasses={getInteractionTypeColorClasses}
        showAttachments={true}
        showCreateRecordCheckbox={false}
        showInteractionDate={true}
        uploadedFiles={uploadedFiles}
        onUploadComplete={(file) => setUploadedFiles((prev) => [...prev, file])}
        onRemove={(fileId) => setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))}
        isSubmitting={isSubmitting}
      />

      {/* Actions */}
      {/* Story 20.9: Aligned with design system - responsive button layout */}
      <div className="flex flex-col sm:flex-row justify-end gap-monday-3 pt-monday-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel || (() => navigate('/interactions'))}
          className="w-full sm:w-auto transition-all duration-200 hover:border-uipro-cta hover:text-uipro-cta"
        >
          取消
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          isLoading={isSubmitting}
          className="w-full sm:w-auto transition-all duration-200"
        >
          {buttonText}
        </Button>
      </div>
    </form>
  );
};
