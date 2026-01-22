/**
 * Person List Component
 * 
 * Displays a table of people (contacts) with actions
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Person } from '../people.service';
import { Table, Column } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { HomeModuleIcon } from '../../components/icons/HomeModuleIcons';
import { useNavigate } from 'react-router-dom';
import { ContactMethodIcon } from './ContactMethodIcon';

interface PersonListProps {
  people: Person[];
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
  onSelect: (person: Person) => void;
  loading?: boolean;
  searchQuery?: string;
}

const highlightText = (text: string, query?: string): React.ReactNode => {
  if (!query || !text) return text;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, index) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      return (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-monday-0.5 rounded">
          {part}
        </mark>
      );
    }
    return part;
  });
};

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
 * Story 20.4: ContactMethodIcon extracted to shared component
 * See: fenghua-frontend/src/people/components/ContactMethodIcon.tsx
 */

export const PersonList: React.FC<PersonListProps> = ({
  people,
  onEdit,
  onDelete,
  onSelect,
  loading = false,
  searchQuery
}) => {
  const navigate = useNavigate();

  const getPersonName = (person: Person): string => {
    const firstName = person.firstName?.trim() || '';
    const lastName = person.lastName?.trim() || '';
    return `${firstName} ${lastName}`.trim() || '未命名联系人';
  };

  /** 19.3 main-business：加载用 skeleton，禁止空白/纯文字 */
  if (loading) {
    const colCount = 6;
    return (
      <div className="w-full rounded-monday-lg overflow-hidden bg-monday-surface border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-monday-bg border-b border-gray-200">
                {Array.from({ length: colCount }).map((_, i) => (
                  <th key={i} className="p-monday-2 p-monday-4 text-left">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map((r) => (
                <tr key={r} className="border-b border-gray-200">
                  {Array.from({ length: colCount }).map((_, c) => (
                    <td key={c} className="p-monday-2 p-monday-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-full max-w-[140px]" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /** 19.3 main-business：无 emoji，用 SVG 或纯文字 */
  if (people.length === 0) {
    if (searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center py-monday-12 px-monday-4">
          <div className="text-center max-w-md">
            <h3 className="text-monday-lg font-semibold text-uipro-text mb-monday-2">
              未找到匹配的联系人
            </h3>
            <p className="text-monday-sm text-uipro-secondary mb-monday-4">
              没有找到与 &quot;<span className="font-semibold text-uipro-text">{searchQuery}</span>&quot; 匹配的联系人
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="rounded-monday-lg overflow-hidden bg-monday-surface border border-gray-200">
          <div className="text-center p-monday-12">
            <h3 className="text-monday-lg font-semibold text-uipro-text mb-monday-2">暂无联系人</h3>
            <p className="text-monday-sm text-uipro-secondary">
              点击「新建联系人」按钮添加第一个联系人
            </p>
          </div>
        </div>
      </div>
    );
  }

  const columns: Column<Person>[] = [
    {
      key: 'name',
      header: '姓名',
      width: '25%',
      render: (value, person) => (
        <div className="flex items-center gap-monday-2">
          {person.isImportant && (
            <StarIcon filled={true} className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          )}
          <div className="font-semibold text-gray-900">
            {highlightText(getPersonName(person), searchQuery)}
          </div>
        </div>
      ),
    },
    {
      key: 'jobTitle',
      header: '职位/部门',
      width: '20%',
      render: (value, person) => (
        <div className="text-gray-900 text-monday-sm">
          <div>{highlightText(person.jobTitle || '-', searchQuery)}</div>
          {person.department && (
            <div className="text-monday-xs text-gray-600 mt-monday-1">
              {highlightText(person.department, searchQuery)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'company',
      header: '所属客户',
      width: '20%',
      render: (value, person) => (
        <div>
          {person.company ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/customers?customerId=${person.companyId}`);
              }}
              className="text-uipro-cta hover:underline cursor-pointer transition-colors duration-200 text-monday-sm font-medium"
            >
              {person.company.name}
            </button>
          ) : (
            <span className="text-gray-900 text-monday-sm">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'contactMethods',
      header: '联系方式',
      minWidth: '10rem',
      render: (value, person) => (
        <div className="flex items-center gap-monday-2 flex-wrap">
          <ContactMethodIcon 
            type="phone" 
            hasValue={!!person.phone}
            onClick={() => person.phone && window.open(`tel:${person.phone}`, '_blank')}
          />
          <ContactMethodIcon 
            type="mobile" 
            hasValue={!!person.mobile}
            onClick={() => person.mobile && window.open(`tel:${person.mobile}`, '_blank')}
          />
          <ContactMethodIcon 
            type="email" 
            hasValue={!!person.email}
            onClick={() => person.email && window.open(`mailto:${person.email}`, '_blank')}
          />
          <ContactMethodIcon 
            type="wechat" 
            hasValue={!!person.wechat}
          />
          <ContactMethodIcon 
            type="whatsapp" 
            hasValue={!!person.whatsapp}
          />
          <ContactMethodIcon 
            type="linkedin" 
            hasValue={!!person.linkedinUrl}
            onClick={() => person.linkedinUrl && window.open(person.linkedinUrl, '_blank')}
          />
          <ContactMethodIcon 
            type="facebook" 
            hasValue={!!person.facebook}
            onClick={() => person.facebook && window.open(person.facebook, '_blank')}
          />
        </div>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      /* 19.7 AC2：与 UserList、ProductList 统一 outline、uipro-cta/semantic-error、pencilSquare/trash；编辑在左、删除在右 */
      render: (value, person) => (
        <div className="flex gap-monday-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(person);
            }}
            title="编辑"
            leftIcon={<HomeModuleIcon name="pencilSquare" className="w-4 h-4 flex-shrink-0" />}
            className="text-uipro-cta hover:bg-uipro-cta/10 cursor-pointer transition-colors duration-200"
          >
            编辑
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(person);
            }}
            title="删除"
            leftIcon={<HomeModuleIcon name="trash" className="w-4 h-4 flex-shrink-0" />}
            className="text-semantic-error hover:bg-semantic-error/10 cursor-pointer transition-colors duration-200"
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Table
      data={people}
      columns={columns}
      onRowClick={onSelect}
      rowKey={(row) => row.id}
      striped
    />
  );
};
