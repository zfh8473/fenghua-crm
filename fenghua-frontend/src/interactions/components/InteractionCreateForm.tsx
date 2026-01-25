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
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';
import { CustomerSelect } from '../../customers/components/CustomerSelect';
import { Customer } from '../../customers/customers.service';
import { customersService } from '../../customers/customers.service';
import { Product } from '../../products/products.service';
import { productsService } from '../../products/products.service';
import { ProductMultiSelect } from '../../products/components/ProductMultiSelect';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FileUpload } from '../../attachments/components/FileUpload';
import { Attachment, linkAttachmentToInteraction, updateAttachmentMetadata } from '../../attachments/services/attachments.service';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useSwipeable } from 'react-swipeable';
import { peopleService, Person } from '../../people/people.service'; // Story 20.4: For person validation, Story 20.5: Person type
import { generateProtocol, openContactProtocol, ContactMethodType } from '../../people/utils/contact-protocols'; // Story 20.4: For contact protocol
import { PersonSelect } from '../../people/components/PersonSelect'; // Story 20.5: Person selection component
import { getPrimaryContactMethod } from '../../people/utils/person-utils'; // Story 20.5: Person utility functions
import { ContactMethodIcon } from '../../people/components/ContactMethodIcon'; // For displaying contact method in interaction form

/**
 * Get contact method value from person
 */
const getContactMethodValue = (person: Person, method: ContactMethodType): string | null => {
  switch (method) {
    case 'phone':
      return person.phone || null;
    case 'mobile':
      return person.mobile || null;
    case 'email':
      return person.email || null;
    case 'whatsapp':
      return person.whatsapp || null;
    case 'wechat':
      return person.wechat || null;
    case 'linkedin':
      return person.linkedinUrl || null;
    case 'facebook':
      return person.facebook || null;
    default:
      return null;
  }
};

