/**
 * Customer Person Management Modal Component
 * 
 * Modal for managing customer contacts (people) in the customer list
 * Story 20.4: Customer List Integration
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { peopleService, Person, CreatePersonDto, UpdatePersonDto } from '../../people/people.service';
import { customersService } from '../customers.service';
import { ContactMethodIcon } from '../../people/components/ContactMethodIcon';
import { PersonCreateForm } from '../../people/components/PersonCreateForm';
import { PersonEditForm } from '../../people/components/PersonEditForm';
import { PrepareInteractionForm } from '../../interactions/components/PrepareInteractionForm';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { HomeModuleIcon } from '../../components/icons/HomeModuleIcons';
import { toast } from 'react-toastify';
import { getErrorMessage } from '../../utils/error-handling';
import { ContactMethodType } from '../../people/utils/contact-protocols';
import { getPersonName, getPersonInitials, getPersonAvatarColor, formatRelativeTime } from '../../people/utils/person-utils';
import { PersonInteractionStats } from '../../people/people.service';

interface CustomerPersonManagementModalProps {
  customerId: string;
  customerType: 'SUPPLIER' | 'BUYER';
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'list' | 'create' | 'edit' | 'interaction';

/**
 * Star icon component for important contacts
 */
const StarIcon: React.FC<{ filled?: boolean; className?: string }> = ({ filled = false, className = 'w-4 h-4' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
};

/**
 * Person Avatar Component
 * 
 * Displays a person's avatar with initials and color
 */
const PersonAvatar: React.FC<{ person: Person }> = ({ person }) => {
  const initials = getPersonInitials(person);
  const bgColor = getPersonAvatarColor(person.id);
  
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-monday-sm font-semibold flex-shrink-0"
      style={{ backgroundColor: bgColor }}
      aria-label={`${getPersonName(person)} 的头像`}
    >
      {initials}
    </div>
  );
};

/**
 * Person Card Component
 * 
 * Displays a single person (contact) card with contact methods and actions
 * New design: Card layout with avatar, company name, and action buttons at bottom
 */
