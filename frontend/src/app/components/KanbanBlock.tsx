import { useRef, useCallback } from 'react';
import { Block, Task, Tag, Feature } from '../types';
import { DraggableCard } from './DraggableCard';
import { GripVertical, MoreVertical } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { useDragContext } from '../contexts/DragContext';

interface KanbanBlockProps {
  block: Block;
  tasks: (Task & { onClick?: () => void })[];
  features?: Feature[];
  availableTags?: Tag[];
  onMoveTask: (taskId: string, targetBlock: string, newOrder: number) => void;
  onReorderTask: (taskId: string, blockId: string, newPosition: number) => void;
  onEditBlock?: () => void;
  onDeleteBlock?: () => void;
  onMoveBlockLeft?: () => void;
  onMoveBlockRight?: () => void;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
  boardId?: string | null;
  expandedChecklistTaskIds?: Set<string>;
  onToggleChecklistExpand?: (taskId: string) => void;
  // Block drag and drop
  blockIndex?: number;
  onMoveBlockDrag?: (dragIndex: number, hoverIndex: number) => void;
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
  boardId,
  expandedChecklistTaskIds,
  onToggleChecklistExpand,
  blockIndex = 0,
  onMoveBlockDrag,
}: KanbanBlockProps) {
  const blockRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const taskContainerRef = useRef<HTMLDivElement>(null);

  const {
    state,
    startBlockDrag,
    updateBlockPlaceholder,
    clearBlockPlaceholder,
    endBlockDrag,
    updateTaskPlaceholder,
    clearTaskPlaceholder,
    endTaskDrag,
  } = useDragContext();

  const isCustomBlock = block.type === 'CUSTOM';
  const isFixedBlock = block.type === 'FIXED';

  // 현재 이 블록이 드래그 중인지 확인
  const isThisBlockDragging = state.draggedBlock?.id === block.id;

  // 플레이스홀더가 이 블록에 표시되어야 하는지 확인
  const taskPlaceholderInThisBlock = state.taskPlaceholder?.blockId === block.id;
  const placeholderIndex = state.taskPlaceholder?.index ?? -1;

  // 블록 드래그 시작
  const handleBlockDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isCustomBlock) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/block', block.id);

    if (blockRef.current) {
      e.dataTransfer.setDragImage(blockRef.current, 140, 20);
    }

    startBlockDrag(block);
  };

  // 블록 드래그 종료
  const handleBlockDragEnd = () => {
    endBlockDrag();
  };

  // Task 드래그 오버 핸들러 - Y좌표로 플레이스홀더 위치 계산
  const handleTaskDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // Task 드래그인지 확인
    if (!e.dataTransfer.types.includes('application/task')) {
      return;
    }

    const draggedTask = state.draggedTask;
    if (!draggedTask) return;

    const container = taskContainerRef.current;
    if (!container) return;

    // 모든 카드의 위치 정보 수집 (드래그 중인 것 포함)
    const children = container.querySelectorAll('[data-task-id]');
    let insertIndex = tasks.length; // 기본값: 맨 끝

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const taskId = child.getAttribute('data-task-id');
      const rect = child.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      // 커서가 카드의 중간보다 위에 있으면 그 위치에 삽입
      if (e.clientY < midY) {
        // 드래그 중인 카드면 건너뛰고 그 다음 인덱스 사용
        if (taskId === draggedTask.id) {
          continue;
        }
        insertIndex = i;
        break;
      }
    }

    updateTaskPlaceholder(block.id, insertIndex);
  }, [state.draggedTask, block.id, tasks.length, updateTaskPlaceholder]);

  // Task 드래그 리브 핸들러 - placeholder는 drop/dragend에서만 정리
  const handleTaskDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // dragleave에서는 placeholder를 정리하지 않음
    // 다른 블록으로 이동하면 그 블록의 dragover에서 새 placeholder가 설정됨
  }, []);

  // Task 드롭 핸들러
  const handleTaskDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const taskId = e.dataTransfer.getData('application/task');
    if (!taskId) return;

    // 플레이스홀더가 있으면 그 위치로 이동
    const placeholder = state.taskPlaceholder;
    if (!placeholder || placeholder.blockId !== block.id) {
      // 플레이스홀더가 없거나 다른 블록의 플레이스홀더면, 맨 끝에 추가
      onMoveTask(taskId, block.id, tasks.length);
      clearTaskPlaceholder();
      endTaskDrag();
      return;
    }

    const insertIndex = placeholder.index;

    // 같은 블록 내 이동인지 확인
    const draggedOriginalIndex = tasks.findIndex(t => t.id === taskId);
    const isSameBlock = draggedOriginalIndex !== -1;

    if (!isSameBlock) {
      // 다른 블록에서 이동
      onMoveTask(taskId, block.id, insertIndex);
    } else {
      // 같은 블록 내에서 이동
      // 같은 위치면 이동 불필요
      if (draggedOriginalIndex === insertIndex) {
        clearTaskPlaceholder();
        endTaskDrag();
        return;
      }

      // 아래로 이동하는 경우 position 조정
      let newPosition = insertIndex;
      if (insertIndex > draggedOriginalIndex) {
        newPosition = insertIndex - 1;
      }

      onReorderTask(taskId, block.id, newPosition);
    }

    clearTaskPlaceholder();
    endTaskDrag();
  }, [state.taskPlaceholder, block.id, tasks, onMoveTask, onReorderTask, clearTaskPlaceholder, endTaskDrag]);

  // 블록 드래그 오버 핸들러 (블록 순서 변경용)
  const handleBlockDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes('application/block')) {
      return;
    }

    if (!isCustomBlock) return;

    const draggedBlock = state.draggedBlock;
    if (!draggedBlock || draggedBlock.id === block.id) return;

    // X좌표로 삽입 위치 결정
    const rect = blockRef.current?.getBoundingClientRect();
    if (!rect) return;

    const midX = rect.left + rect.width / 2;
    const newIndex = e.clientX < midX ? blockIndex : blockIndex + 1;

    updateBlockPlaceholder(newIndex);
  }, [state.draggedBlock, block.id, blockIndex, isCustomBlock, updateBlockPlaceholder]);

  // 블록 드롭 핸들러
  const handleBlockDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes('application/block')) {
      return;
    }

    e.preventDefault();

    const draggedBlock = state.draggedBlock;
    if (!draggedBlock || draggedBlock.id === block.id) return;

    // 드래그된 블록의 원래 인덱스와 현재 인덱스를 사용해 이동
    const originalIndex = state.draggedBlock ? blockIndex : -1;
    const targetIndex = state.blockPlaceholderIndex ?? blockIndex;

    if (onMoveBlockDrag && originalIndex !== targetIndex) {
      // 현재는 hover에서 처리하므로 여기서는 정리만
    }

    clearBlockPlaceholder();
    endBlockDrag();
  }, [state.draggedBlock, state.blockPlaceholderIndex, block.id, blockIndex, onMoveBlockDrag, clearBlockPlaceholder, endBlockDrag]);

  // 플레이스홀더 JSX
  const placeholderElement = (
    <div
      className="h-16 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50/50 flex items-center justify-center"
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
        e.stopPropagation();
        handleTaskDrop(e);
      }}
    >
      <span className="text-blue-400 text-sm pointer-events-none">여기에 놓기</span>
    </div>
  );

  return (
    <div
      ref={blockRef}
      onDragEnter={(e) => {
        // dragenter에서도 preventDefault 필요
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDragOver={(e) => {
        // 항상 preventDefault를 먼저 호출해야 drop 이벤트가 발생함
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        handleTaskDragOver(e);
        handleBlockDragOver(e);
      }}
      onDragLeave={handleTaskDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleTaskDrop(e);
        handleBlockDrop(e);
      }}
      className={`relative flex flex-col bg-[#282e33] rounded-lg min-w-[280px] max-w-[280px] transition-all duration-200 ${
        taskPlaceholderInThisBlock ? 'ring-2 ring-blue-500 bg-[#2c3339]' : ''
      } ${isThisBlockDragging ? 'opacity-40 scale-95 rotate-1' : ''} ${
        state.blockPlaceholderIndex === blockIndex && state.draggedBlock ? 'ring-2 ring-purple-500' : ''
      }`}
    >
      {/* 드롭 인디케이터 (왼쪽) */}
      {state.blockPlaceholderIndex === blockIndex && state.draggedBlock && (
        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-purple-500 rounded-full animate-pulse" />
      )}

      {/* 블록 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 group">
        {/* 드래그 핸들 - 커스텀 블록만 표시 */}
        {isCustomBlock && (
          <div
            ref={dragHandleRef}
            draggable
            onDragStart={handleBlockDragStart}
            onDragEnd={handleBlockDragEnd}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 mr-1 rounded hover:bg-[#3a4149] opacity-60 group-hover:opacity-100 transition-opacity"
            title="드래그하여 블록 이동"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        )}
        <div className="flex items-center gap-2 flex-1">
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
                이름 변경
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEditBlock} className="text-gray-300 hover:bg-[#3a4149] hover:text-white">
                색상 변경
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem
                onClick={onDeleteBlock}
                className="text-red-400 hover:bg-[#3a4149] hover:text-red-300"
              >
                블록 삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* 카드 리스트 */}
      <div
        ref={taskContainerRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-250px)]"
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'move';
          handleTaskDragOver(e);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleTaskDrop(e);
        }}
      >
        {tasks.map((task, index) => (
          <div
            key={task.id}
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
              e.stopPropagation();
              handleTaskDrop(e);
            }}
          >
            {/* 플레이스홀더 - 해당 인덱스 전에 표시 */}
            {taskPlaceholderInThisBlock && placeholderIndex === index && state.draggedTask?.id !== task.id && (
              <div className="mb-2">
                {placeholderElement}
              </div>
            )}
            <DraggableCard
              task={task}
              blockId={block.id}
              index={index}
              onClick={task.onClick}
              availableTags={availableTags}
              features={features}
              boardId={boardId}
              isChecklistExpanded={expandedChecklistTaskIds?.has(task.id)}
              onToggleChecklistExpand={onToggleChecklistExpand}
            />
          </div>
        ))}
        {/* 맨 끝에 플레이스홀더 */}
        {taskPlaceholderInThisBlock && placeholderIndex >= tasks.length && (
          placeholderElement
        )}
        {/* 빈 블록에 플레이스홀더 */}
        {tasks.length === 0 && taskPlaceholderInThisBlock && (
          placeholderElement
        )}
      </div>
    </div>
  );
}