interface InteractionCreateFormProps {
  initialCustomerId?: string;
  initialProductId?: string;
  initialPersonId?: string; // Story 20.5: Support pre-selecting a person
  initialContactMethod?: ContactMethodType; // Support pre-selecting a contact method
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
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null); // Story 20.5: Selected person state
  const [selectedContactMethod, setSelectedContactMethod] = useState<ContactMethodType | null>(
    initialContactMethod || null
  ); // Store the selected contact method
  const [createInteractionRecord, setCreateInteractionRecord] = useState(false); // Default to false - user must explicitly check to create record

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateInteractionDto>({
    defaultValues: {
      interactionType: undefined,
      interactionDate: new Date().toISOString().slice(0, 16),
      status: InteractionStatus.COMPLETED, // Default to completed as most interactions are logged after the fact
      description: '',
      personId: initialPersonId, // Story 20.5: Set initial person ID
    },
  });

  // Watch interaction type for dynamic validation or UI changes
  const interactionType = watch('interactionType');

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
      // Also invalidate stats queries (Story 20.7)
      queryClient.invalidateQueries({ queryKey: ['personInteractionStatsBatch'] });
      
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

    // Story 20.6: If "Create Interaction Record" is unchecked, just open protocol
    if (!createInteractionRecord) {
      if (selectedPerson) {
        handleStartInteraction(selectedPerson);
      } else {
        toast.error('请先选择联系人以开始互动');
      }
      return;
    }

    // Only validate products when creating interaction record
    if (selectedProducts.length === 0) {
      toast.error('请至少选择一个产品');
      return;
    }

    const payload: CreateInteractionDto = {
      ...data,
      customerId: selectedCustomer.id,
      productIds: selectedProducts.map(p => p.id),
      personId: selectedPerson?.id, // Story 20.5: Include person ID
    };

    createMutation.mutate(payload);
    
    // Story 20.6: If person selected, also try to open protocol
    if (selectedPerson) {
      // We don't block submission, just try to open protocol
      handleStartInteraction(selectedPerson);
    }
  };

  // Handle person selection (Story 20.5)
  const handlePersonSelect = (personId: string) => {
    setValue('personId', personId);
    // Find full person object for protocol handling
    if (selectedCustomer?.id) {
      peopleService.getPeople({ companyId: selectedCustomer.id }).then(res => {
        const person = res.people.find(p => p.id === personId);
        if (person) {
          setSelectedPerson(person);
        }
      });
    }
  };

  // Handle start interaction (Story 20.4 & 20.6)
  const handleStartInteraction = (person: Person) => {
    // Use selected contact method if available, otherwise fall back to primary contact method
    const method = selectedContactMethod || getPrimaryContactMethod(person);
    if (!method) {
      toast.warning('该联系人没有可用的联系方式');
      return;
    }

    const value = getContactMethodValue(person, method);
    if (!value) {
      toast.warning('联系方式值为空');
      return;
    }

    const protocolUrl = generateProtocol(method, value);
    openContactProtocol(protocolUrl);
    toast.info(`正在尝试通过 ${method} 联系 ${person.firstName}${person.lastName}...`);
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

  // Story 20.6: Dynamic button text
  const buttonText = createInteractionRecord ? '创建互动记录并开始互动' : '开始互动';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Story 20.6: Create Record Checkbox (Moved to top) */}
      <div className="flex items-center gap-monday-2 p-monday-4 bg-monday-bg-secondary rounded-monday-lg border border-gray-200">
        <input
          type="checkbox"
          id="createRecord"
          className="w-4 h-4 text-uipro-cta rounded border-gray-300 focus:ring-uipro-cta cursor-pointer transition-colors duration-200"
          checked={createInteractionRecord}
          onChange={(e) => setCreateInteractionRecord(e.target.checked)}
        />
        <label htmlFor="createRecord" className="text-monday-sm font-medium text-uipro-text cursor-pointer">
          创建互动记录
        </label>
        <span className="text-monday-xs text-monday-text-placeholder ml-monday-2">（建议每次联系勾选）</span>
      </div>

      {/* Customer Selection - Hidden when pre-filled, but data still submitted */}
      {!initialCustomerId && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            客户 <span className="text-red-500">*</span>
          </label>
          <CustomerSelect
            value={selectedCustomer}
            onChange={(customer) => {
              setSelectedCustomer(customer);
              setValue('customerId', customer.id);
              setSelectedProducts([]); // Reset products when customer changes
              setSelectedPerson(null); // Reset person when customer changes
              setValue('personId', undefined);
            }}
            error={!selectedCustomer && errors.customerId?.message}
          />
        </div>
      )}

      {/* Person Selection (Story 20.5) */}
      {selectedCustomer && (
        <div className="space-y-monday-2">
          <label className="block text-monday-sm font-medium text-uipro-text">
            关联联系人
          </label>
          {initialPersonId && selectedPerson ? (
             // Read-only view if pre-selected via contact button
             <div className="flex items-center justify-between p-monday-3 bg-monday-bg-secondary border border-gray-200 rounded-monday-md">
               <div className="flex items-center gap-monday-2">
                 <span className="font-medium text-uipro-text">
                   {selectedPerson.firstName} {selectedPerson.lastName}
                 </span>
                 <span className="text-monday-text-secondary text-monday-sm">
                   {selectedPerson.jobTitle}
                 </span>
               </div>
               {/* Display selected contact method icon, or primary if none selected */}
               {(selectedContactMethod || getPrimaryContactMethod(selectedPerson)) && (
                 <div className="flex items-center gap-monday-1 text-uipro-cta bg-uipro-cta/10 px-monday-2 py-monday-1 rounded text-monday-xs">
                   <ContactMethodIcon 
                     type={selectedContactMethod || getPrimaryContactMethod(selectedPerson)!} 
                     hasValue={true}
                   />
                   <span>{selectedContactMethod || getPrimaryContactMethod(selectedPerson)}</span>
                 </div>
               )}
             </div>
          ) : (
            <PersonSelect
              customerId={selectedCustomer.id}
              value={selectedPerson?.id}
              onChange={handlePersonSelect}
              placeholder="选择联系人（可选）"
            />
          )}
        </div>
      )}

      {/* Product Selection - Only show when createInteractionRecord is checked */}
      {createInteractionRecord && (
        <div className="space-y-monday-2">
          <label className="block text-monday-sm font-medium text-uipro-text mb-monday-2">
            产品 <span className="text-semantic-error">*</span>
          </label>
          {isLoadingCustomerProducts ? (
            <div className="p-monday-4 bg-monday-bg-secondary rounded-monday-md text-center">
              <div className="flex items-center justify-center gap-monday-2">
                <span className="text-monday-sm text-monday-text-secondary animate-pulse">⏳</span>
                <p className="text-monday-sm text-monday-text-secondary">加载关联产品中...</p>
              </div>
            </div>
          ) : (
            <ProductMultiSelect
              selectedProducts={selectedProducts || []}
              onChange={setSelectedProducts}
              allowedProducts={selectedCustomer ? customerProducts : undefined}
              disabled={!selectedCustomer}
              placeholder={!selectedCustomer ? '请先选择客户' : '选择关联产品...'}
              error={selectedCustomer && selectedProducts.length === 0}
              errorMessage={selectedCustomer && selectedProducts.length === 0 ? '请至少选择一个产品' : undefined}
            />
          )}
        </div>
      )}

      {/* Interaction Details - Only show if createRecord is checked */}
      {createInteractionRecord && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-monday-6">
            {/* Interaction Type */}
            <div>
              <label className="block text-monday-sm font-medium text-uipro-text mb-monday-2">
                互动类型 <span className="text-semantic-error">*</span>
              </label>
              <select
                {...register('interactionType', { required: '请选择互动类型' })}
                className="w-full rounded-monday-md border border-gray-200 px-monday-3 py-monday-2 text-monday-sm bg-monday-surface text-uipro-text focus:outline-none focus:ring-2 focus:ring-uipro-cta/50 focus:border-uipro-cta transition-colors duration-200 cursor-pointer"
              >
                <option value="">请选择...</option>
                {availableInteractionTypes.map((type) => (
                  <option key={type} value={type}>
                    {getInteractionTypeLabel(type)}
                  </option>
                ))}
              </select>
              {errors.interactionType && (
                <p className="mt-monday-1 text-monday-sm text-semantic-error" role="alert">
                  {errors.interactionType.message}
                </p>
              )}
            </div>

            {/* Interaction Date */}
            <Input
              label="互动时间"
              type="datetime-local"
              required
              {...register('interactionDate', { required: '请选择互动时间' })}
              error={!!errors.interactionDate}
              errorMessage={errors.interactionDate?.message}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-monday-sm font-medium text-uipro-text mb-monday-2">
              状态
            </label>
            <select
              {...register('status')}
              className="w-full rounded-monday-md border border-gray-200 px-monday-3 py-monday-2 text-monday-sm bg-monday-surface text-uipro-text focus:outline-none focus:ring-2 focus:ring-uipro-cta/50 focus:border-uipro-cta transition-colors duration-200 cursor-pointer"
            >
              <option value={InteractionStatus.COMPLETED}>已完成</option>
              <option value={InteractionStatus.IN_PROGRESS}>进行中</option>
              <option value={InteractionStatus.NEEDS_FOLLOW_UP}>需要跟进</option>
              <option value={InteractionStatus.CANCELLED}>已取消</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-monday-2">
            <label className="block text-monday-sm font-medium text-uipro-text">
              互动描述
            </label>
            <textarea
              className="w-full min-h-[100px] rounded-monday-md border border-gray-200 px-monday-3 py-monday-2 text-monday-sm bg-monday-surface text-uipro-text placeholder:text-monday-text-placeholder focus:outline-none focus:ring-2 focus:ring-uipro-cta/50 focus:border-uipro-cta transition-colors duration-200"
              placeholder="请输入互动详情..."
              {...register('description')}
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              附件
            </label>
            <FileUpload
              onUploadComplete={(file) => setUploadedFiles(prev => [...prev, file])}
              onRemove={(fileId) => setUploadedFiles(prev => prev.filter(f => f.id !== fileId))}
              files={uploadedFiles}
            />
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel || (() => navigate('/interactions'))}
        >
          取消
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {buttonText}
        </Button>
      </div>
    </form>
  );
};
