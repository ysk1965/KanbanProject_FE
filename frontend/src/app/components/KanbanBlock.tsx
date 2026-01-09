import { useDrop } from 'react-dnd';
import { Block, Task, DragItem, Tag, Feature } from '../types';
import { DraggableCard } from './DraggableCard';
import { ChevronLeft, ChevronRight, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

interface KanbanBlockProps {
  block: Block;
  tasks: (Task & { onClick?: () => void })[];
  features?: Feature[];
  availableTags?: Tag[];
  onMoveTask: (taskId: string, targetBlock: string, newOrder: number) => void;
  onReorderTask: (blockId: string, dragIndex: number, hoverIndex: number) => void;
  onEditBlock?: () => void;
  onDeleteBlock?: () => void;
  onMoveBlockLeft?: () => void;
  onMoveBlockRight?: () => void;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
  boardId?: string | null;
}

export function KanbanBlock({
  block,
  tasks,
  features,
  availableTags = [],
  onMoveTask,
  onReorderTask,
  onEditBlock,
  onDeleteBlock,
  onMoveBlockLeft,
  onMoveBlockRight,
  canMoveLeft,
  canMoveRight,
  boardId,
}: KanbanBlockProps) {
  const [{ isOver, canDrop }, drop] = useDrop<DragItem & { index: number; task: Task }, void, { isOver: boolean; canDrop: boolean }>({
    accept: 'task',
    drop: (item, monitor) => {
      // 다른 블록에서 드롭된 경우에만 처리
      if (item.currentBlock !== block.id) {
        // 빈 블록에 드롭하거나 블록의 끝에 드롭
        const newOrder = tasks.length;
        onMoveTask(item.taskId, block.id, newOrder);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  const handleMoveCard = (dragIndex: number, hoverIndex: number, draggedTask: Task) => {
    onReorderTask(block.id, dragIndex, hoverIndex);
  };

  const isFeatureBlock = block.id === 'feature';
  const isFixedBlock = block.type === 'FIXED';

  return (
    <div
      ref={drop}
      className={`flex flex-col bg-[#282e33] rounded-lg min-w-[280px] max-w-[280px] ${
        isOver && canDrop ? 'ring-2 ring-blue-500 bg-[#2c3339]' : ''
      }`}
    >
      {/* 블록 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          {block.color && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: block.color }}
            />
          )}
          <h3 className="font-semibold text-white">{block.name}</h3>
          <span className="text-sm text-gray-400">{tasks.length}</span>
        </div>

        {!isFixedBlock && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#3a4149]">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#282e33] border-gray-700">
              <DropdownMenuItem onClick={onEditBlock} className="text-gray-300 hover:bg-[#3a4149] hover:text-white">
                ✏️ 이름 변경
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEditBlock} className="text-gray-300 hover:bg-[#3a4149] hover:text-white">
                🎨 색상 변경
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              {canMoveLeft && (
                <DropdownMenuItem onClick={onMoveBlockLeft}>
                  ← 왼쪽으로
                </DropdownMenuItem>
              )}
              {canMoveRight && (
                <DropdownMenuItem onClick={onMoveBlockRight}>
                  → 오른쪽으로
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem
                onClick={onDeleteBlock}
                className="text-red-600"
              >
                🗑️ 블록 삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* 카드 리스트 */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-250px)]">
        {tasks.map((task, index) => (
          <DraggableCard
            key={task.id}
            task={task}
            blockId={block.id}
            index={index}
            onClick={task.onClick}
            availableTags={availableTags}
            features={features}
            onMoveCard={handleMoveCard}
            boardId={boardId}
          />
        ))}
        {/* 빈 블록 드롭 영역 */}
        {tasks.length === 0 && isOver && canDrop && (
          <div className="h-20 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50 flex items-center justify-center text-sm text-blue-600">
            여기에 놓기
          </div>
        )}
      </div>

      {/* 추가 버튼 - onAddTask가 정의되지 않았으므로 제거 */}
    </div>
  );
}