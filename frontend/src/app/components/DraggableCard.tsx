import { useRef, useState, useEffect } from 'react';
import { Task, Tag, Feature, ChecklistItem } from '../types';
import { GripVertical, Calendar, ChevronDown, ChevronUp, CheckSquare } from 'lucide-react';
import { Badge } from './ui/badge';
import { checklistAPI } from '../utils/api';
import { useDragContext } from '../contexts/DragContext';

interface DraggableCardProps {
  task: Task;
  blockId: string;
  index: number;
  onClick?: () => void;
  availableTags?: Tag[];
  features?: Feature[];
  boardId?: string | null;
  isChecklistExpanded?: boolean;
  onToggleChecklistExpand?: (taskId: string) => void;
}

export function DraggableCard({
  task,
  blockId,
  index,
  onClick,
  availableTags = [],
  features = [],
  boardId,
  isChecklistExpanded = false,
  onToggleChecklistExpand,
}: DraggableCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { state, startTaskDrag, endTaskDrag } = useDragContext();

  // 현재 이 카드가 드래그 중인지 확인
  const isThisCardDragging = state.draggedTask?.id === task.id;

  // task의 체크리스트 카운트가 변경되면 데이터 다시 로드 (모달에서 변경 시 동기화)
  useEffect(() => {
    if (hasLoaded && isChecklistExpanded && boardId) {
      const localCompleted = checklistItems.filter(item => item.completed).length;
      // 외부에서 변경된 경우 (모달에서 토글한 경우) 데이터 다시 로드
      if (task.checklist_completed !== localCompleted || task.checklist_total !== checklistItems.length) {
        // API toggle이 완료될 시간을 주기 위해 약간의 딜레이 추가
        const timer = setTimeout(() => {
          checklistAPI.getChecklist(boardId, task.id)
            .then((response) => {
              const items: ChecklistItem[] = response.items.map((item) => ({
                id: item.id,
                title: item.title,
                completed: item.completed,
                position: item.position,
                due_date: item.due_date,
                assignee: item.assignee ? { id: item.assignee.id, name: item.assignee.name } : null,
              }));
              setChecklistItems(items);
            })
            .catch((error) => {
              console.error('Failed to reload checklist:', error);
            });
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [task.checklist_completed, task.checklist_total]);

  // 드래그 시작 핸들러
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/task', task.id);
    e.dataTransfer.setData('text/plain', task.id);

    // 드래그 이미지 설정 (카드 전체)
    if (ref.current) {
      e.dataTransfer.setDragImage(ref.current, 20, 20);
    }

    setIsDragging(true);
    startTaskDrag(task, blockId);
  };

  // 드래그 종료 핸들러
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(false);
    endTaskDrag();
  };

  const taskTags = task.tags || [];

  // 연결된 Feature 찾기 (task has feature_id now)
  const linkedFeature = features.find((f) => f.id === task.feature_id);

  // Feature 색상 (기본값: 보라색)
  const featureColor = linkedFeature?.color || '#8B5CF6';

  // 마감일 포맷팅
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}. ${month}. ${day}.`;
  };

  // 마감일이 임박했는지 확인
  const isOverdue = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const isDueSoon = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);
    return dueDate >= today && dueDate <= threeDaysLater;
  };

  // 체크리스트 로드
  const loadChecklist = async () => {
    if (!boardId || hasLoaded) return;

    setIsLoading(true);
    try {
      const response = await checklistAPI.getChecklist(boardId, task.id);
      const items: ChecklistItem[] = response.items.map((item) => ({
        id: item.id,
        title: item.title,
        completed: item.completed,
        position: item.position,
        due_date: item.due_date,
        assignee: item.assignee ? { id: item.assignee.id, name: item.assignee.name } : null,
      }));
      setChecklistItems(items);
      setHasLoaded(true);
    } catch (error) {
      console.error('Failed to load checklist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 펼침 상태가 변경되면 체크리스트 로드
  useEffect(() => {
    if (isChecklistExpanded && !hasLoaded && boardId) {
      loadChecklist();
    }
  }, [isChecklistExpanded, hasLoaded, boardId]);

  // 확장 버튼 클릭 핸들러
  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleChecklistExpand?.(task.id);
  };

  // 체크리스트 토글
  const handleToggleItem = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!boardId) return;

    setChecklistItems(
      checklistItems.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );

    try {
      await checklistAPI.toggleItem(boardId, task.id, itemId);
    } catch (error) {
      console.error('Failed to toggle checklist item:', error);
      // 롤백
      setChecklistItems(
        checklistItems.map((item) =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        )
      );
    }
  };

  const completedCount = checklistItems.filter((item) => item.completed).length;
  const hasChecklist = (task.checklist_total ?? 0) > 0;

  // 드래그 중인 다른 카드가 있으면 이 카드는 pointer-events: none (이벤트가 블록으로 직접 전달됨)
  const shouldDisablePointerEvents = state.draggedTask && state.draggedTask.id !== task.id;

  return (
    <div
      ref={ref}
      data-task-id={task.id}
      data-task-index={index}
      className={`relative bg-white rounded-lg p-3 border shadow-sm transition-all duration-200 ${
        isDragging || isThisCardDragging
          ? 'opacity-20 border-2 border-dashed border-blue-400 bg-blue-50 shadow-none'
          : 'cursor-pointer hover:shadow-md'
      } ${task.completed ? 'border-green-300 bg-green-50' : 'border-gray-200'} ${
        shouldDisablePointerEvents ? 'pointer-events-none' : ''
      }`}
      onClick={isDragging ? undefined : onClick}
      onDragEnter={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        e.preventDefault();
      }}
    >
      <div className="flex items-start gap-2">
        <div
          ref={dragHandleRef}
          draggable={!state.draggedTask || state.draggedTask.id === task.id}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className={`p-0.5 -ml-1 rounded transition-colors group ${
            isDragging ? '' : 'hover:bg-gray-100 cursor-grab active:cursor-grabbing'
          } ${state.draggedTask && state.draggedTask.id !== task.id ? 'pointer-events-none' : ''}`}
          title="드래그하여 이동"
        >
          <GripVertical className={`h-4 w-4 mt-0.5 flex-shrink-0 transition-colors ${
            isDragging ? 'text-blue-400' : 'text-gray-300 group-hover:text-gray-500'
          }`} />
        </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 break-words">
          {task.title}
        </p>

        {/* 연결된 Feature 표시 */}
        {linkedFeature && (
          <div className="mt-2">
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border"
              style={{
                backgroundColor: `${featureColor}15`,
                borderColor: featureColor,
                color: featureColor
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: featureColor }}
              />
              <span>{linkedFeature.title}</span>
            </div>
          </div>
        )}

        {/* 태그 표시 */}
        {taskTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {taskTags.map((tag) => (
              <Badge
                key={tag.id}
                style={{ backgroundColor: tag.color }}
                className="text-white text-xs px-2 py-0"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* 마감일 표시 */}
        {task.due_date && (
          <div className="mt-2 flex items-center gap-1">
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${isOverdue(task.due_date)
                  ? 'bg-red-100 text-red-700'
                  : isDueSoon(task.due_date)
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Calendar className="h-3 w-3" />
              <span>{formatDueDate(task.due_date)}</span>
            </div>
          </div>
        )}

        {/* 체크리스트 펼침 */}
        {hasChecklist && boardId && (
          <div className="mt-2 border-t pt-2">
            <div
              className="flex items-center gap-2 cursor-pointer hover:text-gray-700"
              onClick={handleExpandClick}
            >
              <CheckSquare className="h-3 w-3 text-gray-500" />
              <span className="text-xs text-gray-500">
                체크리스트 {hasLoaded ? `${completedCount}/${checklistItems.length}` : `${task.checklist_completed ?? 0}/${task.checklist_total ?? 0}`}
              </span>
              {isChecklistExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            {isChecklistExpanded && (
              <div className="mt-2 space-y-1">
                {isLoading ? (
                  <div className="text-xs text-gray-400">로딩 중...</div>
                ) : (
                  checklistItems
                    .sort((a, b) => a.position - b.position)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-2 p-1.5 rounded bg-gray-50 hover:bg-gray-100"
                        onClick={(e) => handleToggleItem(e, item.id)}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                            item.completed
                              ? 'bg-green-500 border-green-500'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {item.completed && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                        <span
                          className={`text-xs flex-1 ${
                            item.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                          }`}
                        >
                          {item.title}
                        </span>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        )}

        {/* 담당자 */}
        {task.assignee && (
          <div className="mt-2 flex items-center gap-1 flex-wrap">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
              {task.assignee.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-gray-600">{task.assignee.name}</span>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
