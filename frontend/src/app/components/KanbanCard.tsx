import { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Task, DragItem, Tag, ChecklistItem } from '../types';
import { GripVertical, ChevronDown, ChevronUp, CheckSquare } from 'lucide-react';
import { Badge } from './ui/badge';
import { checklistAPI } from '../utils/api';

interface KanbanCardProps {
  task: Task;
  blockId: string;
  onClick?: () => void;
  availableTags?: Tag[];
  boardId?: string | null;
}

export function KanbanCard({ task, blockId, onClick, availableTags = [], boardId }: KanbanCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: 'task',
    item: { type: 'task', taskId: task.id, currentBlock: blockId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const taskTags = availableTags.filter((tag) => task.tags?.includes(tag.id));

  // 체크리스트 로드
  const loadChecklist = async () => {
    if (!boardId) return;

    setIsLoading(true);
    try {
      const response = await checklistAPI.getChecklist(boardId, task.id);
      const items: ChecklistItem[] = response.items.map((item) => ({
        id: item.id,
        title: item.title,
        completed: item.completed,
        position: item.position,
        due_date: item.due_date,
        assignee: item.assignee ? { id: item.assignee.id, name: item.assignee.name, profile_image: item.assignee.profile_image } : null,
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

  return (
    <div
      ref={drag}
      className={`bg-white rounded-lg p-3 border shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      } ${task.isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 break-words">
            {task.title}
          </p>
          
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

          {/* 담당자 및 참여자 */}
          <div className="mt-2 flex items-center gap-1 flex-wrap">
            {task.assignee && (
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
                {typeof task.assignee === 'string'
                  ? task.assignee.charAt(0).toUpperCase()
                  : task.assignee.name.charAt(0).toUpperCase()}
              </div>
            )}
            {task.participants && task.participants.length > 0 && (
              <div className="flex items-center gap-1">
                {task.participants.slice(0, 3).map((participant, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-6 rounded-full bg-purple-400 flex items-center justify-center text-xs text-white border-2 border-white"
                    title={participant}
                  >
                    {participant.charAt(0).toUpperCase()}
                  </div>
                ))}
                {task.participants.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-700">
                    +{task.participants.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 체크리스트 펼침 */}
          {hasChecklist && boardId && (
            <div className="mt-3 border-t pt-2">
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
                          className="flex items-center gap-2 p-1.5 rounded bg-gray-50 hover:bg-gray-100"
                          onClick={(e) => handleToggleItem(e, item.id)}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${
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
                          {item.assignee && (
                            <div
                              className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white flex-shrink-0"
                              title={item.assignee.name}
                            >
                              {item.assignee.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}