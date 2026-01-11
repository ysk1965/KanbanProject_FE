import { X, Clock, Calendar, User, CheckSquare, FileText, Folder, Trash2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { ScheduleBlockInfo, scheduleAPI, checklistAPI } from '../utils/api';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ScheduleDetailPanelProps {
  block: ScheduleBlockInfo;
  boardId: string;
  selectedDate: Date;
  onClose: () => void;
  onDelete: () => void;
  onChecklistToggle: () => void;
  onViewTask?: (taskId: string) => void;
  onViewFeature?: (featureId: string) => void;
}

// 시간 문자열에서 시:분 추출 (HH:mm:ss -> HH:mm)
const formatTime = (time: string): string => {
  return time.substring(0, 5);
};

// 시간 차이 계산 (분 단위)
const calculateDuration = (startTime: string, endTime: string): string => {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const durationMinutes = endMinutes - startMinutes;

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}시간 ${minutes}분`;
  } else if (hours > 0) {
    return `${hours}시간`;
  } else {
    return `${minutes}분`;
  }
};

export function ScheduleDetailPanel({
  block,
  boardId,
  selectedDate,
  onClose,
  onDelete,
  onChecklistToggle,
  onViewTask,
  onViewFeature,
}: ScheduleDetailPanelProps) {
  const checklist = block.checklist_item;
  const task = block.task;
  const feature = block.feature;

  const handleToggleComplete = async () => {
    if (!checklist || !task) return;

    try {
      await checklistAPI.toggleItem(boardId, task.id, checklist.id);
      onChecklistToggle();
    } catch (error) {
      console.error('Failed to toggle checklist:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('이 타임블록을 삭제하시겠습니까?')) return;

    try {
      await scheduleAPI.deleteBlock(boardId, block.id);
      onDelete();
    } catch (error) {
      console.error('Failed to delete block:', error);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-[#282e33] border-l border-gray-700 shadow-xl z-50 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">타임블록 상세</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-400 hover:text-white hover:bg-[#3a4149] h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* 시간 정보 */}
        <div className="bg-[#1d2125] rounded-lg p-4">
          <div className="flex items-center gap-2 text-white mb-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <span className="text-lg font-medium">
              {formatTime(block.start_time)} - {formatTime(block.end_time)}
            </span>
            <span className="text-gray-400 text-sm">
              ({calculateDuration(block.start_time, block.end_time)})
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(selectedDate, 'yyyy년 M월 d일', { locale: ko })}</span>
            </div>
          </div>
        </div>

        {/* 체크리스트 정보 */}
        <div className="bg-[#1d2125] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-gray-400">CHECKLIST</span>
          </div>

          {checklist ? (
            <div className="bg-[#282e33] rounded-lg p-3">
              <div className="flex items-start gap-3">
                <button
                  onClick={handleToggleComplete}
                  className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                    checklist.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-500 hover:border-green-400'
                  }`}
                >
                  {checklist.completed && <Check className="h-3 w-3 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-white font-medium ${checklist.completed ? 'line-through text-gray-400' : ''}`}>
                    {checklist.title}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {checklist.start_date && (
                      <span>시작: {checklist.start_date.substring(5).replace('-', '/')}</span>
                    )}
                    {checklist.due_date && (
                      <span>마감: {checklist.due_date.substring(5).replace('-', '/')}</span>
                    )}
                  </div>
                </div>
              </div>

              {!checklist.completed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleComplete}
                  className="w-full mt-3 border-green-600 text-green-400 hover:bg-green-600/20"
                >
                  <Check className="h-4 w-4 mr-2" />
                  완료 처리
                </Button>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-sm text-center py-4">
              연결된 체크리스트가 없습니다
            </div>
          )}
        </div>

        {/* Task 정보 */}
        <div className="bg-[#1d2125] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-400">TASK</span>
            </div>
            {task && onViewTask && (
              <button
                onClick={() => onViewTask(task.id)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                보기 →
              </button>
            )}
          </div>

          {task ? (
            <div className="text-white">
              <p className="font-medium">{task.title}</p>
            </div>
          ) : (
            <div className="text-gray-500 text-sm text-center py-2">
              연결된 Task가 없습니다
            </div>
          )}
        </div>

        {/* Feature 정보 */}
        <div className="bg-[#1d2125] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-gray-400">FEATURE</span>
            </div>
            {feature && onViewFeature && (
              <button
                onClick={() => onViewFeature(feature.id)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                보기 →
              </button>
            )}
          </div>

          {feature ? (
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: feature.color }}
              />
              <p className="text-white font-medium">{feature.title}</p>
            </div>
          ) : (
            <div className="text-gray-500 text-sm text-center py-2">
              연결된 Feature가 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 하단 삭제 버튼 */}
      <div className="p-4 border-t border-gray-700">
        <Button
          variant="outline"
          onClick={handleDelete}
          className="w-full border-red-600 text-red-400 hover:bg-red-600/20"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          타임블록 삭제
        </Button>
      </div>
    </div>
  );
}
