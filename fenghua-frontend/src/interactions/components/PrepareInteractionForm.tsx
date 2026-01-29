/**
 * PrepareInteractionForm
 *
 * 「准备互动」路径：基于已选客户 + 联系人 + 联系方式的场景。
 * 仅展示只读上下文摘要 + 创建互动记录勾选 + 产品/类型/描述（无客户/联系人选择、无附件）。
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { getInteractionTypeLabel } from '../constants/interaction-types';
import {
  CreateInteractionDto,
  FrontendInteractionType,
  BackendInteractionType,
  InteractionStatus,
  interactionsService,
} from '../services/interactions.service';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';
import { Customer } from '../../customers/customers.service';
import { customersService } from '../../customers/customers.service';
import { Product } from '../../products/products.service';
import { productsService } from '../../products/products.service';
import { peopleService, Person } from '../../people/people.service';
import { generateProtocol, openContactProtocol, ContactMethodType } from '../../people/utils/contact-protocols';
import { getPersonName } from '../../people/utils/person-utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { InteractionRecordFields } from './InteractionRecordFields';

/** 联系方式中文标签 */
const CONTACT_METHOD_LABELS: Record<ContactMethodType, string> = {
  phone: '电话',
  mobile: '手机',
  email: '邮箱',
  wechat: '微信',
  whatsapp: 'WhatsApp',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
};

