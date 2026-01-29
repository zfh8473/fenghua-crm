/**
 * SelectedPersonCard
 *
 * 方案1：下拉选择 + 联系人卡片。选中后在下方显示完整联系人信息卡片（浅蓝底、圆角、头像、姓名、星标、职位·部门、移除按钮）。
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Person } from '../people.service';
import { getPersonName } from '../utils/person-utils';

export interface SelectedPersonCardProps {
  /** 选中的联系人 */
  person: Person;
  /** 点击移除时回调 */
  onRemove: () => void;
  /** 可选 className */
  className?: string;
}

/**
 * 取姓名首字用于头像展示（中文单字或英文首字母）
 */
function getDisplayInitial(person: Person): string {
  const name = getPersonName(person);
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

export const SelectedPersonCard: React.FC<SelectedPersonCardProps> = ({
  person,
  onRemove,
  className = '',
}) => {
  const roleDept = [person.jobTitle, person.department].filter(Boolean).join(' · ') || '—';

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg border
        bg-sky-50 border-sky-200 text-gray-900
        ${className}
      `}
      role="region"
      aria-label={`已选联系人：${getPersonName(person)}`}
    >
      {/* 左侧：圆形头像（首字，绿色底） */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-lg font-semibold"
        aria-hidden
      >
        {getDisplayInitial(person)}
      </div>

      {/* 中间：姓名 + 星标，职位·部门 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-monday-base text-gray-900 truncate">
            {getPersonName(person)}
          </span>
          {person.isImportant && (
            <span className="text-amber-500" title="重要联系人" aria-label="重要联系人">
              ★
            </span>
          )}
        </div>
        <p className="text-monday-sm text-gray-600 truncate mt-0.5">{roleDept}</p>
      </div>

      {/* 右侧：移除按钮 */}
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        aria-label={`移除 ${getPersonName(person)}`}
      >
        <span className="sr-only">移除</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