const PersonCard: React.FC<{
  person: Person;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
  onContactMethodClick: (person: Person, method: ContactMethodType, value: string) => void;
  isDeleting: boolean;
  interactionStats?: PersonInteractionStats;
  isLoadingStats?: boolean;
}> = ({ person, onEdit, onDelete, onContactMethodClick, isDeleting, interactionStats, isLoadingStats }) => {
  const avatarColor = getPersonAvatarColor(person.id);
  
  return (
    <Card 
      variant="outlined" 
      className="p-monday-4 hover:shadow-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-uipro-cta focus-within:ring-opacity-50"
    >
      {/* Header: Avatar + Name + Star */}
      <div className="flex items-start gap-monday-3 mb-monday-3">
        <PersonAvatar person={person} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-monday-2 mb-monday-1">
            <h3 className="text-monday-base font-semibold text-uipro-text truncate font-uipro-heading">
              {getPersonName(person)}
            </h3>
            {person.isImportant && (
              <StarIcon 
                filled={true} 
                className="w-4 h-4 text-yellow-500 flex-shrink-0 transition-transform duration-200 hover:scale-110 cursor-pointer" 
                title="重要联系人"
              />
            )}
          </div>
          
          {/* Job title and Department - Story 20.9: Always reserve space for consistent card height */}
          <div className="flex items-center gap-monday-2 flex-wrap mb-monday-1 min-h-[20px]">
            {person.jobTitle ? (
              <span className="text-monday-sm text-uipro-secondary font-uipro-body">
                {person.jobTitle}
              </span>
            ) : (
              <span className="text-monday-sm text-transparent font-uipro-body select-none pointer-events-none">
                占位
              </span>
            )}
            {person.department ? (
              <span className="inline-flex items-center px-monday-2 py-monday-0.5 rounded-monday-sm text-monday-xs font-medium bg-uipro-cta/10 text-uipro-cta border border-uipro-cta/20">
                {person.department}
              </span>
            ) : (
              <span className="inline-flex items-center px-monday-2 py-monday-0.5 rounded-monday-sm text-monday-xs font-medium text-transparent border-transparent select-none pointer-events-none">
                占位
              </span>
            )}
          </div>
        </div>
      </div>


      {/* Contact history */}
      {isLoadingStats ? (
        <div className="mb-monday-3 text-monday-xs text-uipro-secondary">
          <span>加载中...</span>
        </div>
      ) : interactionStats ? (
        <div className="mb-monday-3 text-monday-xs text-uipro-secondary">
          <span>{formatRelativeTime(interactionStats.lastContactDate)}</span>
          <span className="mx-monday-1">·</span>
          <span>本月{interactionStats.thisMonthCount}次</span>
        </div>
      ) : null}

      {/* Divider between contact info and contact methods */}
      <div className="mb-monday-3 border-t border-gray-200"></div>

      {/* Contact methods */}
      <div className="flex items-center gap-monday-2 flex-wrap mb-monday-3">
        <ContactMethodIcon
          type="phone"
          hasValue={!!person.phone}
          value={person.phone}
          onClick={() => person.phone && onContactMethodClick(person, 'phone', person.phone!)}
        />
        <ContactMethodIcon
          type="mobile"
          hasValue={!!person.mobile}
          value={person.mobile}
          onClick={() => person.mobile && onContactMethodClick(person, 'mobile', person.mobile!)}
        />
        <ContactMethodIcon
          type="email"
          hasValue={!!person.email}
          value={person.email}
          onClick={() => person.email && onContactMethodClick(person, 'email', person.email!)}
        />
        <ContactMethodIcon
          type="wechat"
          hasValue={!!person.wechat}
          value={person.wechat}
          onClick={() => person.wechat && onContactMethodClick(person, 'wechat', person.wechat!)}
        />
        <ContactMethodIcon
          type="whatsapp"
          hasValue={!!person.whatsapp}
          value={person.whatsapp}
          onClick={() => person.whatsapp && onContactMethodClick(person, 'whatsapp', person.whatsapp!)}
        />
        <ContactMethodIcon
          type="linkedin"
          hasValue={!!person.linkedinUrl}
          value={person.linkedinUrl}
          onClick={() => person.linkedinUrl && onContactMethodClick(person, 'linkedin', person.linkedinUrl!)}
        />
        <ContactMethodIcon
          type="facebook"
          hasValue={!!person.facebook}
          value={person.facebook}
          onClick={() => person.facebook && onContactMethodClick(person, 'facebook', person.facebook!)}
        />
      </div>

      {/* Actions: Edit and Delete buttons at bottom */}
      <div className="flex items-center gap-monday-2 pt-monday-3 border-t border-gray-200">
        {isDeleting && (
          <HomeModuleIcon 
            name="arrowPath" 
            className="w-4 h-4 animate-spin text-uipro-secondary" 
            aria-label="删除中..."
          />
        )}
        <button
          type="button"
          onClick={() => onEdit(person)}
          disabled={isDeleting}
          className="flex-1 text-monday-sm font-medium text-uipro-cta hover:text-uipro-cta/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-uipro-cta focus:ring-opacity-50 rounded-monday-sm px-monday-2 py-monday-1 cursor-pointer"
          aria-label={`编辑 ${getPersonName(person)}`}
        >
          编辑
        </button>
        <span className="text-gray-300" aria-hidden="true">|</span>
        <button
          type="button"
          onClick={() => onDelete(person)}
          disabled={isDeleting}
          className="flex-1 text-monday-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 rounded-monday-sm px-monday-2 py-monday-1 cursor-pointer"
          aria-label={`删除 ${getPersonName(person)}`}
        >
          删除
        </button>
      </div>
    </Card>
  );
};

/**
 * Customer Person Management Modal Component
 * 
 * Modal for managing customer contacts (people) in the customer list
 */
