/**
 * Interaction Create Form Component
 * 
 * Form for creating a new interaction record
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
  CreateInteractionDto,
  FrontendInteractionType,
  BackendInteractionType,
  InteractionStatus,
  interactionsService,
  InteractionType, // Story 20.4: For type recommendation
} from '../services/interactions.service';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';
import { CustomerSelect } from '../../customers/components/CustomerSelect';
import { Customer } from '../../customers/customers.service';
import { customersService } from '../../customers/customers.service';
import { Product } from '../../products/products.service';
import { productsService } from '../../products/products.service';
import { ProductMultiSelect } from '../../products/components/ProductMultiSelect';
import { useQuery } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FileUpload } from '../../attachments/components/FileUpload';
import { Attachment, linkAttachmentToInteraction, updateAttachmentMetadata } from '../../attachments/services/attachments.service';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useSwipeable } from 'react-swipeable';
import { peopleService } from '../../people/people.service'; // Story 20.4: For person validation
import { generateProtocol, openContactProtocol, ContactMethodType } from '../../people/utils/contact-protocols'; // Story 20.4: For contact protocol
// Recent customers/products functionality moved to CustomerSelect/ProductMultiSelect components

interface InteractionCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  prefillCustomerId?: string; // 预填充的客户 ID（从 navigation state 或 URL 参数）
  prefillProductId?: string; // 预填充的产品 ID（从 URL 参数）
  prefillPersonId?: string; // Story 20.4: 预填充的联系人 ID（从客户列表的联系人管理模态弹窗）
  prefillContactMethod?: 'phone' | 'mobile' | 'email' | 'wechat' | 'whatsapp' | 'linkedin' | 'facebook'; // Story 20.4: 预填充的联系方式类型
}

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

export const InteractionCreateForm: React.FC<InteractionCreateFormProps> = ({
  onSuccess,
  onCancel,
  prefillCustomerId,
  prefillProductId,
  prefillPersonId,
  prefillContactMethod,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  /** Story 20.4: Selected person (contact) for interaction */
  const [selectedPerson, setSelectedPerson] = useState<{ id: string; name: string } | null>(null);
  
  // Fetch associated products when customer is selected
  const { data: associatedProductsData, isLoading: isLoadingAssociatedProducts } = useQuery({
    queryKey: ['customer-associations', selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer?.id) return { products: [], total: 0 };
      const response = await customersService.getCustomerAssociations(selectedCustomer.id, 1, 100);
      // Convert CustomerProductAssociationResponseDto to Product[]
      return response.products.map((p) => ({
        id: p.id,
        name: p.name,
        hsCode: p.hsCode,
        category: p.category,
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    },
    enabled: !!selectedCustomer?.id,
  });
  
  const associatedProducts = associatedProductsData || [];

  // 移动端检测
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  // 滑动关闭处理（仅移动端）
  const swipeHandlers = useSwipeable({
    onSwipedDown: (eventData) => {
      // 滑动距离至少 100px 或 30% 屏幕高度，或快速滑动（> 0.5px/ms）立即关闭
      if (
        isMobile &&
        onCancel &&
        (eventData.deltaY > 100 ||
         (typeof window !== 'undefined' && eventData.deltaY > window.innerHeight * 0.3) ||
         eventData.velocity > 0.5)
      ) {
        onCancel();
      }
    },
    trackMouse: false, // 仅触摸操作
  });

  /**
   * 判断用户是否为后端专员
   * @returns {boolean} 如果用户角色是 BACKEND_SPECIALIST 返回 true
   */
  const isBackendSpecialist = user?.role === 'BACKEND_SPECIALIST';

  /**
   * 根据用户角色动态选择互动类型选项
   * @returns {Array<{value: string, label: string}>} 互动类型选项数组
   */
  const interactionTypeOptions = useMemo(() => {
    return isBackendSpecialist
      ? INTERACTION_TYPE_OPTIONS_BACKEND
      : INTERACTION_TYPE_OPTIONS_FRONTEND;
  }, [isBackendSpecialist]);

  /**
   * 根据用户角色动态设置默认互动类型
   * @returns {InteractionType} 默认互动类型
   */
  const defaultInteractionType = useMemo(() => {
    return isBackendSpecialist
      ? BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER
      : FrontendInteractionType.INITIAL_CONTACT;
  }, [isBackendSpecialist]);

  /**
   * Story 20.4: Get recommended interaction type based on contact method and user role
   */
  const getRecommendedInteractionType = useCallback((contactMethod?: string): InteractionType => {
    if (!contactMethod) return defaultInteractionType;

    if (isBackendSpecialist) {
      // Backend specialist recommendations
      switch (contactMethod) {
        case 'phone':
        case 'mobile':
          return BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER;
        case 'email':
          return BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER;
        case 'whatsapp':
        case 'wechat':
          return BackendInteractionType.PRODUCTION_PROGRESS;
        case 'linkedin':
        case 'facebook':
          return BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER;
        default:
          return BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER;
      }
    } else {
      // Frontend specialist recommendations
      switch (contactMethod) {
        case 'phone':
        case 'mobile':
          return FrontendInteractionType.INITIAL_CONTACT;
        case 'email':
          return FrontendInteractionType.INITIAL_CONTACT;
        case 'whatsapp':
        case 'wechat':
          return FrontendInteractionType.INITIAL_CONTACT;
        case 'linkedin':
        case 'facebook':
          return FrontendInteractionType.INITIAL_CONTACT;
        default:
          return FrontendInteractionType.INITIAL_CONTACT;
      }
    }
  }, [isBackendSpecialist, defaultInteractionType]);

  // Determine customer type label and initial filter
  // Customer type label removed - label is now generic "客户"

  const MAX_DESCRIPTION_LENGTH = 5000;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors,
    setValue,
  } = useForm<CreateInteractionDto>({
    defaultValues: {
      interactionDate: new Date().toISOString().slice(0, 16), // Default to current date/time
      interactionType: prefillContactMethod ? getRecommendedInteractionType(prefillContactMethod) : defaultInteractionType,
      status: InteractionStatus.IN_PROGRESS, // Optional: default status
    },
  });

  // Watch description field for character count
  const descriptionValue = watch('description');
  const descriptionLength = descriptionValue?.length || 0;

  // Watch interaction type for production progress and pre-shipment inspection photo upload
  const interactionType = watch('interactionType');
  const isProductionProgress = interactionType === BackendInteractionType.PRODUCTION_PROGRESS;
  const isPreShipmentInspection = interactionType === BackendInteractionType.PRE_SHIPMENT_INSPECTION;

  // Handle interaction type change: clear photos if switching away from production progress or pre-shipment inspection
  useEffect(() => {
    if (!isProductionProgress && !isPreShipmentInspection) {
      setAttachments((prev) => {
        if (prev.length > 0) {
          return [];
        }
        return prev;
      });
    }
  }, [interactionType, isProductionProgress, isPreShipmentInspection]);

  /**
   * 根据用户角色动态选择状态选项
   * @returns {Array<{value: InteractionStatus, label: string}>} 状态选项数组
   */
  const statusOptions = useMemo(() => {
    return isBackendSpecialist
      ? STATUS_OPTIONS_BACKEND
      : STATUS_OPTIONS_FRONTEND;
  }, [isBackendSpecialist]);

  // Reset form when user role changes
  useEffect(() => {
    if (user?.role) {
      reset({
        interactionDate: new Date().toISOString().slice(0, 16),
        interactionType: defaultInteractionType,
        status: InteractionStatus.IN_PROGRESS, // Reset default status
      });
      // Reset selected customer and products when role changes
      setSelectedCustomer(null);
      setSelectedProducts([]);
    }
  }, [user?.role, defaultInteractionType, reset]);

  // Reset selected products and update form value when customer changes
  useEffect(() => {
    setSelectedProducts([]);
    clearErrors('productIds');
    if (selectedCustomer) {
      setValue('customerId', selectedCustomer.id, { shouldValidate: false });
      clearErrors('customerId');
    } else {
      setValue('customerId', '', { shouldValidate: false });
    }
  }, [selectedCustomer?.id, clearErrors, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: CreateInteractionDto) => interactionsService.create(data),
    onSuccess: () => {
      toast.success('互动记录创建成功');
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/interactions');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || '创建互动记录失败');
    },
  });

  // Customer search logic moved to CustomerSelect component


  // 预填充客户信息（从 navigation state 或 URL 参数）
  useEffect(() => {
    if (prefillCustomerId && !selectedCustomer) {
      // 加载客户信息
      const loadCustomer = async () => {
        try {
          const customer = await customersService.getCustomer(prefillCustomerId);
          // 验证客户类型是否符合用户角色
          if (
            (isBackendSpecialist && customer.customerType === 'SUPPLIER') ||
            (!isBackendSpecialist && customer.customerType === 'BUYER') ||
            user?.role === 'DIRECTOR' ||
            user?.role === 'ADMIN'
          ) {
            setSelectedCustomer(customer);
          } else {
            toast.warn('该客户类型与您的角色不匹配');
          }
        } catch (error) {
          console.error('Failed to load customer', error);
          toast.error('加载客户信息失败');
        }
      };
      loadCustomer();
    }
  }, [prefillCustomerId, selectedCustomer, isBackendSpecialist, user?.role]);

  // 预填充产品信息（从 URL 参数）- 注意：需要先选择客户才能预填充产品
  useEffect(() => {
    if (prefillProductId && selectedCustomer && selectedProducts.length === 0) {
      // 加载产品信息
      const loadProduct = async () => {
        try {
          const product = await productsService.getProduct(prefillProductId);
          // 验证产品状态（只预填充 active 状态的产品）
          // 验证产品是否在已关联的产品列表中
          if (product.status === 'active') {
            const isAssociated = associatedProducts.some((p) => p.id === product.id);
            if (isAssociated) {
              setSelectedProducts([product]);
            } else {
              toast.warn('该产品未与该客户关联，请先创建关联');
            }
          } else {
            toast.warn('该产品不是活跃状态');
          }
        } catch (error) {
          console.error('Failed to load product', error);
          toast.error('加载产品信息失败');
        }
      };
      loadProduct();
    }
    // Note: productsService is stable and doesn't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillProductId, selectedCustomer, selectedProducts.length, associatedProducts]);

  // Story 20.4: Prefill person ID when provided
  useEffect(() => {
    if (prefillPersonId && selectedCustomer && !selectedPerson) {
      const loadPerson = async () => {
        try {
          const person = await peopleService.getPerson(prefillPersonId);
          // 验证 personId 是否属于选中的 customerId
          if (person.companyId !== selectedCustomer.id) {
            toast.error('该联系人不属于选中的客户');
            return;
          }
          setSelectedPerson({ id: person.id, name: `${person.firstName || ''} ${person.lastName || ''}`.trim() || '未命名联系人' });
        } catch (error) {
          console.error('Failed to load person', error);
          toast.error('加载联系人信息失败');
        }
      };
      loadPerson();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillPersonId, selectedCustomer, selectedPerson]);

  // Story 20.4: Update interaction type when contact method changes
  useEffect(() => {
    if (prefillContactMethod) {
      const recommendedType = getRecommendedInteractionType(prefillContactMethod);
      setValue('interactionType', recommendedType, { shouldValidate: false });
    }
  }, [prefillContactMethod, getRecommendedInteractionType, setValue]);

  // Recent customers functionality moved to CustomerSelect component

  const onSubmit = async (data: CreateInteractionDto) => {
    // Clear previous errors
    clearErrors('productIds');
    
    if (!selectedCustomer) {
      setError('customerId', { type: 'manual', message: '请选择客户' });
      toast.error('请选择客户');
      return;
    }
    if (selectedProducts.length === 0) {
      setError('productIds', { type: 'manual', message: '请至少选择一个产品' });
      toast.error('请至少选择一个产品');
      return;
    }

    // Validate all products are active (prevent race condition where product status changes between search and submit)
    const invalidProducts = selectedProducts.filter((p) => p.status !== 'active');
    if (invalidProducts.length > 0) {
      setError('productIds', { type: 'manual', message: '只能选择 active 状态的产品' });
      toast.error('只能选择 active 状态的产品');
      setSelectedProducts(selectedProducts.filter((p) => p.status === 'active'));
      return;
    }

    // Clean up data: remove empty strings and undefined values for optional fields
    const cleanedData: Partial<CreateInteractionDto> = {
      interactionType: data.interactionType,
      interactionDate: new Date(data.interactionDate).toISOString(),
    };
    
    // Only include description if it's not empty
    if (data.description && data.description.trim()) {
      cleanedData.description = data.description.trim();
    }
    
    // Only include status if it's a valid enum value (not empty string)
    if (data.status && data.status in InteractionStatus) {
      cleanedData.status = data.status as InteractionStatus;
    }
    
    // Story 20.4: Include contact method in additionalInfo if provided
    const additionalInfo: Record<string, unknown> = {
      ...(data.additionalInfo || {}),
    };
    if (prefillContactMethod) {
      additionalInfo.contactMethod = prefillContactMethod;
    }

    // Only include additionalInfo if it exists and is not empty
    if (Object.keys(additionalInfo).length > 0) {
      cleanedData.additionalInfo = additionalInfo;
    }

    const submitData: CreateInteractionDto = {
      ...cleanedData,
      customerId: selectedCustomer.id,
      productIds: selectedProducts.map((p) => p.id),
      // Story 20.4: Include personId if selected
      ...(selectedPerson ? { personId: selectedPerson.id } : {}),
    } as CreateInteractionDto;

    // Debug log in development
    if (import.meta.env.DEV) {
      console.log('[InteractionCreateForm] Submitting data:', JSON.stringify(submitData, null, 2));
    }

    // Create interaction record(s) first
    const interaction = await createMutation.mutateAsync(submitData);

    // Link attachments to all created interaction records and save metadata (order and annotation) if any
    if (attachments.length > 0) {
      try {
        // Get all interaction IDs (if multiple products were selected, link to all interactions)
        const interactionIds = interaction.createdInteractionIds || [interaction.id];
        
        for (let i = 0; i < attachments.length; i++) {
          const attachment = attachments[i];
          // Link attachment to all created interaction records
          for (const interactionId of interactionIds) {
            await linkAttachmentToInteraction(attachment.id, interactionId);
          }
          
          // 2. Save metadata (order and annotation)
          // 顺序：使用数组索引 i（反映用户拖拽后的顺序）
          // 标注：从 attachment.metadata?.annotation 获取（如果存在）
          await updateAttachmentMetadata(attachment.id, {
            order: i,
            annotation: attachment.metadata?.annotation,
          });
        }
        const interactionCount = interactionIds.length;
        toast.success(
          interactionCount > 1
            ? `已创建 ${interactionCount} 条互动记录，附件已关联到所有记录`
            : '互动记录和附件已保存'
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '关联附件失败';
        toast.error(`互动记录已创建，但${errorMessage}`);
      }
    }

    // Story 20.4: Open contact protocol after creating interaction (if contact method provided)
    if (prefillContactMethod && selectedPerson) {
      try {
        // Get contact method value from selected person
        const person = await peopleService.getPerson(selectedPerson.id);
        let contactValue: string | undefined;
        
        switch (prefillContactMethod) {
          case 'phone':
            contactValue = person.phone;
            break;
          case 'mobile':
            contactValue = person.mobile;
            break;
          case 'email':
            contactValue = person.email;
            break;
          case 'wechat':
            contactValue = person.wechat;
            break;
          case 'whatsapp':
            contactValue = person.whatsapp;
            break;
          case 'linkedin':
            contactValue = person.linkedinUrl;
            break;
          case 'facebook':
            contactValue = person.facebook;
            break;
        }

        if (contactValue) {
          const protocol = generateProtocol(prefillContactMethod, contactValue);
          await openContactProtocol(protocol, prefillContactMethod, contactValue);
        }
      } catch (error) {
        console.error('Failed to open contact protocol:', error);
        // Don't show error toast here - the interaction was already created successfully
        // The protocol opening is a "nice to have" feature
      }
    }
  };

  return (
    <div
      {...(isMobile ? swipeHandlers : {})}
      className={`
        ${isMobile ? 'fixed inset-0 z-50 bg-white overflow-y-auto' : ''}
        ${isTablet ? 'fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-lg shadow-lg max-h-[80vh] overflow-y-auto' : ''}
      `}
      style={
        isMobile || isTablet
          ? {
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
              paddingLeft: 'env(safe-area-inset-left, 0px)',
              paddingRight: 'env(safe-area-inset-right, 0px)',
            }
          : undefined
      }
    >
      {/* 移动端标题栏 */}
      {(isMobile || isTablet) && onCancel && (
        <div className="sticky top-0 z-10 bg-white border-b border-monday-border px-4 py-3 flex items-center justify-between">
          <h2 className="text-monday-lg font-semibold text-monday-text">创建互动记录</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="min-h-[48px] min-w-[48px]"
          >
            ✕
          </Button>
        </div>
      )}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`space-y-monday-6 ${isMobile || isTablet ? 'p-4' : ''}`}
      >
      {/* Customer Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-monday-sm font-semibold text-monday-text mb-monday-2">
            客户 <span className="text-semantic-error">*</span>
          </label>
          <CustomerSelect
            selectedCustomer={selectedCustomer}
            onChange={setSelectedCustomer}
            userRole={user?.role}
            placeholder="搜索客户名称或客户代码..."
            disabled={isSubmitting}
            error={!!errors.customerId}
            errorMessage={errors.customerId?.message}
          />
        </div>

        {/* Product Selection */}
        <div>
          <label className="block text-monday-sm font-semibold text-monday-text mb-monday-2">
            产品 <span className="text-semantic-error">*</span>
          </label>
        {!selectedCustomer ? (
          <div className="p-monday-4 bg-gray-100 border-2 border-dashed border-gray-300 rounded-monday-md text-center relative">
            <div className="flex items-center justify-center gap-monday-2 mb-monday-2">
              <span className="text-2xl">🔒</span>
            </div>
            <p className="text-monday-sm text-monday-text-secondary font-medium">
              请先选择客户，然后选择该客户已关联的产品
            </p>
            <p className="text-monday-xs text-monday-text-placeholder mt-monday-1">
              产品选择将在选择客户后启用
            </p>
          </div>
        ) : isLoadingAssociatedProducts ? (
          <div className="p-monday-4 bg-monday-bg-secondary rounded-monday-md text-center">
            <div className="flex items-center justify-center gap-monday-2">
              <span className="text-monday-sm text-monday-text-secondary animate-pulse">⏳</span>
              <p className="text-monday-sm text-monday-text-secondary">加载关联产品中...</p>
            </div>
          </div>
        ) : associatedProducts.length === 0 ? (
          <div className="p-monday-4 bg-yellow-50 border border-yellow-200 rounded-monday-md">
            <div className="flex items-start gap-monday-2 mb-monday-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-monday-sm text-monday-text font-medium mb-monday-1">
                  该客户尚未关联任何产品
                </p>
                <p className="text-monday-xs text-monday-text-secondary">
                  请先在产品管理或客户管理界面创建关联
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                navigate(`/customers/${selectedCustomer.id}`);
              }}
            >
              创建关联
            </Button>
          </div>
        ) : (
          <>
            <ProductMultiSelect
              selectedProducts={selectedProducts}
              onChange={setSelectedProducts}
              placeholder="搜索已关联的产品..."
              disabled={isSubmitting}
              error={!!errors.productIds}
              errorMessage={errors.productIds?.message}
              allowedProducts={associatedProducts}
            />
          </>
        )}
        {errors.productIds && (
          <p className="mt-monday-1 text-monday-xs text-semantic-error flex items-center gap-monday-1">
            <span>❌</span>
            {errors.productIds.message}
          </p>
        )}
        </div>
      </div>

      {/* Interaction Type - Radio buttons */}
      <div>
        <label className="block text-monday-sm font-semibold text-monday-text mb-monday-2">
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
                [FrontendInteractionType.QUOTATION]: 'bg-cyan-500 text-white border-cyan-500',             // 青色
                [FrontendInteractionType.QUOTATION_ACCEPTED]: 'bg-teal-500 text-white border-teal-500',  // 青绿色
                [FrontendInteractionType.QUOTATION_REJECTED]: 'bg-semantic-error text-white border-semantic-error',
                [FrontendInteractionType.ORDER_SIGNED]: 'bg-green-500 text-white border-green-500',      // 绿色
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
          <p className="mt-monday-2 text-monday-sm text-semantic-error flex items-center gap-monday-1" role="alert">
            {errors.interactionType.message}
          </p>
        )}
      </div>

      {/* Interaction Date */}
      <div>
        <label className="block text-monday-sm font-semibold text-monday-text mb-monday-2">
          互动时间 <span className="text-semantic-error">*</span>
        </label>
        <Input
          type="datetime-local"
          max={new Date().toISOString().slice(0, 16)} // Limit max value to current time (browser native limit)
          error={!!errors.interactionDate}
          errorMessage={errors.interactionDate?.message}
          {...register('interactionDate', {
            required: '互动时间不能为空',
            validate: (value) => {
              const selectedDate = new Date(value);
              const now = new Date();
              if (selectedDate > now) {
                return '互动时间不能是未来时间';
              }
              return true;
            },
          })}
          className="min-h-[48px]"
        />
        {errors.interactionDate && (
          <p className="mt-monday-1 text-monday-xs text-semantic-error flex items-center gap-monday-1">
            <span>❌</span>
            {errors.interactionDate.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-monday-sm font-semibold text-monday-text mb-monday-2">
          互动描述
        </label>
        <textarea
          {...register('description', {
            maxLength: {
              value: MAX_DESCRIPTION_LENGTH,
              message: `描述不能超过 ${MAX_DESCRIPTION_LENGTH} 个字符`,
            },
          })}
          rows={4}
          className={`w-full px-monday-3 py-monday-2 border rounded-monday-md focus:outline-none focus:ring-2 min-h-[48px] ${
            errors.description
              ? 'border-semantic-error focus:ring-semantic-error/50 focus:border-semantic-error'
              : 'border-monday-border focus:ring-uipro-cta/50 focus:border-uipro-cta'
          }`}
          placeholder="请输入互动描述..."
        />
        <div className="mt-monday-1 flex justify-between items-center">
          <div className="text-monday-xs text-monday-text-secondary">
            {descriptionLength}/{MAX_DESCRIPTION_LENGTH}
          </div>
          {errors.description && (
            <p className="text-monday-xs text-semantic-error flex items-center gap-monday-1">
              <span>❌</span>
              {errors.description.message}
            </p>
          )}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-monday-sm font-semibold text-monday-text mb-monday-2">
          状态
        </label>
        <select
          {...register('status')}
          className="w-full px-monday-3 py-monday-2 border border-monday-border rounded-monday-md focus:outline-none focus:ring-2 focus:ring-uipro-cta/50 focus:border-uipro-cta min-h-[48px] transition-colors duration-200"
        >
          <option value="">请选择状态（可选）</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.status && (
          <p className="mt-monday-1 text-monday-xs text-semantic-error">{errors.status.message}</p>
        )}
      </div>

      {/* Production Progress Photo Upload */}
      {isProductionProgress && (
        <div>
          <label className="block text-monday-sm font-semibold text-monday-text mb-monday-2">
            生产照片上传
          </label>
          <FileUpload
            photoOnly={true}
            maxFiles={10}
            maxFileSize={10 * 1024 * 1024}
            onFilesUploaded={setAttachments}
            initialAttachments={attachments}
          />
        </div>
      )}

      {/* Pre-Shipment Inspection Photo Upload */}
      {isPreShipmentInspection && (
        <div>
          <label className="block text-monday-sm font-semibold text-monday-text mb-monday-2">
            验收照片上传
          </label>
          <FileUpload
            photoOnly={true}
            maxFiles={20}
            maxFileSize={10 * 1024 * 1024}
            onFilesUploaded={setAttachments}
            initialAttachments={attachments}
          />
        </div>
      )}

      {/* General File Upload (for other interaction types) */}
      {!isProductionProgress && !isPreShipmentInspection && (
        <FileUpload
          onFilesUploaded={setAttachments}
          maxFiles={10}
          maxFileSize={10 * 1024 * 1024}
          initialAttachments={attachments}
        />
      )}

      {/* Form Actions - Sticky Footer */}
      <div
        className={`sticky bottom-0 bg-white border-t border-monday-border py-monday-4 px-monday-4 -mx-monday-4 ${isMobile ? '' : 'shadow-lg'}`}
        style={
          isMobile || isTablet
            ? {
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
                marginLeft: isMobile || isTablet ? '-16px' : '-16px',
                marginRight: isMobile || isTablet ? '-16px' : '-16px',
                paddingLeft: isMobile || isTablet ? '16px' : '16px',
                paddingRight: isMobile || isTablet ? '16px' : '16px',
              }
            : {
                marginLeft: '-16px',
                marginRight: '-16px',
                paddingLeft: '16px',
                paddingRight: '16px',
              }
        }
      >
        <div className={`flex gap-monday-4 ${isMobile ? 'flex-col' : 'justify-end'}`}>
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel} className={`min-h-[48px] cursor-pointer transition-colors duration-200 ${isMobile ? 'w-full' : ''}`}>
              取消
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className={`min-h-[48px] !bg-uipro-cta hover:!bg-uipro-cta/90 cursor-pointer transition-colors duration-200 ${isMobile ? 'w-full' : ''}`}
          >
            {isSubmitting || createMutation.isPending 
              ? '创建中...' 
              : prefillContactMethod 
                ? '创建互动记录并开始互动' 
                : '创建互动记录'}
          </Button>
        </div>
      </div>
    </form>
    </div>
  );
};

