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
import { ContactMethodIcon } from '../../people/components/ContactMethodIcon';
import { PersonCreateForm } from '../../people/components/PersonCreateForm';
import { PersonEditForm } from '../../people/components/PersonEditForm';
import { InteractionCreateForm } from '../../interactions/components/InteractionCreateForm'; // Story 20.4: For quick interaction creation
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { HomeModuleIcon } from '../../components/icons/HomeModuleIcons';
import { toast } from 'react-toastify';
import { getErrorMessage } from '../../utils/error-handling';
import { ContactMethodType } from '../../people/utils/contact-protocols';

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
 * Get person display name
 */
const getPersonName = (person: Person): string => {
  if (person.firstName && person.lastName) {
    return `${person.firstName} ${person.lastName}`;
  }
  return person.firstName || person.lastName || '未命名联系人';
};

/**
 * Person Card Component
 * 
 * Displays a single person (contact) card with contact methods and actions
 */
const PersonCard: React.FC<{
  person: Person;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
  onContactMethodClick: (person: Person, method: ContactMethodType, value: string) => void;
  isDeleting: boolean;
}> = ({ person, onEdit, onDelete, onContactMethodClick, isDeleting }) => {
  return (
    <Card variant="outlined" className="p-monday-3 hover:shadow-monday-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Name with star */}
          <div className="flex items-center gap-monday-2 mb-monday-2">
            {person.isImportant && (
              <StarIcon filled={true} className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            )}
            <h3 className="text-monday-base font-semibold text-monday-text truncate">
              {getPersonName(person)}
            </h3>
          </div>

          {/* Job title and department */}
          {(person.jobTitle || person.department) && (
            <div className="text-monday-sm text-monday-text-secondary mb-monday-2">
              {person.jobTitle && <div>{person.jobTitle}</div>}
              {person.department && <div className="text-monday-xs text-gray-600">{person.department}</div>}
            </div>
          )}

          {/* Contact methods */}
          <div className="flex items-center gap-monday-2 flex-wrap">
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
        </div>

        {/* Actions */}
        <div className="ml-monday-4 flex items-center gap-monday-2">
          {isDeleting && (
            <HomeModuleIcon name="arrowPath" className="w-4 h-4 animate-spin text-monday-text-secondary" />
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onEdit(person)}
            disabled={isDeleting}
            className="text-uipro-cta hover:bg-uipro-cta/10 cursor-pointer transition-colors duration-200"
            leftIcon={<HomeModuleIcon name="pencilSquare" className="w-4 h-4 flex-shrink-0" />}
          >
            编辑
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onDelete(person)}
            disabled={isDeleting}
            className="text-semantic-error hover:bg-semantic-error/10 cursor-pointer transition-colors duration-200"
            leftIcon={<HomeModuleIcon name="trash" className="w-4 h-4 flex-shrink-0" />}
          >
            删除
          </Button>
        </div>
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
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportantFilter, setIsImportantFilter] = useState<boolean | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedContactMethod, setSelectedContactMethod] = useState<{
    person: Person;
    method: ContactMethodType;
    value: string;
  } | null>(null);

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
  }, [searchQuery, isImportantFilter, isOpen, viewMode]);

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

  // Filtered people (client-side filtering for search)
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
        return (
          name.includes(query) ||
          email.includes(query) ||
          jobTitle.includes(query) ||
          department.includes(query)
        );
      });
    }

    return filtered;
  }, [peopleData?.people, searchQuery]);

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
        aria-label="管理客户联系人"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-monday-4 border-b border-gray-200">
          <h2 className="text-monday-xl font-semibold text-monday-text">管理客户联系人</h2>
          <div className="flex items-center gap-monday-2">
            {viewMode === 'list' && (
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() => setViewMode('create')}
                leftIcon={<HomeModuleIcon name="plus" className="w-4 h-4 flex-shrink-0" />}
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
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-monday-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="关闭"
              tabIndex={0}
            >
              <span className="text-monday-xl">✕</span>
            </button>
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
                  placeholder="搜索联系人（姓名、邮箱、职位、部门）..."
                  className="w-full"
                />
                <div className="flex items-center gap-monday-2">
                  <input
                    type="checkbox"
                    id="isImportantFilter"
                    checked={isImportantFilter === true}
                    onChange={(e) => setIsImportantFilter(e.target.checked ? true : undefined)}
                    className="w-4 h-4 text-uipro-cta border-gray-300 rounded focus:ring-uipro-cta cursor-pointer transition-colors duration-200"
                  />
                  <label htmlFor="isImportantFilter" className="text-monday-sm font-medium text-uipro-text cursor-pointer">
                    仅显示重要联系人
                  </label>
                </div>
              </div>

              {/* Statistics */}
              {peopleData && (
                <div className="mb-monday-4">
                  <div className="text-monday-sm text-monday-text-secondary">
                    {searchQuery.trim() || isImportantFilter !== undefined ? (
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
                      {searchQuery.trim() || isImportantFilter !== undefined ? (
                        <p className="text-monday-sm text-monday-text-secondary">
                          未找到匹配的联系人
                        </p>
                      ) : (
                        <>
                          <HomeModuleIcon name="user" className="w-12 h-12 mx-auto mb-monday-4 text-monday-text-secondary opacity-50" />
                          <p className="text-monday-base text-monday-text-secondary mb-monday-2">
                            该客户尚未添加联系人
                          </p>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setViewMode('create')}
                            leftIcon={<HomeModuleIcon name="plus" className="w-4 h-4 flex-shrink-0" />}
                          >
                            新建联系人
                          </Button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-monday-2">
                      {filteredPeople.map((person) => (
                        <PersonCard
                          key={person.id}
                          person={person}
                          onEdit={handleEditPerson}
                          onDelete={handleDeletePerson}
                          onContactMethodClick={handleContactMethodClick}
                          isDeleting={isDeleting === person.id}
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
              <InteractionCreateForm
                prefillCustomerId={customerId}
                prefillPersonId={selectedContactMethod.person.id}
                prefillContactMethod={selectedContactMethod.method}
                onSuccess={() => {
                  // Refresh people list and return to list view
                  queryClient.invalidateQueries({ queryKey: ['people', customerId] });
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