export const CustomerPersonManagementModal: React.FC<CustomerPersonManagementModalProps> = ({
  customerId,
  customerType: _customerType, // Story 20.4: Reserved for future use (e.g., filtering by customer type)
  isOpen,
  onClose,
}) => {
  // Validate customerId format (UUID)
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId);
  
  if (!isValidUUID) {
    return null; // Don't render modal if customerId is invalid
  }

  const { token } = useAuth(); // Story 20.4: user not used in this component, but token is required for API calls
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(12); // 12 contacts per page (4 rows × 3 columns)
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportantFilter, setIsImportantFilter] = useState<boolean | undefined>(undefined);
  const [departmentFilter, setDepartmentFilter] = useState<string>(''); // Department filter
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedContactMethod, setSelectedContactMethod] = useState<{
    person: Person;
    method: ContactMethodType;
    value: string;
  } | null>(null);

  // Fetch customer information to display customer name in header
  const {
    data: customerData,
    isLoading: customerLoading,
  } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      return await customersService.getCustomer(customerId);
    },
    enabled: isOpen && !!customerId && !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);

  // Store trigger button reference when modal opens
  useEffect(() => {
    if (isOpen) {
      triggerButtonRef.current = document.activeElement as HTMLButtonElement;
      // Reset search and filter when modal opens
      setSearchQuery('');
      setIsImportantFilter(undefined);
      setDepartmentFilter('');
      setPage(1);
      setViewMode('list');
      setSelectedPerson(null);
      setSelectedContactMethod(null);
    }
  }, [isOpen]);

  // Reset page when search or filter changes
  useEffect(() => {
    if (isOpen && viewMode === 'list') {
      setPage(1);
    }
  }, [searchQuery, isImportantFilter, departmentFilter, isOpen, viewMode]);

  // Handle ESC key and focus trap (参考 CustomerAssociationManagementModal 第 172-226 行)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap: prevent tabbing outside modal
      if (event.key === 'Tab') {
        const modal = modalRef.current;
        if (!modal) return;

        const focusableElements = modal.querySelectorAll<HTMLElement>(
          'button:not([tabindex="-1"]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement || document.activeElement === modal) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Focus on close button when modal opens
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Return focus to trigger button when modal closes
  useEffect(() => {
    if (!isOpen && triggerButtonRef.current) {
      triggerButtonRef.current.focus();
      triggerButtonRef.current = null;
    }
  }, [isOpen]);

  // Fetch people (contacts)
  const {
    data: peopleData,
    isLoading: peopleLoading,
    error: peopleError,
    refetch: refetchPeople,
  } = useQuery({
    queryKey: ['people', customerId, page, limit, searchQuery, isImportantFilter],
    queryFn: async () => {
      return await peopleService.getPeople({
        companyId: customerId,
        search: searchQuery.trim() || undefined,
        isImportant: isImportantFilter,
        limit,
        offset: (page - 1) * limit,
      });
    },
    enabled: isOpen && !!customerId && !!token && viewMode === 'list',
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Get unique departments from people data
  const departments = useMemo(() => {
    if (!peopleData?.people) return [];
    const deptSet = new Set<string>();
    peopleData.people.forEach((person) => {
      if (person.department) {
        deptSet.add(person.department);
      }
    });
    return Array.from(deptSet).sort();
  }, [peopleData?.people]);

  // Filtered people (client-side filtering for search and department)
  const filteredPeople = useMemo(() => {
    if (!peopleData?.people) return [];

    let filtered = peopleData.people;

    // Client-side search (backend also does search, but we do additional filtering)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((person) => {
        const name = getPersonName(person).toLowerCase();
        const email = person.email?.toLowerCase() || '';
        const jobTitle = person.jobTitle?.toLowerCase() || '';
        const department = person.department?.toLowerCase() || '';
        const companyName = person.company?.name?.toLowerCase() || '';
        return (
          name.includes(query) ||
          email.includes(query) ||
          jobTitle.includes(query) ||
          department.includes(query) ||
          companyName.includes(query)
        );
      });
    }

    // Department filter
    if (departmentFilter) {
      filtered = filtered.filter((person) => person.department === departmentFilter);
    }

    return filtered;
  }, [peopleData?.people, searchQuery, departmentFilter]);

  // Batch query interaction stats for all filtered people
  const personIds = useMemo(() => 
    filteredPeople.map(p => p.id), 
    [filteredPeople]
  );

  // Create stable query key from sorted person IDs to avoid unnecessary re-queries
  const personIdsKey = useMemo(() => 
    personIds.slice().sort().join(','), 
    [personIds]
  );

  const { 
    data: batchStats, 
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['personInteractionStatsBatch', personIdsKey],
    queryFn: async () => {
      if (personIds.length === 0) return new Map<string, PersonInteractionStats>();
      return await peopleService.getMultiplePersonInteractionStats(personIds);
    },
    enabled: isOpen && personIds.length > 0 && viewMode === 'list',
    staleTime: 0, // Story 20.9: No cache to ensure fresh data after interaction creation
  });

  // Create person mutation
  const createPersonMutation = useMutation({
    mutationFn: async (data: CreatePersonDto) => {
      return await peopleService.createPerson(data);
    },
    onSuccess: () => {
      toast.success('联系人创建成功');
      queryClient.invalidateQueries({ queryKey: ['people', customerId] });
      setViewMode('list');
      setSelectedPerson(null);
    },
    onError: (error: Error) => {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || '创建联系人失败');
    },
  });

  // Update person mutation
  const updatePersonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePersonDto }) => {
      return await peopleService.updatePerson(id, data);
    },
    onSuccess: () => {
      toast.success('联系人更新成功');
      queryClient.invalidateQueries({ queryKey: ['people', customerId] });
      setViewMode('list');
      setSelectedPerson(null);
    },
    onError: (error: Error) => {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || '更新联系人失败');
    },
  });

  // Delete person mutation
  const deletePersonMutation = useMutation({
    mutationFn: async (personId: string) => {
      await peopleService.deletePerson(personId);
    },
    onSuccess: () => {
      toast.success('联系人删除成功');
      queryClient.invalidateQueries({ queryKey: ['people', customerId] });
      setIsDeleting(null);
    },
    onError: (error: Error) => {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || '删除联系人失败');
      setIsDeleting(null);
    },
  });

  // Handle create person
  const handleCreatePerson = useCallback(async (data: CreatePersonDto) => {
    await createPersonMutation.mutateAsync(data);
  }, [createPersonMutation]);

  // Handle update person
  const handleUpdatePerson = useCallback(async (data: UpdatePersonDto) => {
    if (!selectedPerson) return;
    await updatePersonMutation.mutateAsync({ id: selectedPerson.id, data });
  }, [selectedPerson, updatePersonMutation]);

  // Handle delete person
  const handleDeletePerson = useCallback((person: Person) => {
    const confirmed = window.confirm(
      `确定要删除联系人 "${getPersonName(person)}" 吗？\n此操作将软删除联系人（设置 deleted_at 字段）。`
    );
    if (confirmed) {
      setIsDeleting(person.id);
      deletePersonMutation.mutate(person.id);
    }
  }, [deletePersonMutation]);

  // Handle edit person
  const handleEditPerson = useCallback((person: Person) => {
    setSelectedPerson(person);
    setViewMode('edit');
  }, []);

  // Story 20.4: Handle contact method click - open InteractionCreateForm with prefill
  const handleContactMethodClick = useCallback((person: Person, method: ContactMethodType, value: string) => {
    // Set selected contact method and switch to interaction view
    setSelectedContactMethod({ person, method, value });
    setViewMode('interaction');
  }, []);

  // Debounce search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update search query when debounced value changes
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      // This will trigger the query refetch
    }
  }, [debouncedSearchQuery, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-monday-4"
      role="presentation"
    >
      {/* Clickable overlay to close modal */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 w-full h-full cursor-default"
        aria-label="关闭"
        tabIndex={-1}
      />
      <div
        ref={modalRef}
        className="relative max-w-6xl max-h-[90vh] w-full bg-monday-surface rounded-monday-lg shadow-monday-lg overflow-hidden z-10 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={viewMode === 'interaction' ? '准备互动' : '管理客户联系人'}
      >
        {/* Header */}
        <div className="flex flex-col gap-monday-3 p-monday-4 border-b border-gray-200">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-monday-2 text-monday-sm">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-monday-1 text-uipro-cta hover:text-uipro-cta/80 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-uipro-cta focus:ring-opacity-50 rounded-monday-sm px-monday-2 py-monday-1"
              aria-label="返回客户列表"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <span className="font-medium">客户列表</span>
            </button>
            <span className="text-uipro-secondary" aria-hidden="true">/</span>
            {customerData && (
              <>
                <span className="text-uipro-text font-medium">{customerData.name}</span>
                {viewMode === 'interaction' && (
                  <>
                    <span className="text-uipro-secondary" aria-hidden="true">/</span>
                    <span className="text-uipro-text font-medium">准备互动</span>
                  </>
                )}
              </>
            )}
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-monday-xl font-semibold text-uipro-text font-uipro-heading">
              {viewMode === 'interaction' ? '准备互动' : '管理客户联系人'}
            </h2>
            <div className="flex items-center gap-monday-2">
              {viewMode === 'list' && (
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => setViewMode('create')}
                >
                  新建联系人
                </Button>
              )}
              {(viewMode === 'create' || viewMode === 'edit') && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setViewMode('list');
                    setSelectedPerson(null);
                  }}
                >
                  返回列表
                </Button>
              )}
              {viewMode === 'interaction' && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Story 20.9: Return to list view and clear selected contact method
                    // Error handling: If viewMode is invalid, fallback to 'list'
                    try {
                      setViewMode('list');
                      setSelectedContactMethod(null);
                    } catch (error) {
                      // Fallback to 'list' view if state update fails
                      console.error('Error returning to list view:', error);
                      setViewMode('list');
                    }
                  }}
                  aria-label="返回联系人列表"
                  onKeyDown={(e) => {
                    // Keyboard support: Enter or Space key activates the button
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setViewMode('list');
                      setSelectedContactMethod(null);
                    }
                  }}
                >
                  返回列表
                </Button>
              )}
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="p-monday-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-uipro-cta focus:ring-opacity-50 transition-all duration-200 cursor-pointer border border-gray-300 rounded"
                aria-label="关闭"
                tabIndex={0}
              >
                <HomeModuleIcon name="xMark" className="w-5 h-5 text-uipro-text" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {viewMode === 'list' && (
            <div className="flex-1 overflow-y-auto p-monday-4">
              {/* Search and Filter */}
              <div className="mb-monday-4 space-y-monday-2">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索联系人（姓名、邮箱）..."
                  className="max-w-xs w-full"
                />
                <div className="flex items-center gap-monday-4 flex-wrap">
                  {/* Department filter */}
                  <div className="flex items-center gap-monday-2">
                    <label htmlFor="departmentFilter" className="text-monday-sm font-medium text-uipro-text whitespace-nowrap">
                      部门：
                    </label>
                    <select
                      id="departmentFilter"
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="px-monday-3 py-monday-1.5 border border-gray-300 rounded-monday-md text-monday-sm text-uipro-text bg-white focus:outline-none focus:ring-2 focus:ring-uipro-cta focus:ring-opacity-50 focus:border-transparent cursor-pointer transition-all duration-200 hover:border-uipro-cta/50"
                    >
                      <option value="">所有部门</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Important filter */}
                  <div className="flex items-center gap-monday-2">
                    <input
                      type="checkbox"
                      id="isImportantFilter"
                      checked={isImportantFilter === true}
                      onChange={(e) => setIsImportantFilter(e.target.checked ? true : undefined)}
                      className="w-4 h-4 text-uipro-cta border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-uipro-cta focus:ring-opacity-50 cursor-pointer transition-all duration-200 hover:border-uipro-cta/50"
                    />
                    <label htmlFor="isImportantFilter" className="text-monday-sm font-medium text-uipro-text cursor-pointer">
                      仅显示重要联系人
                    </label>
                  </div>
                </div>
              </div>

              {/* Global hint - using SVG icon instead of emoji */}
              <div className="mb-monday-4 p-monday-3 bg-uipro-cta/5 border border-uipro-cta/20 rounded-monday-md">
                <div className="flex items-start gap-monday-2">
                  <svg 
                    className="w-5 h-5 text-uipro-cta flex-shrink-0 mt-0.5" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                  <p className="text-monday-sm text-uipro-text font-uipro-body">
                    提示：点击联系人卡片中的图标可快速拨打电话、发送邮件或打开即时通讯应用
                  </p>
                </div>
              </div>

              {/* Statistics */}
                  {peopleData && (
                <div className="mb-monday-4">
                  <div className="text-monday-sm text-uipro-secondary font-uipro-body">
                    {searchQuery.trim() || isImportantFilter !== undefined || departmentFilter ? (
                      <>
                        共 {peopleData.total} 个联系人，当前筛选结果 {filteredPeople.length} 个
                      </>
                    ) : (
                      <>
                        共 {peopleData.total} 个联系人，当前页 {filteredPeople.length} 个
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {peopleLoading && (
                <div className="flex items-center justify-center py-monday-8">
                  <HomeModuleIcon name="arrowPath" className="w-5 h-5 animate-spin text-monday-text-secondary" />
                  <span className="ml-monday-2 text-monday-sm text-monday-text-secondary">加载中...</span>
                </div>
              )}

              {/* Error State */}
              {peopleError && (
                <div className="text-center py-monday-8">
                  <p className="text-monday-sm text-primary-red mb-monday-2">
                    {peopleError instanceof Error ? peopleError.message : '加载失败'}
                  </p>
                  <Button size="sm" onClick={() => refetchPeople()}>
                    重试
                  </Button>
                </div>
              )}

              {/* People List */}
              {!peopleLoading && !peopleError && (
                <>
                  {filteredPeople.length === 0 ? (
                    <div className="text-center py-monday-8">
                      {searchQuery.trim() || isImportantFilter !== undefined || departmentFilter ? (
                        <p className="text-monday-sm text-uipro-secondary font-uipro-body">
                          未找到匹配的联系人
                        </p>
                      ) : (
                        <>
                          <HomeModuleIcon name="user" className="w-12 h-12 mx-auto mb-monday-4 text-uipro-secondary opacity-50" />
                          <p className="text-monday-base text-uipro-secondary mb-monday-2 font-uipro-body">
                            该客户尚未添加联系人
                          </p>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setViewMode('create')}
                          >
                            新建联系人
                          </Button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-monday-4">
                      {filteredPeople.map((person) => (
                        <PersonCard
                          key={person.id}
                          person={person}
                          onEdit={handleEditPerson}
                          onDelete={handleDeletePerson}
                          onContactMethodClick={handleContactMethodClick}
                          isDeleting={isDeleting === person.id}
                          interactionStats={batchStats?.get(person.id)}
                          isLoadingStats={isLoadingStats}
                        />
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {peopleData && peopleData.total > limit && (
                    <div className="flex items-center justify-between mt-monday-4 pt-monday-4 border-t border-gray-200">
                      <span className="text-monday-sm text-monday-text-secondary">
                        共 {peopleData.total} 个联系人
                      </span>
                      <div className="flex gap-monday-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          上一页
                        </Button>
                        <span className="text-monday-sm text-monday-text-secondary flex items-center">
                          第 {page} 页，共 {Math.ceil(peopleData.total / limit)} 页
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPage((p) => p + 1)}
                          disabled={page >= Math.ceil(peopleData.total / limit)}
                        >
                          下一页
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Create Form View */}
          {viewMode === 'create' && (
            <div className="flex-1 overflow-y-auto p-monday-4">
              <PersonCreateForm
                onSubmit={handleCreatePerson}
                onCancel={() => {
                  setViewMode('list');
                  setSelectedPerson(null);
                }}
                prefillCompanyId={customerId}
              />
            </div>
          )}

          {/* Edit Form View */}
          {viewMode === 'edit' && selectedPerson && (
            <div className="flex-1 overflow-y-auto p-monday-4">
              <PersonEditForm
                person={selectedPerson}
                onSubmit={handleUpdatePerson}
                onCancel={() => {
                  setViewMode('list');
                  setSelectedPerson(null);
                }}
              />
            </div>
          )}

          {/* Story 20.4: Interaction Form View */}
          {viewMode === 'interaction' && selectedContactMethod && (
            <div className="flex-1 overflow-y-auto p-monday-4">
              <PrepareInteractionForm
                initialCustomerId={customerId}
                initialPersonId={selectedContactMethod.person.id}
                initialContactMethod={selectedContactMethod.method}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['people', customerId] });
                  queryClient.invalidateQueries({ queryKey: ['personInteractionStatsBatch'] });
                  queryClient.invalidateQueries({ queryKey: ['personInteractionStats'] });
                  refetchStats();
                  setViewMode('list');
                  setSelectedContactMethod(null);
                }}
                onCancel={() => {
                  setViewMode('list');
                  setSelectedContactMethod(null);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
