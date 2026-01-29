/**
 * Person Management Page
 * 
 * Main page for person (contact) management
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { peopleService, Person, CreatePersonDto, UpdatePersonDto, PersonQueryParams } from './people.service';
import { PersonList } from './components/PersonList';
import { PersonCreateForm } from './components/PersonCreateForm';
import { PersonEditForm } from './components/PersonEditForm';
import { PersonSearch, PersonSearchFilters } from './components/PersonSearch';
import { PersonDetailPanel } from './components/PersonDetailPanel';
import { MainLayout } from '../components/layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getErrorMessage } from '../utils/error-handling';
import { toast } from 'react-toastify';
import { HomeModuleIcon } from '../components/icons/HomeModuleIcons';

type ViewMode = 'list' | 'create' | 'edit';

export const PersonManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasAutoSelectedPerson = useRef(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<PersonQueryParams>({
    limit: 20,
    offset: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFilters, setSearchFilters] = useState<PersonSearchFilters>(() => {
    const q = searchParams.get('search');
    return q ? { search: q } : {};
  });
  const [isSearchMode, setIsSearchMode] = useState(() => !!searchParams.get('search'));
  const [searchPage, setSearchPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; person: Person | null }>({
    show: false,
    person: null,
  });
  /** 用于忽略过期请求：只有最新一次 loadData 的结果会更新 error/loading/列表，避免 401/400 覆盖已成功的列表 */
  const loadIdRef = useRef(0);
  /** Story 20.6: Batch selection state */
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [batchConfirm, setBatchConfirm] = useState<{
    show: boolean;
    action: 'mark-important' | 'unmark-important' | 'delete' | null;
  }>({
    show: false,
    action: null,
  });
  const queryClient = useQueryClient();

  // Unified data loading function
  const loadData = useCallback(async () => {
    const myId = ++loadIdRef.current;
    try {
      setLoading(true);
      setError(null);

      let queryParams: PersonQueryParams;

      if (isSearchMode) {
        queryParams = {
          limit: 20,
          offset: (searchPage - 1) * 20,
          search: searchFilters.search,
          companyId: searchFilters.companyId,
          isImportant: searchFilters.isImportant,
        };
      } else {
        queryParams = { ...filters };
      }

      const response = await peopleService.getPeople(queryParams);
      if (myId !== loadIdRef.current) return;
      setPeople(response.people);
      setTotal(response.total);
      setError(null);
    } catch (err: unknown) {
      if (myId !== loadIdRef.current) return;
      setError(getErrorMessage(err) || (isSearchMode ? '搜索失败' : '加载联系人列表失败'));
    } finally {
      if (myId === loadIdRef.current) setLoading(false);
    }
  }, [filters, isSearchMode, searchFilters, searchPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Story 20.6: Clear selected person IDs when list updates or selected persons are deleted
  useEffect(() => {
    const validIds = people.map(p => p.id);
    setSelectedPersonIds(prev => prev.filter(id => validIds.includes(id)));
  }, [people]);

  // Auto-select person from URL query parameter
  useEffect(() => {
    const personIdFromUrl = searchParams.get('personId');
    
    // Only auto-select if:
    // 1. There's a personId in URL
    // 2. People are loaded (or loading is complete)
    // 3. We haven't already auto-selected (to avoid re-selecting on re-renders)
    // 4. No person is currently selected
    if (
      personIdFromUrl &&
      !loading &&
      !hasAutoSelectedPerson.current &&
      !selectedPerson
    ) {
      // First, try to find the person in the current list
      const personToSelect = people.find(p => p.id === personIdFromUrl);
      
      // If person is not in current list, load it separately
      if (!personToSelect) {
        peopleService.getPerson(personIdFromUrl)
          .then((person) => {
            setSelectedPerson(person);
            setShowDetailPanel(true);
            hasAutoSelectedPerson.current = true;
            
            // Remove personId from URL to clean it up
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('personId');
            setSearchParams(newSearchParams, { replace: true });
          })
          .catch((err) => {
            console.error('Failed to load person:', err);
            // Remove invalid personId from URL
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('personId');
            setSearchParams(newSearchParams, { replace: true });
          });
      } else {
        // Person found in current list, select it
        setSelectedPerson(personToSelect);
        setShowDetailPanel(true);
        hasAutoSelectedPerson.current = true;
        
        // Remove personId from URL to clean it up
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('personId');
        setSearchParams(newSearchParams, { replace: true });
      }
    }
    
    // Reset the flag when personId changes or people change
    if (personIdFromUrl !== searchParams.get('personId')) {
      hasAutoSelectedPerson.current = false;
    }
  }, [searchParams, people, loading, selectedPerson, setSearchParams]);

  // Handle search
  const handleSearch = useCallback((filters: PersonSearchFilters) => {
    const isSearching = !!(filters.search || filters.companyId || filters.isImportant !== undefined);
    
    setSearchFilters(filters);
    setIsSearchMode(isSearching);
    setSearchPage(1);
    
    if (isSearching) {
      // Search mode: update search filters only, don't update main filters
      // loadData will use searchFilters when isSearchMode is true
    } else {
      // Clear search: reset to normal list mode
      setFilters({ limit: 20, offset: 0 });
      setCurrentPage(1);
    }
  }, []);

  const handleCreate = () => {
    setViewMode('create');
    setError(null);
    setSuccessMessage(null);
  };

  const handleSelect = (person: Person) => {
    setSelectedPerson(person);
    setShowDetailPanel(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    setSelectedPerson(null);
    setShowDetailPanel(false);
    setViewMode('edit');
    setError(null);
    setSuccessMessage(null);
  };

  const handleDelete = (person: Person) => {
    setDeleteConfirm({ show: true, person });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, person: null });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.person) return;

    try {
      await peopleService.deletePerson(deleteConfirm.person.id);
      const personName = `${deleteConfirm.person.firstName || ''} ${deleteConfirm.person.lastName || ''}`.trim() || '未命名联系人';
      setSuccessMessage(`联系人 "${personName}" 删除成功`);
      setDeleteConfirm({ show: false, person: null });
      // Remove from selected list if it was selected
      setSelectedPersonIds(prev => prev.filter(id => id !== deleteConfirm.person!.id));
      await loadData();
      if (selectedPerson?.id === deleteConfirm.person.id) {
        setSelectedPerson(null);
        setShowDetailPanel(false);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || '删除联系人失败');
      setDeleteConfirm({ show: false, person: null });
    }
  };

  // Story 20.6: Batch operations
  const batchMarkImportantMutation = useMutation({
    mutationFn: async (personIds: string[]) => {
      const results = await Promise.allSettled(
        personIds.map(id => peopleService.updatePerson(id, { isImportant: true }))
      );
      return results;
    },
    onSuccess: (results, personIds) => {
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;
      if (failCount === 0) {
        toast.success(`成功标记 ${successCount} 个联系人为重要`);
      } else {
        toast.warning(`成功标记 ${successCount} 个，失败 ${failCount} 个`);
      }
      queryClient.invalidateQueries({ queryKey: ['people'] });
      setSelectedPersonIds([]);
      loadData();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || '批量标记失败');
    },
  });

  const batchUnmarkImportantMutation = useMutation({
    mutationFn: async (personIds: string[]) => {
      const results = await Promise.allSettled(
        personIds.map(id => peopleService.updatePerson(id, { isImportant: false }))
      );
      return results;
    },
    onSuccess: (results, personIds) => {
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;
      if (failCount === 0) {
        toast.success(`成功取消 ${successCount} 个联系人的重要标记`);
      } else {
        toast.warning(`成功取消 ${successCount} 个，失败 ${failCount} 个`);
      }
      queryClient.invalidateQueries({ queryKey: ['people'] });
      setSelectedPersonIds([]);
      loadData();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || '批量取消标记失败');
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: async (personIds: string[]) => {
      const results = await Promise.allSettled(
        personIds.map(id => peopleService.deletePerson(id))
      );
      return results;
    },
    onSuccess: (results, personIds) => {
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;
      if (failCount === 0) {
        toast.success(`成功删除 ${successCount} 个联系人`);
      } else {
        toast.warning(`成功删除 ${successCount} 个，失败 ${failCount} 个`);
      }
      queryClient.invalidateQueries({ queryKey: ['people'] });
      setSelectedPersonIds([]);
      loadData();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || '批量删除失败');
    },
  });

  const handleBatchAction = (action: 'mark-important' | 'unmark-important' | 'delete') => {
    if (selectedPersonIds.length === 0) {
      toast.warning('请至少选择一个联系人');
      return;
    }
    setBatchConfirm({ show: true, action });
  };

  const cancelBatchAction = () => {
    setBatchConfirm({ show: false, action: null });
  };

  const confirmBatchAction = () => {
    if (!batchConfirm.action || selectedPersonIds.length === 0) return;

    switch (batchConfirm.action) {
      case 'mark-important':
        batchMarkImportantMutation.mutate(selectedPersonIds);
        break;
      case 'unmark-important':
        batchUnmarkImportantMutation.mutate(selectedPersonIds);
        break;
      case 'delete':
        batchDeleteMutation.mutate(selectedPersonIds);
        break;
    }
    setBatchConfirm({ show: false, action: null });
  };

  const getBatchActionLabel = (action: string): string => {
    switch (action) {
      case 'mark-important':
        return '批量标记为重要';
      case 'unmark-important':
        return '批量取消重要标记';
      case 'delete':
        return '批量删除';
      default:
        return '批量操作';
    }
  };

  // Story 20.6: Statistics queries
  const { data: totalStats, refetch: refetchTotalStats } = useQuery({
    queryKey: ['people-stats', 'total'],
    queryFn: async () => {
      const response = await peopleService.getPeople({ limit: 1 });
      return response.total;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: importantStats, refetch: refetchImportantStats } = useQuery({
    queryKey: ['people-stats', 'important'],
    queryFn: async () => {
      const response = await peopleService.getPeople({ isImportant: true, limit: 1 });
      return response.total;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: statsUpdatedAt } = useQuery({
    queryKey: ['people-stats', 'updated-at'],
    queryFn: async () => new Date(),
    staleTime: 5 * 60 * 1000,
  });

  const handleRefreshStats = useCallback(() => {
    refetchTotalStats();
    refetchImportantStats();
  }, [refetchTotalStats, refetchImportantStats]);

  const formatStatsTime = (date: Date | undefined): string => {
    if (!date) return '—';
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSubmit = async (data: CreatePersonDto | UpdatePersonDto) => {
    try {
      setError(null);
      if (viewMode === 'create') {
        // Note: PersonCreateForm already creates the person
        // This callback is called after creation for consistency
        setSuccessMessage('联系人创建成功');
      } else {
        if (!editingPerson) return;
        await peopleService.updatePerson(editingPerson.id, data as UpdatePersonDto);
        setSuccessMessage('联系人更新成功');
        // Reload the person to get updated data
        const updatedPerson = await peopleService.getPerson(editingPerson.id);
        if (selectedPerson?.id === updatedPerson.id) {
          setSelectedPerson(updatedPerson);
        }
      }
      setViewMode('list');
      setEditingPerson(null);
      setSelectedPerson(null);
      setShowDetailPanel(false);
      await loadData();
    } catch (err: unknown) {
      setError(getErrorMessage(err) || `${viewMode === 'create' ? '创建' : '更新'}联系人失败`);
      throw err;
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingPerson(null);
    setError(null);
    setSuccessMessage(null);
  };

  const handlePageChange = (page: number) => {
    if (isSearchMode) {
      setSearchPage(page);
    } else {
      const limit = filters.limit || 20;
      setFilters((prev) => ({ ...prev, offset: (page - 1) * limit }));
      setCurrentPage(page);
    }
  };

  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false);
    setSelectedPerson(null);
  };

  const totalPages = Math.ceil(total / (filters.limit || 20));

  // Toolbar component
  const toolbar = viewMode === 'list' ? (
    <Card variant="default" className="w-full p-monday-4">
      <div className="flex items-center gap-monday-3 flex-wrap">
        <div className="flex-1 min-w-[300px]">
          <PersonSearch
            onSearch={handleSearch}
            initialFilters={searchFilters}
            loading={loading}
            userRole={currentUser?.role}
          />
        </div>
        <div className="flex items-center gap-monday-3 flex-shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={handleCreate}
            className="whitespace-nowrap"
          >
            新建联系人
          </Button>
        </div>
      </div>
    </Card>
  ) : null;

  return (
    <MainLayout 
      title="联系人管理"
      detailPanel={
        selectedPerson ? (
          <PersonDetailPanel
            person={selectedPerson}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : undefined
      }
      detailPanelTitle="联系人详情"
      showDetailPanel={showDetailPanel && viewMode === 'list'}
      onCloseDetailPanel={handleCloseDetailPanel}
    >
      {viewMode === 'list' ? (
        <div className="space-y-monday-4">
          {/* Story 20.6: Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-monday-4">
            <Card variant="default" className="p-monday-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-monday-sm text-uipro-secondary mb-monday-2">总联系人数量</p>
                  <div className="flex items-baseline gap-monday-2">
                    <p className="text-monday-2xl font-semibold text-uipro-text">
                      {totalStats !== undefined ? totalStats.toLocaleString('zh-CN') : '—'}
                    </p>
                  </div>
                </div>
                <div className="ml-monday-4 text-uipro-secondary">
                  <HomeModuleIcon name="userGroup" className="w-8 h-8" />
                </div>
              </div>
            </Card>
            <Card variant="default" className="p-monday-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-monday-sm text-uipro-secondary mb-monday-2">重要联系人数量</p>
                  <div className="flex items-baseline gap-monday-2">
                    <p className="text-monday-2xl font-semibold text-uipro-text">
                      {importantStats !== undefined ? importantStats.toLocaleString('zh-CN') : '—'}
                    </p>
                  </div>
                </div>
                <div className="ml-monday-4 text-yellow-500">
                  <HomeModuleIcon name="star" className="w-8 h-8" />
                </div>
              </div>
            </Card>
            <Card variant="default" className="p-monday-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-monday-sm text-uipro-secondary mb-monday-2">最后更新</p>
                  <div className="flex items-baseline gap-monday-2">
                    <p className="text-monday-base font-medium text-uipro-text">
                      {formatStatsTime(statsUpdatedAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshStats}
                    className="mt-monday-2 text-uipro-cta hover:bg-uipro-cta/10 cursor-pointer transition-colors duration-200"
                  >
                    <HomeModuleIcon name="arrowPath" className="w-4 h-4 mr-monday-1" />
                    刷新
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Toolbar Card */}
          {toolbar}

          {/* Person List Card */}
          <Card variant="default" className="w-full">
            {successMessage && (
              <div className="mb-monday-4 p-monday-4 bg-primary-green/20 border border-primary-green rounded-monday-md text-primary-green text-monday-sm" role="alert">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="mb-monday-4 p-monday-4 bg-primary-red/20 border border-primary-red rounded-monday-md text-primary-red text-monday-sm" role="alert">
                {error}
              </div>
            )}

            <h2 className="text-monday-2xl font-bold text-uipro-text mb-monday-6 tracking-tight font-uipro-heading">联系人列表</h2>
            {/* Story 20.6: Batch operations toolbar */}
            {selectedPersonIds.length > 0 && (
              <Card variant="default" className="mb-monday-4 p-monday-4 bg-uipro-cta/5 border border-uipro-cta/20">
                <div className="flex items-center justify-between flex-wrap gap-monday-3">
                  <div className="flex items-center gap-monday-2">
                    <span className="text-monday-sm font-semibold text-uipro-text">
                      已选择 <span className="text-uipro-cta">{selectedPersonIds.length}</span> 个联系人
                    </span>
                  </div>
                  <div className="flex items-center gap-monday-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBatchAction('mark-important')}
                      disabled={
                        batchMarkImportantMutation.isPending ||
                        batchUnmarkImportantMutation.isPending ||
                        batchDeleteMutation.isPending
                      }
                      className="text-uipro-cta hover:bg-uipro-cta/10 cursor-pointer transition-colors duration-200"
                    >
                      标记为重要
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBatchAction('unmark-important')}
                      disabled={
                        batchMarkImportantMutation.isPending ||
                        batchUnmarkImportantMutation.isPending ||
                        batchDeleteMutation.isPending
                      }
                      className="text-uipro-cta hover:bg-uipro-cta/10 cursor-pointer transition-colors duration-200"
                    >
                      取消重要标记
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBatchAction('delete')}
                      disabled={
                        batchMarkImportantMutation.isPending ||
                        batchUnmarkImportantMutation.isPending ||
                        batchDeleteMutation.isPending
                      }
                      className="text-semantic-error hover:bg-semantic-error/10 cursor-pointer transition-colors duration-200"
                    >
                      删除
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPersonIds([])}
                      disabled={
                        batchMarkImportantMutation.isPending ||
                        batchUnmarkImportantMutation.isPending ||
                        batchDeleteMutation.isPending
                      }
                      className="text-monday-text-secondary hover:text-monday-text cursor-pointer transition-colors duration-200"
                    >
                      取消选择
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <PersonList
              people={people}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSelect={handleSelect}
              loading={loading}
              searchQuery={searchFilters.search}
              selectedPersonIds={selectedPersonIds}
              onSelectionChange={setSelectedPersonIds}
            />
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-monday-4 mt-monday-6 pt-monday-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="cursor-pointer transition-colors duration-200"
                >
                  上一页
                </Button>
                <span className="text-monday-base text-uipro-text">
                  第 {currentPage} 页，共 {totalPages} 页（共 {total} 条）
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="cursor-pointer transition-colors duration-200"
                >
                  下一页
                </Button>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <Card variant="default" className="max-w-3xl mx-auto">
          <h2 className="text-monday-2xl font-semibold text-monday-text mb-monday-6">
            {viewMode === 'create' ? '创建新联系人' : '编辑联系人'}
          </h2>
          {viewMode === 'create' ? (
            <PersonCreateForm
              onSubmit={handleSubmit as (data: CreatePersonDto) => Promise<void>}
              onCancel={handleCancel}
            />
          ) : editingPerson ? (
            <PersonEditForm
              person={editingPerson}
              onSubmit={handleSubmit as (data: UpdatePersonDto) => Promise<void>}
              onCancel={handleCancel}
            />
          ) : null}
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && deleteConfirm.person && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-monday-4 z-50" 
          onClick={cancelDelete}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              cancelDelete();
            }
          }}
          role="presentation"
          tabIndex={-1}
        >
          <Card variant="elevated" className="max-w-md w-full" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
            <h3 id="delete-confirm-title" className="text-monday-xl font-semibold text-monday-text mb-monday-4">确认删除</h3>
            <p className="text-monday-base text-monday-text mb-monday-6">
              确定要删除联系人 <strong>{`${deleteConfirm.person.firstName || ''} ${deleteConfirm.person.lastName || ''}`.trim() || '未命名联系人'}</strong> 吗？
            </p>
            <p className="text-monday-sm text-monday-text-secondary mb-monday-6">
              如果联系人有关联的互动记录，将执行软删除以保留历史数据。
            </p>
            <div className="flex justify-end gap-monday-3">
              <Button onClick={cancelDelete} variant="outline">
                取消
              </Button>
              <Button onClick={confirmDelete} variant="primary" className="bg-red-600 hover:bg-red-700">
                确认删除
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Story 20.6: Batch Action Confirmation Dialog */}
      {batchConfirm.show && batchConfirm.action && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-monday-4 z-50" 
          onClick={cancelBatchAction}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              cancelBatchAction();
            } else if (e.key === 'Enter') {
              confirmBatchAction();
            }
          }}
          role="presentation"
          tabIndex={-1}
        >
          <Card 
            variant="elevated" 
            className="max-w-md w-full" 
            onClick={(e) => e.stopPropagation()} 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="batch-confirm-title"
          >
            <h3 id="batch-confirm-title" className="text-monday-xl font-semibold text-monday-text mb-monday-4">
              {getBatchActionLabel(batchConfirm.action)}
            </h3>
            <p className="text-monday-base text-monday-text mb-monday-6">
              确定要{getBatchActionLabel(batchConfirm.action)} <strong>{selectedPersonIds.length}</strong> 个联系人吗？
            </p>
            {batchConfirm.action === 'delete' && (
              <p className="text-monday-sm text-monday-text-secondary mb-monday-6">
                如果联系人有关联的互动记录，将执行软删除以保留历史数据。
              </p>
            )}
            <div className="flex justify-end gap-monday-3">
              <Button onClick={cancelBatchAction} variant="outline">
                取消
              </Button>
              <Button 
                onClick={confirmBatchAction} 
                variant="primary" 
                className={batchConfirm.action === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                确定
              </Button>
            </div>
          </Card>
        </div>
      )}
    </MainLayout>
  );
};
