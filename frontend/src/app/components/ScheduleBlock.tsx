import { useMemo, useState, useCallback } from 'react';
import { ScheduleBlockInfo } from '../utils/api';

interface ScheduleBlockProps {
  block: ScheduleBlockInfo;
  slotHeight: number;
  workStartHour: number;
  workEndHour: number;
  onClick?: (block: ScheduleBlockInfo) => void;
  onResize?: (blockId: string, startTime: string, endTime: string) => void;
}

// 시간 문자열을 분 단위로 변환
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// 분을 시간 문자열로 변환 (HH:mm)
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export function ScheduleBlock({ block, slotHeight, workStartHour, workEndHour, onClick, onResize }: ScheduleBlockProps) {
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const [resizeOffset, setResizeOffset] = useState(0);

  const { top, height, displayInfo, startMinutes, endMinutes, workStartMinutes, workEndMinutes } = useMemo(() => {
    const startMinutes = timeToMinutes(block.start_time);
    const endMinutes = timeToMinutes(block.end_time);
    const workStartMinutes = workStartHour * 60;
    const workEndMinutes = workEndHour * 60;

    const minutesFromStart = startMinutes - workStartMinutes;
    const durationMinutes = endMinutes - startMinutes;

    // 30분 = 1슬롯 = slotHeight px
    const top = (minutesFromStart / 30) * slotHeight;
    const height = (durationMinutes / 30) * slotHeight;

    // 블록 표시 정보
    const title = block.checklist_item?.title || '(미연결)';
    const taskTitle = block.task?.title;
    const featureTitle = block.feature?.title;
    const featureColor = block.feature?.color || '#6366f1';
    const isCompleted = block.checklist_item?.completed || false;

    return {
      top,
      height,
      displayInfo: { title, taskTitle, featureTitle, featureColor, isCompleted },
      startMinutes,
      endMinutes,
      workStartMinutes,
      workEndMinutes,
    };
  }, [block, slotHeight, workStartHour, workEndHour]);

  // 리사이즈 중 계산된 값
  const displayTop = isResizing === 'top' ? top + resizeOffset : top;
  const displayHeight = isResizing === 'top'
    ? height - resizeOffset
    : isResizing === 'bottom'
      ? height + resizeOffset
      : height;

  // 상태별 배경색
  const getBackgroundColor = () => {
    if (displayInfo.isCompleted) {
      return 'bg-green-500/20 border-green-500';
    }
    if (block.checklist_item?.due_date) {
      const dueDate = new Date(block.checklist_item.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        return 'bg-red-500/20 border-red-500';
      }

      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(today.getDate() + 3);
      if (dueDate <= threeDaysLater) {
        return 'bg-yellow-500/20 border-yellow-500';
      }
    }
    return 'bg-blue-500/20 border-blue-500';
  };

  // 리사이즈 시작 핸들러
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: 'top' | 'bottom') => {
    e.stopPropagation();
    e.preventDefault();

    setIsResizing(handle);
    setResizeOffset(0);

    const startY = e.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      // 30분 단위로 스냅 (slotHeight px = 30분)
      const snappedDelta = Math.round(deltaY / slotHeight) * slotHeight;
      setResizeOffset(snappedDelta);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // 최종 시간 계산
      setResizeOffset((currentOffset) => {
        if (currentOffset !== 0 && onResize) {
          const deltaMinutes = Math.round(currentOffset / slotHeight) * 30;

          let newStartMinutes = startMinutes;
          let newEndMinutes = endMinutes;

          if (handle === 'top') {
            newStartMinutes = startMinutes + deltaMinutes;
            // 최소 30분 유지, 근무 시작 시간 이후
            newStartMinutes = Math.max(workStartMinutes, newStartMinutes);
            newStartMinutes = Math.min(newEndMinutes - 30, newStartMinutes);
          } else {
            newEndMinutes = endMinutes + deltaMinutes;
            // 최소 30분 유지, 근무 종료 시간 이전
            newEndMinutes = Math.min(workEndMinutes, newEndMinutes);
            newEndMinutes = Math.max(newStartMinutes + 30, newEndMinutes);
          }

          const newStartTime = minutesToTime(newStartMinutes);
          const newEndTime = minutesToTime(newEndMinutes);

          onResize(block.id, newStartTime, newEndTime);
        }
        return 0;
      });
      setIsResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [block.id, slotHeight, startMinutes, endMinutes, workStartMinutes, workEndMinutes, onResize]);

  return (
    <div
      className={`absolute left-1 right-1 rounded-md border-l-4 px-2 py-1 cursor-pointer pointer-events-auto
        hover:shadow-lg transition-shadow overflow-hidden ${getBackgroundColor()} ${isResizing ? 'z-20' : ''}`}
      style={{ top: `${displayTop}px`, height: `${Math.max(displayHeight, slotHeight)}px` }}
      onClick={() => !isResizing && onClick?.(block)}
    >
      {/* 상단 리사이즈 핸들 */}
      <div
        className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-white/20 transition-colors"
        onMouseDown={(e) => handleResizeStart(e, 'top')}
      />

      <div className="flex flex-col h-full overflow-hidden">
        <span className={`text-xs font-medium truncate ${displayInfo.isCompleted ? 'line-through text-gray-400' : 'text-white'}`}>
          {displayInfo.title}
        </span>
        {displayHeight > 30 && displayInfo.taskTitle && (
          <span className="text-[10px] text-gray-400 truncate">
            {displayInfo.taskTitle}
          </span>
        )}
        {displayHeight > 50 && displayInfo.featureTitle && (
          <div className="flex items-center gap-1 mt-auto">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: displayInfo.featureColor }}
            />
            <span className="text-[10px] text-gray-400 truncate">
              {displayInfo.featureTitle}
            </span>
          </div>
        )}
      </div>

      {/* 하단 리사이즈 핸들 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-white/20 transition-colors"
        onMouseDown={(e) => handleResizeStart(e, 'bottom')}
      />
    </div>
  );
}
