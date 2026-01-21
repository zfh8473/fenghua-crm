/**
 * Empty Search Results Component
 * 
 * Displays empty state when no search results found
 * All custom code is proprietary and not open source.
 */

interface EmptySearchResultsProps {
  searchQuery?: string;
  onClearSearch?: () => void;
}

export const EmptySearchResults: React.FC<EmptySearchResultsProps> = ({
  searchQuery,
  onClearSearch,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-monday-16 px-monday-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="text-monday-6xl mb-monday-6 opacity-50">
          🔍
        </div>

        {/* Message */}
        <h3 className="text-monday-xl font-semibold text-monday-text mb-monday-2">
          未找到匹配的产品
        </h3>

        <p className="text-monday-base text-monday-text-secondary mb-monday-4">
          {searchQuery ? (
            <>
              没有找到与 "<span className="font-semibold text-monday-text">{searchQuery}</span>" 匹配的产品
            </>
          ) : (
            '请尝试使用不同的搜索关键词'
          )}
        </p>

        {/* Suggestions */}
        <div className="bg-monday-bg rounded-monday-md p-monday-4 mb-monday-6">
          <p className="text-monday-sm font-semibold text-monday-text mb-monday-2">
            💡 搜索建议：
          </p>
          <ul className="text-monday-sm text-monday-text-secondary space-y-monday-1 text-left list-disc list-inside">
            <li>检查拼写是否正确</li>
            <li>尝试使用更通用的关键词</li>
            <li>使用产品名称或HS编码搜索</li>
            <li>尝试选择不同的产品类别</li>
          </ul>
        </div>

        {/* Clear Button */}
        {onClearSearch && searchQuery && (
          <button
            onClick={onClearSearch}
            className="px-monday-4 py-monday-2 text-monday-sm font-medium text-primary-blue hover:text-primary-blue-hover hover:bg-primary-blue/10 rounded-monday-md transition-colors"
          >
            清除搜索条件
          </button>
        )}
      </div>
    </div>
  );
};