export interface PrepareInteractionFormProps {
  /** 客户 ID（必填，来自弹窗上下文） */
  initialCustomerId: string;
  /** 联系人 ID（必填，来自弹窗上下文） */
  initialPersonId: string;
  /** 联系方式（必填，来自点击的 icon） */
  initialContactMethod: ContactMethodType;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PrepareInteractionForm: React.FC<PrepareInteractionFormProps> = ({
  initialCustomerId,
  initialPersonId,
  initialContactMethod,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [createInteractionRecord, setCreateInteractionRecord] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CreateInteractionDto>({
    defaultValues: {
      interactionType: undefined,
      interactionDate: new Date().toISOString().slice(0, 16),
      status: InteractionStatus.IN_PROGRESS,
      description: '',
      personId: initialPersonId,
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    customersService.getCustomer(initialCustomerId).then(setCustomer).catch(console.error);
  }, [initialCustomerId]);

  useEffect(() => {
    peopleService.getPerson(initialPersonId).then(setPerson).catch(console.error);
  }, [initialPersonId]);

  const { data: customerProducts = [], isLoading: isLoadingCustomerProducts } = useQuery({
    queryKey: ['customer-products', initialCustomerId],
    queryFn: async () => {
      const response = await productsService.getCustomerProducts(initialCustomerId);
      return response.products;
    },
    enabled: !!initialCustomerId,
  });

  const availableInteractionTypes = useMemo(() => {
    if (user?.role === 'FRONTEND_SPECIALIST') return Object.values(FrontendInteractionType);
    if (user?.role === 'BACKEND_SPECIALIST') return Object.values(BackendInteractionType);
    return [...Object.values(FrontendInteractionType), ...Object.values(BackendInteractionType)];
  }, [user?.role]);

  const interactionTypeOptions = useMemo(
    () => availableInteractionTypes.map((type) => ({ value: type, label: getInteractionTypeLabel(type) })),
    [availableInteractionTypes]
  );

  const getInteractionTypeColorClasses = (value: string): string => {
    const colorMap: Record<string, string> = {
      [FrontendInteractionType.INITIAL_CONTACT]: 'bg-blue-600 text-white border-blue-600',
      [FrontendInteractionType.PRODUCT_INQUIRY]: 'bg-blue-500 text-white border-blue-500',
      [FrontendInteractionType.QUOTATION]: 'bg-cyan-500 text-white border-cyan-500',
      [FrontendInteractionType.QUOTATION_ACCEPTED]: 'bg-teal-500 text-white border-teal-500',
      [FrontendInteractionType.QUOTATION_REJECTED]: 'bg-semantic-error text-white border-semantic-error',
      [FrontendInteractionType.ORDER_SIGNED]: 'bg-green-500 text-white border-green-500',
      [FrontendInteractionType.ORDER_FOLLOW_UP]: 'bg-lime-500 text-white border-lime-500',
      [FrontendInteractionType.ORDER_COMPLETED]: 'bg-emerald-500 text-white border-emerald-500',
      [BackendInteractionType.PRODUCT_INQUIRY_SUPPLIER]: 'bg-yellow-500 text-gray-800 border-yellow-500',
      [BackendInteractionType.QUOTATION_RECEIVED]: 'bg-amber-500 text-white border-amber-500',
      [BackendInteractionType.SPECIFICATION_CONFIRMED]: 'bg-orange-500 text-white border-orange-500',
      [BackendInteractionType.PRODUCTION_PROGRESS]: 'bg-orange-600 text-white border-orange-600',
      [BackendInteractionType.PRE_SHIPMENT_INSPECTION]: 'bg-semantic-error text-white border-semantic-error',
      [BackendInteractionType.SHIPPED]: 'bg-semantic-error text-white border-semantic-error',
    };
    return colorMap[value] || 'bg-gray-500 text-white border-gray-500';
  };

  const createMutation = useMutation({
    mutationFn: async (data: CreateInteractionDto) => interactionsService.createInteraction(data),
    onSuccess: () => {
      toast.success('互动记录创建成功');
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['personInteractionStatsBatch'] });
      queryClient.invalidateQueries({ queryKey: ['personInteractionStats'] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      onSuccess?.();
    },
    onError: (error: Error) => toast.error(`创建失败: ${error.message}`),
  });

  const openContact = () => {
    if (!person) return;
    const value =
      initialContactMethod === 'phone'
        ? person.phone
        : initialContactMethod === 'mobile'
          ? person.mobile
          : initialContactMethod === 'email'
            ? person.email
            : initialContactMethod === 'wechat'
              ? person.wechat
              : initialContactMethod === 'whatsapp'
                ? person.whatsapp
                : initialContactMethod === 'linkedin'
                  ? person.linkedinUrl
                  : person.facebook;
    if (!value) {
      toast.warning('该联系方式暂无值');
      return;
    }
    const url = generateProtocol(initialContactMethod, value);
    openContactProtocol(url);
    toast.info(`正在通过 ${CONTACT_METHOD_LABELS[initialContactMethod]} 联系 ${getPersonName(person)}...`);
  };

  const onSubmit = (data: CreateInteractionDto) => {
    if (!createInteractionRecord) {
      openContact();
      onSuccess?.();
      return;
    }
    const currentType = getValues('interactionType') || watch('interactionType');
    if (!currentType) {
      toast.error('请选择互动类型');
      return;
    }
    if (selectedProducts.length === 0) {
      toast.error('请至少选择一个产品');
      return;
    }
    const payload: CreateInteractionDto = {
      ...data,
      interactionType: currentType,
      interactionDate: new Date().toISOString().slice(0, 16),
      status: InteractionStatus.IN_PROGRESS,
      customerId: initialCustomerId,
      personId: initialPersonId,
      productIds: selectedProducts.map((p) => p.id),
    };
    createMutation.mutate(payload, {
      onSuccess: () => openContact(),
    });
  };

  const buttonText = createInteractionRecord ? '创建互动记录并开始互动' : '开始互动';

  if (!customer || !person) {
    return (
      <div className="flex items-center justify-center p-monday-6 text-uipro-secondary">
        加载客户与联系人信息…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-uipro-body">
      {/* 只读上下文：客户 - 联系人 - 联系方式 */}
      <div className="p-monday-4 bg-uipro-bg rounded-monday-lg border border-gray-200">
        <p className="text-monday-sm text-uipro-secondary mb-monday-1">正在为以下对象准备互动</p>
        <p className="text-monday-base font-medium text-uipro-text">
          {customer.name} · {getPersonName(person)}（{CONTACT_METHOD_LABELS[initialContactMethod]}）
        </p>
      </div>

      <InteractionRecordFields
        createInteractionRecord={createInteractionRecord}
        setCreateInteractionRecord={setCreateInteractionRecord}
        selectedCustomer={customer}
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
        showAttachments={false}
        isSubmitting={isSubmitting}
      />

      <div className="flex flex-col sm:flex-row justify-end gap-monday-3 pt-monday-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          取消
        </Button>
        <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting} className="w-full sm:w-auto">
          {buttonText}
        </Button>
      </div>
    </form>
  );
};
