import { useState, useEffect, useMemo } from 'react';
import { X, Search, Loader2, CheckSquare, FolderOpen } from 'lucide-react';
import { Clock } from 'lucide-react';
import { boardChecklistAPI, BoardChecklistItemResponse } from '../utils/api';

interface ChecklistSelectModalProps {
  boardId: string;
  assigneeId: string;
  startTime: string;
  endTime: string;
  onSelect: (checklistItemId: string) => void;
  onClose: () => void;
}

export function ChecklistSelectModal({
  boardId,
  assigneeId,
  startTime,
  endTime,
  onSelect,
  onClose,
}: ChecklistSelectModalProps) {
  const [items, setItems] = useState<BoardChecklistItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 체크리스트 아이템 로드 (스케줄되지 않은 것만)
  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      try {
        const response = await boardChecklistAPI.getItems(boardId, {
          is_scheduled: false,
        });
        setItems(response.items);
      } catch (error) {
        console.error('Failed to load checklist items:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadItems();
  }, [boardId]);

  // 검색 필터링
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.task?.title.toLowerCase().includes(query) ||
        item.feature?.title.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Feature별로 그룹화
  const groupedItems = useMemo(() => {
    const groups = new Map<string, { feature: { id: string; title: string; color: string } | null; items: BoardChecklistItemResponse[] }>();

    filteredItems.forEach((item) => {
      const featureKey = item.feature?.id || 'no-feature';
      if (!groups.has(featureKey)) {
        groups.set(featureKey, { feature: item.feature, items: [] });
      }
      groups.get(featureKey)!.items.push(item);
    });

    return Array.from(groups.values());
  }, [filteredItems]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[500px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Connect Existing Item</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Time Display */}
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="bg-indigo-50 rounded-lg px-4 py-2 flex items-center gap-3">
            <Clock className="h-4 w-4 text-indigo-600" />
            <span className="text-indigo-700 font-medium text-sm">
              {startTime} - {endTime}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search checklist items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No matching items found' : 'No unscheduled checklist items'}
            </div>
          ) : (
            <div className="space-y-4">
              {groupedItems.map((group) => (
                <div key={group.feature?.id || 'no-feature'}>
                  {/* Feature Header */}
                  <div className="flex items-center gap-2 mb-2">
                    {group.feature ? (
                      <>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: group.feature.color }}
                        />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {group.feature.title}
                        </span>
                      </>
                    ) : (
                      <>
                        <FolderOpen className="h-3 w-3 text-gray-400" />
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                          No Feature
                        </span>
                      </>
                    )}
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onSelect(item.id)}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <CheckSquare className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {item.title}
                            </div>
                            {item.task && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                Task: {item.task.title}
                              </div>
                            )}
                            {(item.start_date || item.due_date) && (
                              <div className="text-xs text-gray-400 mt-1">
                                {item.start_date && `Start: ${item.start_date}`}
                                {item.start_date && item.due_date && ' · '}
                                {item.due_date && `Due: ${item.due_date}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Select a checklist item to schedule in this time slot
          </p>
        </div>
      </div>
    </div>
  );
}
