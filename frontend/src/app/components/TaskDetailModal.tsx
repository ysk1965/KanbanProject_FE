import { useState, useEffect } from 'react';
import { Task, Tag, ChecklistItem, User } from '../types';
import { checklistAPI, taskAPI } from '../utils/api';
import { BoardMember } from './ShareBoardModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { X, Plus, Trash2, Clock, CheckSquare, CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  availableTags: Tag[];
  onCreateTag: (name: string, color: string) => void;
  boardMembers: BoardMember[];
  currentUser: User | null;
  boardId: string | null;
}

export function TaskDetailModal({
  task,
  open,
  onClose,
  onUpdate,
  onDelete,
  availableTags,
  onCreateTag,
  boardMembers,
  currentUser,
  boardId,
}: TaskDetailModalProps) {
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // 변경사항 추적
  const [initialTask, setInitialTask] = useState<Task | null>(null);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 체크리스트 상태
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    if (task && open) {
      setInitialTask(JSON.parse(JSON.stringify(task)));
      setEditedTask(JSON.parse(JSON.stringify(task)));
      setHasChanges(false);
      setChecklistItems([]); // 체크리스트 초기화

      // 체크리스트 API 로드
      if (boardId) {
        checklistAPI.getChecklist(boardId, task.id)
          .then((response) => {
            const items: ChecklistItem[] = response.items.map((item) => ({
              id: item.id,
              title: item.title,
              completed: item.completed,
              position: item.position,
              start_date: item.start_date,
              due_date: item.due_date,
              done_date: item.done_date,
              assignee: item.assignee ? { id: item.assignee.id, name: item.assignee.name, profile_image: item.assignee.profile_image } : null,
            }));
            setChecklistItems(items);
          })
          .catch((error) => {
            console.error('Failed to load checklist:', error);
          });
      }
    }
  }, [task, open, boardId]);

  useEffect(() => {
    if (initialTask && editedTask) {
      const changed = JSON.stringify(initialTask) !== JSON.stringify(editedTask);
      setHasChanges(changed);
    }
  }, [initialTask, editedTask]);

  if (!task || !editedTask) return null;

  const handleClose = () => {
    if (hasChanges) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    if (hasChanges && editedTask) {
      onUpdate(editedTask);
      setHasChanges(false);
    }
    onClose();
  };

  const handleDiscardAndClose = () => {
    setShowConfirmDialog(false);
    onClose();
  };

  const handleSaveAndClose = () => {
    if (editedTask) {
      onUpdate(editedTask);
    }
    setShowConfirmDialog(false);
    onClose();
  };

  const updateEditedTask = (updates: Partial<Task>) => {
    setEditedTask((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const handleAddTag = async (tagId: string) => {
    if (!boardId || !task) return;

    const currentTags = editedTask.tags || [];
    const tagToAdd = availableTags.find((t) => t.id === tagId);
    if (tagToAdd && !currentTags.some((t) => t.id === tagId)) {
      // 낙관적 업데이트
      updateEditedTask({ tags: [...currentTags, tagToAdd] });

      try {
        // API 호출: POST /boards/{boardId}/tasks/{taskId}/tags
        await taskAPI.addTag(boardId, task.id, tagId);
      } catch (error) {
        console.error('Failed to add tag:', error);
        // 롤백
        updateEditedTask({ tags: currentTags });
      }
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!boardId || !task) return;

    const currentTags = editedTask.tags || [];
    // 낙관적 업데이트
    updateEditedTask({ tags: currentTags.filter((t) => t.id !== tagId) });

    try {
      // API 호출: DELETE /boards/{boardId}/tasks/{taskId}/tags/{tagId}
      await taskAPI.removeTag(boardId, task.id, tagId);
    } catch (error) {
      console.error('Failed to remove tag:', error);
      // 롤백
      updateEditedTask({ tags: currentTags });
    }
  };

  const handleCreateNewTag = () => {
    if (newTagName.trim()) {
      const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      onCreateTag(newTagName.trim(), randomColor);
      setNewTagName('');
      setShowTagInput(false);
    }
  };

  // 체크리스트 관련 함수
  const handleAddChecklistItem = async (data: {
    title: string;
    start_date?: string;
    due_date?: string;
    assignee_id?: string;
  }) => {
    if (!data.title.trim() || !boardId || !task) return;

    try {
      const response = await checklistAPI.addItem(boardId, task.id, {
        title: data.title.trim(),
        assignee_id: data.assignee_id,
        start_date: data.start_date,
        due_date: data.due_date,
      });

      const newItem: ChecklistItem = {
        id: response.id,
        title: response.title,
        completed: response.completed,
        position: response.position,
        start_date: response.start_date,
        due_date: response.due_date,
        done_date: response.done_date,
        assignee: response.assignee ? { id: response.assignee.id, name: response.assignee.name, profile_image: response.assignee.profile_image } : null,
      };

      const newItems = [...checklistItems, newItem];
      setChecklistItems(newItems);

      // 부모 상태 업데이트 (카드에 반영)
      const newTotal = newItems.length;
      const newCompleted = newItems.filter(item => item.completed).length;
      onUpdate({ checklist_total: newTotal, checklist_completed: newCompleted });
    } catch (error) {
      console.error('Failed to add checklist item:', error);
    }
  };

  const handleToggleChecklistItem = async (itemId: string) => {
    if (!boardId || !task) return;

    const prevItems = [...checklistItems];
    const targetItem = checklistItems.find((item) => item.id === itemId);
    if (!targetItem) return;

    const newCompleted = !targetItem.completed;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식

    // 낙관적 업데이트 - done_date도 함께 업데이트
    const newItems = checklistItems.map((item) =>
      item.id === itemId
        ? {
            ...item,
            completed: newCompleted,
            done_date: newCompleted ? today : null, // 완료시 오늘 날짜, 미완료시 null
          }
        : item
    );
    setChecklistItems(newItems);

    // 부모 상태 업데이트 (카드에 반영)
    const completedCount = newItems.filter(item => item.completed).length;
    onUpdate({ checklist_total: newItems.length, checklist_completed: completedCount });

    try {
      await checklistAPI.toggleItem(boardId, task.id, itemId);
    } catch (error) {
      console.error('Failed to toggle checklist item:', error);
      // 롤백
      setChecklistItems(prevItems);
      const prevCompleted = prevItems.filter(item => item.completed).length;
      onUpdate({ checklist_total: prevItems.length, checklist_completed: prevCompleted });
    }
  };

  const handleUpdateChecklistItem = async (itemId: string, updates: Partial<ChecklistItem>) => {
    if (!boardId || !task) return;

    // 낙관적 업데이트
    setChecklistItems(
      checklistItems.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    );

    try {
      await checklistAPI.updateItem(boardId, task.id, itemId, {
        title: updates.title,
        assignee_id: updates.assignee?.id ?? null,
        start_date: updates.start_date ?? null,
        due_date: updates.due_date ?? null,
      });
    } catch (error) {
      console.error('Failed to update checklist item:', error);
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    if (!boardId || !task) return;

    const originalItems = [...checklistItems];
    // 낙관적 업데이트
    const newItems = checklistItems.filter((item) => item.id !== itemId);
    setChecklistItems(newItems);

    // 부모 task 상태 업데이트
    const newCompleted = newItems.filter(item => item.completed).length;
    onUpdate({ checklist_total: newItems.length, checklist_completed: newCompleted });

    try {
      await checklistAPI.deleteItem(boardId, task.id, itemId);
    } catch (error) {
      console.error('Failed to delete checklist item:', error);
      // 롤백
      setChecklistItems(originalItems);
      const rolledBackCompleted = originalItems.filter(item => item.completed).length;
      onUpdate({ checklist_total: originalItems.length, checklist_completed: rolledBackCompleted });
    }
  };

  // 체크리스트 진행률 계산
  const completedChecklistCount = checklistItems.filter((item) => item.completed).length;
  const checklistProgress = checklistItems.length > 0
    ? Math.round((completedChecklistCount / checklistItems.length) * 100)
    : 0;

  const taskTags = editedTask.tags || [];
  const availableTagsToAdd = availableTags.filter(
    (tag) => !taskTags.some((t) => t.id === tag.id)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" onPointerDownOutside={(e) => {
          if (hasChanges) {
            e.preventDefault();
            handleClose();
          }
        }}>
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                  <Input
                    value={editedTask.title}
                    onChange={(e) => updateEditedTask({ title: e.target.value })}
                    className="text-lg font-semibold border-0 p-0 focus-visible:ring-0"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              작업 세부 정보를 편집합니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 설명 */}
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea
                value={editedTask.description || ''}
                onChange={(e) => updateEditedTask({ description: e.target.value })}
                placeholder="설명이 없습니다."
                rows={3}
              />
            </div>

            {/* 기간 & 예상 시간 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>기간</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-10 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editedTask.start_date || editedTask.due_date ? (
                        <>
                          {editedTask.start_date ? format(new Date(editedTask.start_date), 'yyyy. MM. dd.', { locale: ko }) : '시작일 미정'}
                          {' ~ '}
                          {editedTask.due_date ? format(new Date(editedTask.due_date), 'yyyy. MM. dd.', { locale: ko }) : '종료일 미정'}
                        </>
                      ) : (
                        <span className="text-gray-400">날짜를 선택하세요</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{
                        from: editedTask.start_date ? new Date(editedTask.start_date) : undefined,
                        to: editedTask.due_date ? new Date(editedTask.due_date) : undefined,
                      }}
                      onSelect={(range) => {
                        updateEditedTask({
                          start_date: range?.from ? format(range.from, 'yyyy-MM-dd') : null,
                          due_date: range?.to ? format(range.to, 'yyyy-MM-dd') : null,
                        });
                      }}
                      numberOfMonths={2}
                      locale={ko}
                    />
                    {(editedTask.start_date || editedTask.due_date) && (
                      <div className="p-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-red-500 hover:text-red-700"
                          onClick={() => updateEditedTask({ start_date: null, due_date: null })}
                        >
                          날짜 삭제
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>예상 시간 (분)</Label>
                <Input
                  type="number"
                  value={editedTask.estimated_minutes || ''}
                  onChange={(e) => updateEditedTask({ estimated_minutes: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="예: 60"
                />
              </div>
            </div>

            {/* 담당자 */}
            <div className="space-y-2">
              <Label>담당자</Label>
              <div className="flex items-center gap-2">
                {editedTask.assignee ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
                      {editedTask.assignee.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm">{editedTask.assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">담당자 없음</span>
                )}
              </div>
            </div>

            {/* 태그 */}
            <div className="space-y-2">
              <Label>태그</Label>
              <div className="flex flex-wrap gap-2">
                {taskTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    style={{ backgroundColor: tag.color }}
                    className="text-white flex items-center gap-1"
                  >
                    {tag.name}
                    <button
                      onClick={() => handleRemoveTag(tag.id)}
                      className="hover:opacity-80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}

                {showTagInput ? (
                  <div className="flex gap-1 items-center">
                    <Input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="태그 이름"
                      className="h-7 w-32 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateNewTag();
                        }
                      }}
                    />
                    <Button size="sm" onClick={handleCreateNewTag}>
                      생성
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowTagInput(false);
                        setNewTagName('');
                      }}
                    >
                      취소
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    {availableTagsToAdd.length > 0 && (
                      <Select onValueChange={handleAddTag}>
                        <SelectTrigger className="w-[120px] h-7 text-sm">
                          <SelectValue placeholder="태그 추가" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTagsToAdd.map((tag) => (
                            <SelectItem key={tag.id} value={tag.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: tag.color }}
                                />
                                {tag.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowTagInput(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      새 태그
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 체크리스트 섹션 */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-gray-600" />
                <Label className="text-base font-semibold">CheckList</Label>
              </div>
              <div className="text-sm text-gray-600">
                {checklistProgress}%
              </div>
            </div>

            {/* 체크리스트 항목들 */}
            <div className="space-y-2">
              {checklistItems
                .sort((a, b) => a.position - b.position)
                .map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => handleToggleChecklistItem(item.id)}
                    onUpdate={(updates) => handleUpdateChecklistItem(item.id, updates)}
                    onDelete={() => handleDeleteChecklistItem(item.id)}
                    boardMembers={boardMembers}
                  />
                ))}

              {/* 새 항목 추가 */}
              <AddChecklistItemInput onAdd={handleAddChecklistItem} boardMembers={boardMembers} currentUser={currentUser} />
            </div>
          </div>

          {/* 저장 버튼 - 변경사항이 있을 때만 표시 */}
          {hasChanges && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button onClick={handleSave}>
                저장
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 확인 다이얼로그 */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>변경사항을 저장하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              저장하지 않은 변경사항이 있습니다. 저장하지 않고 닫으면 변경사항이 사라집니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardAndClose}>
              저장 안 함
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndClose}>
              저장
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 삭제 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 작업을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 작업은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (task) {
                  onDelete(task.id);
                }
                setShowDeleteDialog(false);
                onClose();
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// 체크리스트 항목 컴포넌트
function ChecklistItemRow({
  item,
  onToggle,
  onUpdate,
  onDelete,
  boardMembers,
}: {
  item: ChecklistItem;
  onToggle: () => void;
  onUpdate: (updates: Partial<ChecklistItem>) => void;
  onDelete: () => void;
  boardMembers: BoardMember[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(item.title);
  const [showOptions, setShowOptions] = useState(false);

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== item.title) {
      onUpdate({ title: editedTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditedTitle(item.title);
      setIsEditing(false);
    }
  };

  // 마감일 상태 확인
  const isOverdue =
    item.due_date && new Date(item.due_date) < new Date() && !item.completed;
  const isDueSoon =
    item.due_date &&
    new Date(item.due_date).getTime() - new Date().getTime() < 86400000 &&
    !item.completed;

  return (
    <div className="group flex items-start gap-2 p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200">
      {/* 체크박스 */}
      <button
        onClick={onToggle}
        className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
          item.completed ? 'bg-green-500' : 'bg-gray-300 hover:bg-gray-400'
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
      </button>

      {/* 제목 */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={handleKeyDown}
            className="text-xs h-6"
            autoFocus
          />
        ) : (
          <div
            className={`text-xs cursor-pointer ${
              item.completed ? 'line-through text-gray-500' : 'text-gray-900'
            }`}
            onClick={() => setIsEditing(true)}
          >
            {item.title}
          </div>
        )}

        {/* 메타 정보 */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {(item.start_date || item.due_date) && (
            <div
              className={`flex items-center gap-1 text-xs ${
                isOverdue
                  ? 'text-red-600'
                  : isDueSoon
                  ? 'text-orange-600'
                  : 'text-gray-500'
              }`}
            >
              <CalendarIcon className="h-3 w-3" />
              {item.start_date && item.due_date ? (
                <>
                  {format(new Date(item.start_date), 'M/d', { locale: ko })} - {format(new Date(item.due_date), 'M/d', { locale: ko })}
                </>
              ) : item.start_date ? (
                <>{format(new Date(item.start_date), 'M/d', { locale: ko })} ~</>
              ) : (
                <>~ {format(new Date(item.due_date!), 'M/d', { locale: ko })}</>
              )}
            </div>
          )}
          {item.done_date && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <span>완료:</span>
              {format(new Date(item.done_date), 'M/d', { locale: ko })}
            </div>
          )}
          {item.assignee && (
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
                {item.assignee.name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setShowOptions(!showOptions)}
          >
            •••
          </Button>
          {showOptions && (
            <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg p-3 z-10 min-w-[220px]">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500">기간</div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-7 text-xs justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {item.start_date || item.due_date ? (
                        <>
                          {item.start_date ? format(new Date(item.start_date), 'MM/dd', { locale: ko }) : '?'} -{' '}
                          {item.due_date ? format(new Date(item.due_date), 'MM/dd', { locale: ko }) : '?'}
                        </>
                      ) : (
                        <span className="text-gray-400">날짜 선택</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{
                        from: item.start_date ? new Date(item.start_date) : undefined,
                        to: item.due_date ? new Date(item.due_date) : undefined,
                      }}
                      onSelect={(range) => {
                        onUpdate({
                          start_date: range?.from ? format(range.from, 'yyyy-MM-dd') : null,
                          due_date: range?.to ? format(range.to, 'yyyy-MM-dd') : null,
                        });
                      }}
                      numberOfMonths={1}
                      locale={ko}
                    />
                    {(item.start_date || item.due_date) && (
                      <div className="p-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-red-500 hover:text-red-700"
                          onClick={() => onUpdate({ start_date: null, due_date: null })}
                        >
                          날짜 삭제
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                <div className="text-xs font-semibold text-gray-500 mt-2">담당자</div>
                <Select
                  value={item.assignee?.id || 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      onUpdate({ assignee: null });
                    } else {
                      const member = boardMembers.find((m) => m.userId === value);
                      if (member) {
                        onUpdate({ assignee: { id: member.userId, name: member.name, profile_image: member.avatar || null } });
                      }
                    }
                  }}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="없음" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-xs">없음</span>
                    </SelectItem>
                    {boardMembers.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white flex-shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs">{member.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// 체크리스트 항목 추가 입력
function AddChecklistItemInput({
  onAdd,
  boardMembers,
  currentUser,
}: {
  onAdd: (data: { title: string; start_date?: string; due_date?: string; assignee_id?: string }) => void;
  boardMembers: BoardMember[];
  currentUser: User | null;
}) {
  const [value, setValue] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [assigneeId, setAssigneeId] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // 기본값 설정: 현재 사용자를 담당자로, 오늘 날짜를 시작일로
  const handleStartAdding = () => {
    setIsAdding(true);
    // 시작일을 오늘로 설정
    setDateRange({ from: new Date(), to: undefined });
    // 현재 사용자가 보드 멤버인지 확인하고 기본값으로 설정
    if (currentUser) {
      const currentMember = boardMembers.find(m => m.userId === currentUser.id);
      if (currentMember) {
        setAssigneeId(currentUser.id);
      }
    }
  };

  const handleAdd = () => {
    if (value.trim()) {
      onAdd({
        title: value,
        start_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        due_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
        assignee_id: assigneeId || undefined,
      });
      setValue('');
      setDateRange(undefined);
      setAssigneeId('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      setValue('');
      setDateRange(undefined);
      setAssigneeId('');
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setValue('');
    setDateRange(undefined);
    setAssigneeId('');
    setIsAdding(false);
  };

  // 선택된 담당자 정보 가져오기
  const selectedMember = assigneeId ? boardMembers.find(m => m.userId === assigneeId) : null;

  if (!isAdding) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-gray-600 hover:bg-gray-100"
        onClick={handleStartAdding}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add an item
      </Button>
    );
  }

  return (
    <div className="p-2 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex gap-2 items-start">
        <div className="w-4 h-4 rounded bg-gray-200 flex-shrink-0 mt-1.5" />
        <div className="flex-1 space-y-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="항목 입력..."
            className="text-xs h-7"
            autoFocus
          />

          {/* 옵션 필드들 */}
          <div className="flex gap-2 pt-2 border-t border-gray-200">
              {/* 날짜 범위 선택 */}
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">기간</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-7 text-xs justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'MM/dd', { locale: ko })} -{' '}
                            {format(dateRange.to, 'MM/dd', { locale: ko })}
                          </>
                        ) : (
                          format(dateRange.from, 'MM/dd', { locale: ko })
                        )
                      ) : (
                        <span className="text-gray-400">날짜 선택</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={1}
                      locale={ko}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* 담당자 */}
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">담당자</label>
                <Select
                  value={assigneeId || 'none'}
                  onValueChange={(val) => setAssigneeId(val === 'none' ? '' : val)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    {selectedMember ? (
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white flex-shrink-0">
                          {selectedMember.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{selectedMember.name}</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="없음" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-xs">없음</span>
                    </SelectItem>
                    {boardMembers.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white flex-shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs">{member.name}</span>
                          {member.userId === currentUser?.id && (
                            <span className="text-[10px] text-gray-400">(나)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex justify-end gap-2 mt-2">
        <Button size="sm" onClick={handleAdd} className="h-7">
          추가
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="h-7"
        >
          취소
        </Button>
      </div>
    </div>
  );
}