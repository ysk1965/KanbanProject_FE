import { useDrag } from 'react-dnd';
import { Task, DragItem, Tag } from '../types';
import { GripVertical, User } from 'lucide-react';
import { Badge } from './ui/badge';

interface KanbanCardProps {
  task: Task;
  blockId: string;
  onClick?: () => void;
  availableTags?: Tag[];
}

export function KanbanCard({ task, blockId, onClick, availableTags = [] }: KanbanCardProps) {
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: 'task',
    item: { type: 'task', taskId: task.id, currentBlock: blockId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const taskTags = availableTags.filter((tag) => task.tags?.includes(tag.id));

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
                {task.assignee.charAt(0).toUpperCase()}
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
        </div>
      </div>
    </div>
  );
}