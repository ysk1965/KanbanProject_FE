import { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Settings, Plus, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { format, addDays, subDays, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { BoardMember } from './ShareBoardModal';
import { ScheduleBlock } from './ScheduleBlock';
import { ScheduleDetailPanel } from './ScheduleDetailPanel';
import { ActionChoiceModal } from './ActionChoiceModal';
import { ChecklistSelectModal } from './ChecklistSelectModal';
import {
  scheduleAPI,
  ScheduleBlockInfo,
  ScheduleColumnInfo,
  ScheduleSettingsResponse,
} from '../utils/api';

interface DailyScheduleViewProps {
  boardId: string;
  boardMembers: BoardMember[];
}

const SLOT_HEIGHT = 40; // 30분 슬롯의 높이 (px)

// 시간 슬롯 생성 (30분 단위)
const generateTimeSlots = (startHour: number, endHour: number) => {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

// 시간 문자열에서 시간만 추출 (예: "09:00" 또는 "09:00:00" -> 9)
const parseHour = (time: string): number => {
  return parseInt(time.split(':')[0], 10);
};

export function DailyScheduleView({ boardId, boardMembers }: DailyScheduleViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [isLoading, setIsLoading] = useState(false);
  const [columns, setColumns] = useState<ScheduleColumnInfo[]>([]);
  const [settings, setSettings] = useState<ScheduleSettingsResponse | null>(null);

  // 드래그 선택 상태
  const [dragState, setDragState] = useState<{
    userId: string;
    startSlotIndex: number;
    endSlotIndex: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 선택된 블록 (상세 패널용)
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlockInfo | null>(null);

  // 대기 중인 블록 생성 (Action Choice 모달용)
  const [pendingBlock, setPendingBlock] = useState<{
    userId: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  // 체크리스트 선택 모달 상태
  const [showChecklistSelect, setShowChecklistSelect] = useState(false);

  // 설정에서 시간 범위 계산
  const workStartHour = settings ? parseHour(settings.work_start_time) : 9;
  const workEndHour = settings ? workStartHour + settings.work_hours_per_day : 18;

  const timeSlots = useMemo(
    () => generateTimeSlots(workStartHour, workEndHour),
    [workStartHour, workEndHour]
  );

  // 스케줄 데이터 로드
  const loadSchedule = useCallback(async () => {
    if (!boardId) return;

    setIsLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await scheduleAPI.getDailySchedule(boardId, dateStr);

      setColumns(response.columns);
      setSettings(response.settings);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setIsLoading(false);
    }
  }, [boardId, selectedDate]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const handleToday = () => setSelectedDate(startOfDay(new Date()));

  const dayOfWeek = format(selectedDate, 'EEEE', { locale: ko });
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  // 멤버별 블록 매핑
  const blocksByUser = useMemo(() => {
    const map = new Map<string, ScheduleBlockInfo[]>();
    columns.forEach((col) => {
      map.set(col.user.id, col.blocks);
    });
    return map;
  }, [columns]);

  // 드래그 시작
  const handleMouseDown = (userId: string, slotIndex: number) => {
    setIsDragging(true);
    setDragState({
      userId,
      startSlotIndex: slotIndex,
      endSlotIndex: slotIndex,
    });
  };

  // 드래그 중
  const handleMouseEnter = (userId: string, slotIndex: number) => {
    if (!isDragging || !dragState) return;
    if (dragState.userId !== userId) return;

    setDragState({
      ...dragState,
      endSlotIndex: slotIndex,
    });
  };

  // 드래그 종료
  const handleMouseUp = () => {
    if (!isDragging || !dragState) {
      setIsDragging(false);
      setDragState(null);
      return;
    }

    const { userId, startSlotIndex, endSlotIndex } = dragState;
    const minIndex = Math.min(startSlotIndex, endSlotIndex);
    const maxIndex = Math.max(startSlotIndex, endSlotIndex);

    // 최소 1슬롯 이상 선택해야 함
    if (maxIndex - minIndex >= 0) {
      const startTime = timeSlots[minIndex];
      const endTime = timeSlots[maxIndex + 1] || `${workEndHour}:00`;

      // Action Choice 모달 열기
      setPendingBlock({
        userId,
        startTime,
        endTime,
      });
    }

    setIsDragging(false);
    setDragState(null);
  };

  // 셀이 드래그 선택 영역에 포함되는지 확인
  const isSlotSelected = (userId: string, slotIndex: number) => {
    if (!dragState || dragState.userId !== userId) return false;
    const minIndex = Math.min(dragState.startSlotIndex, dragState.endSlotIndex);
    const maxIndex = Math.max(dragState.startSlotIndex, dragState.endSlotIndex);
    return slotIndex >= minIndex && slotIndex <= maxIndex;
  };

  // 블록 클릭 핸들러
  const handleBlockClick = (block: ScheduleBlockInfo) => {
    setSelectedBlock(block);
  };

  // 패널 닫기
  const handleClosePanel = () => {
    setSelectedBlock(null);
  };

  // 블록 삭제 후 처리
  const handleBlockDeleted = () => {
    setSelectedBlock(null);
    loadSchedule();
  };

  // 체크리스트 토글 후 처리
  const handleChecklistToggled = () => {
    loadSchedule();
  };

  // Action Choice: 새 체크리스트 아이템 생성
  const handleCreateNewChecklistItem = async () => {
    if (!pendingBlock) return;

    // TODO: 체크리스트 생성 모달 열기
    // 지금은 빈 블록 생성
    try {
      await scheduleAPI.createBlock(boardId, {
        assignee_id: pendingBlock.userId,
        scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: pendingBlock.startTime,
        end_time: pendingBlock.endTime,
      });
      await loadSchedule();
    } catch (error) {
      console.error('Failed to create block:', error);
    }
    setPendingBlock(null);
  };

  // Action Choice: 기존 체크리스트 연결
  const handleConnectExisting = () => {
    if (!pendingBlock) return;
    setShowChecklistSelect(true);
  };

  // 체크리스트 아이템 선택 후 블록 생성
  const handleChecklistItemSelect = async (checklistItemId: string) => {
    if (!pendingBlock) return;

    try {
      await scheduleAPI.createBlock(boardId, {
        checklist_item_id: checklistItemId,
        assignee_id: pendingBlock.userId,
        scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: pendingBlock.startTime,
        end_time: pendingBlock.endTime,
      });
      await loadSchedule();
    } catch (error) {
      console.error('Failed to create block with checklist item:', error);
    }
    setShowChecklistSelect(false);
    setPendingBlock(null);
  };

  // Action Choice 모달 닫기
  const handleCloseActionChoice = () => {
    setPendingBlock(null);
  };

  // 블록 리사이즈 처리
  const handleBlockResize = async (blockId: string, startTime: string, endTime: string) => {
    try {
      await scheduleAPI.updateBlock(boardId, blockId, {
        start_time: startTime,
        end_time: endTime,
      });
      // 선택된 블록이면 상세 패널도 업데이트
      if (selectedBlock && selectedBlock.id === blockId) {
        setSelectedBlock({
          ...selectedBlock,
          start_time: startTime,
          end_time: endTime,
        });
      }
      await loadSchedule();
    } catch (error) {
      console.error('Failed to resize block:', error);
    }
  };

  return (
    <div
      className="h-full flex flex-col"
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (isDragging) {
          setIsDragging(false);
          setDragState(null);
        }
      }}
    >
      {/* 상단 날짜 네비게이션 */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#282e33] border-b border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevDay}
              className="text-gray-400 hover:text-white hover:bg-[#3a4149] h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold text-white min-w-[200px] text-center">
              {format(selectedDate, 'yyyy년 M월 d일', { locale: ko })} ({dayOfWeek})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextDay}
              className="text-gray-400 hover:text-white hover:bg-[#3a4149] h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant={isToday ? 'default' : 'outline'}
            size="sm"
            onClick={handleToday}
            className={
              isToday
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'border-gray-600 text-gray-300 hover:bg-[#3a4149] hover:text-white'
            }
          >
            오늘
          </Button>
          {isLoading && <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-300 hover:bg-[#3a4149] hover:text-white"
        >
          <Settings className="h-4 w-4 mr-2" />
          설정
        </Button>
      </div>

      {/* 스케줄 그리드 */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          {/* 헤더: 시간 + 멤버 컬럼 */}
          <div className="flex sticky top-0 bg-[#282e33] z-10 border-b border-gray-700">
            <div className="w-20 flex-shrink-0 p-3 text-sm font-medium text-gray-400 border-r border-gray-700">
              시간
            </div>
            {boardMembers.map((member) => (
              <div
                key={member.userId}
                className="w-48 flex-shrink-0 p-3 border-r border-gray-700"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm text-white font-medium">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white">{member.name}</span>
                </div>
              </div>
            ))}
            {boardMembers.length === 0 && (
              <div className="flex-1 p-3 text-gray-500 text-sm">보드에 멤버가 없습니다</div>
            )}
          </div>

          {/* 시간 그리드 */}
          <div className="relative">
            {timeSlots.map((time, slotIndex) => (
              <div key={time} className="flex border-b border-gray-800">
                {/* 시간 라벨 */}
                <div className="w-20 flex-shrink-0 p-2 text-xs text-gray-500 border-r border-gray-700 bg-[#1d2125]">
                  {time.endsWith(':00') ? time : ''}
                </div>
                {/* 멤버별 시간 셀 */}
                {boardMembers.map((member) => {
                  const isSelected = isSlotSelected(member.userId, slotIndex);
                  return (
                    <div
                      key={`${member.userId}-${time}`}
                      className={`w-48 flex-shrink-0 border-r border-gray-800 transition-colors cursor-pointer group relative ${
                        isSelected ? 'bg-blue-500/30' : 'hover:bg-[#2a3038]'
                      }`}
                      style={{ height: `${SLOT_HEIGHT}px` }}
                      onMouseDown={() => handleMouseDown(member.userId, slotIndex)}
                      onMouseEnter={() => handleMouseEnter(member.userId, slotIndex)}
                    >
                      {/* 빈 셀 호버 시 + 버튼 표시 */}
                      {!isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <Plus className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
                {boardMembers.length === 0 && (
                  <div className="flex-1 border-r border-gray-800" style={{ height: `${SLOT_HEIGHT}px` }} />
                )}
              </div>
            ))}

            {/* 스케줄 블록들 (각 멤버 컬럼 위에 absolute로 배치) */}
            <div className="absolute top-0 left-20 right-0 pointer-events-none">
              <div className="flex">
                {boardMembers.map((member) => {
                  const blocks = blocksByUser.get(member.userId) || [];
                  return (
                    <div
                      key={member.userId}
                      className="w-48 flex-shrink-0 relative pointer-events-auto"
                      style={{ height: `${timeSlots.length * SLOT_HEIGHT}px` }}
                    >
                      {blocks.map((block) => (
                        <ScheduleBlock
                          key={block.id}
                          block={block}
                          slotHeight={SLOT_HEIGHT}
                          workStartHour={workStartHour}
                          workEndHour={workEndHour}
                          onClick={handleBlockClick}
                          onResize={handleBlockResize}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="px-6 py-3 bg-[#282e33] border-t border-gray-700">
        <p className="text-sm text-gray-500">
          빈 영역을 세로로 드래그하여 새 타임블록을 생성하세요
        </p>
      </div>

      {/* 블록 상세 패널 */}
      {selectedBlock && (
        <ScheduleDetailPanel
          block={selectedBlock}
          boardId={boardId}
          selectedDate={selectedDate}
          onClose={handleClosePanel}
          onDelete={handleBlockDeleted}
          onChecklistToggle={handleChecklistToggled}
        />
      )}

      {/* Action Choice 모달 */}
      {pendingBlock && !showChecklistSelect && (
        <ActionChoiceModal
          startTime={pendingBlock.startTime}
          endTime={pendingBlock.endTime}
          onCreateNew={handleCreateNewChecklistItem}
          onConnectExisting={handleConnectExisting}
          onClose={handleCloseActionChoice}
        />
      )}

      {/* 체크리스트 선택 모달 */}
      {pendingBlock && showChecklistSelect && (
        <ChecklistSelectModal
          boardId={boardId}
          assigneeId={pendingBlock.userId}
          startTime={pendingBlock.startTime}
          endTime={pendingBlock.endTime}
          onSelect={handleChecklistItemSelect}
          onClose={() => {
            setShowChecklistSelect(false);
            setPendingBlock(null);
          }}
        />
      )}
    </div>
  );
}
