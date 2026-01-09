import { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Task, DragItem, Tag, Feature, ChecklistItem } from '../types';
import { GripVertical, Calendar, ChevronDown, ChevronUp, CheckSquare } from 'lucide-react';
import { Badge } from './ui/badge';
import { checklistAPI } from '../utils/api';

interface DraggableCardProps {
  task: Task;
  blockId: string;
  index: number;
  onClick?: () => void;
  availableTags?: Tag[];
  features?: Feature[];
  onMoveCard: (dragIndex: number, hoverIndex: number, draggedTask: Task) => void;
  boardId?: string | null;
}

export function DraggableCard({
  task,
  blockId,
  index,
  onClick,
  availableTags = [],
  features = [],
  onMoveCard,
  boardId,
}: DraggableCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [{ isDragging }, drag] = useDrag({
    type: 'task',
    item: () => ({ type: 'task', taskId: task.id, currentBlock: blockId, index, task }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'task',
    hover(item: DragItem & { index: number; task: Task }, monitor) {
      if (!ref.current) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;
      const draggedTask = item.task;

      // 같은 블록 내에서만 순서 변경
      if (item.currentBlock !== blockId) {
        return;
      }

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      onMoveCard(dragIndex, hoverIndex, draggedTask);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  drag(drop(ref));

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
        is_completed: item.is_completed,
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

  // 확장 버튼 클릭 핸들러
  const handleExpandClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded && !hasLoaded) {
      await loadChecklist();
    }
    setIsExpanded(!isExpanded);
  };

  // 체크리스트 토글
  const handleToggleItem = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!boardId) return;

    setChecklistItems(
      checklistItems.map((item) =>
        item.id === itemId ? { ...item, is_completed: !item.is_completed } : item
      )
    );

    try {
      await checklistAPI.toggleItem(boardId, task.id, itemId);
    } catch (error) {
      console.error('Failed to toggle checklist item:', error);
      // 롤백
      setChecklistItems(
        checklistItems.map((item) =>
          item.id === itemId ? { ...item, is_completed: !item.is_completed } : item
        )
      );
    }
  };

  const completedCount = checklistItems.filter((item) => item.is_completed).length;
  const hasChecklist = (task.checklist_total ?? 0) > 0;

  return (
    <div
      ref={ref}
      className={`bg-white rounded-lg p-3 border shadow-sm cursor-pointer hover:shadow-md transition-all ${
        isDragging ? 'opacity-30' : ''
      } ${task.is_completed ? 'border-green-300 bg-green-50' : 'border-gray-200'} ${
        isOver && canDrop ? 'border-t-4 border-t-blue-500' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing" />
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
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
              {isExpanded && (
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
                              item.is_completed
                                ? 'bg-green-500 border-green-500'
                                : 'bg-white border-gray-300'
                            }`}
                          >
                            {item.is_completed && (
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
                              item.is_completed ? 'text-gray-400 line-through' : 'text-gray-700'
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