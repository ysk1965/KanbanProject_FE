import { useState, useEffect } from 'react';
import { Task, Priority, Tag, ChecklistItem } from '../types';
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
import { X, Plus, User, Trash2, Calendar, Clock, CheckSquare } from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  availableTags: Tag[];
  onCreateTag: (name: string, color: string) => void;
  availableMembers: string[]; // 간단하게 이름 목록으로
}

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700 border-red-300',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  low: 'bg-green-100 text-green-700 border-green-300',
};

const PRIORITY_LABELS = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

export function TaskDetailModal({
  task,
  open,
  onClose,
  onUpdate,
  onDelete,
  availableTags,
  onCreateTag,
  availableMembers,
}: TaskDetailModalProps) {
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [showMemberSelect, setShowMemberSelect] = useState(false);
  
  // 변경사항 추적
  const [initialTask, setInitialTask] = useState<Task | null>(null);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (task && open) {
      setInitialTask(JSON.parse(JSON.stringify(task)));
      setEditedTask(JSON.parse(JSON.stringify(task)));
      setHasChanges(false);
    }
  }, [task, open]);

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

  const handleAddTag = (tagId: string) => {
    const currentTags = editedTask.tags || [];
    if (!currentTags.includes(tagId)) {
      updateEditedTask({ tags: [...currentTags, tagId] });
    }
  };

  const handleRemoveTag = (tagId: string) => {
    const currentTags = editedTask.tags || [];
    updateEditedTask({ tags: currentTags.filter((t) => t !== tagId) });
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

  const handleAddParticipant = (memberName: string) => {
    const currentParticipants = editedTask.participants || [];
    if (!currentParticipants.includes(memberName)) {
      updateEditedTask({ participants: [...currentParticipants, memberName] });
    }
    setShowMemberSelect(false);
  };

  const handleRemoveParticipant = (memberName: string) => {
    const currentParticipants = editedTask.participants || [];
    updateEditedTask({ participants: currentParticipants.filter((p) => p !== memberName) });
  };

  // 체크리스트 관련 함수
  const handleAddChecklistItem = (title: string) => {
    if (!title.trim()) return;
    
    const checklistItems = editedTask.checklistItems || [];
    const maxOrder = checklistItems.length > 0 
      ? Math.max(...checklistItems.map((item) => item.order)) 
      : -1;
    
    // 현재 날짜 (YYYY-MM-DD 형식)
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    const newItem: ChecklistItem = {
      id: `checklist_${Date.now()}`,
      title: title.trim(),
      isCompleted: false,
      order: maxOrder + 1,
      dueDate: todayString, // 디폴트 당일
      assignee: editedTask.assignee, // 디폴트 카드의 담당자
    };
    
    updateEditedTask({ checklistItems: [...checklistItems, newItem] });
  };

  const handleToggleChecklistItem = (itemId: string) => {
    const checklistItems = editedTask.checklistItems || [];
    updateEditedTask({
      checklistItems: checklistItems.map((item) =>
        item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
      ),
    });
  };

  const handleUpdateChecklistItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    const checklistItems = editedTask.checklistItems || [];
    updateEditedTask({
      checklistItems: checklistItems.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    });
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    const checklistItems = editedTask.checklistItems || [];
    updateEditedTask({
      checklistItems: checklistItems.filter((item) => item.id !== itemId),
    });
  };

  // 체크리스트 진행률 계산
  const checklistItems = editedTask.checklistItems || [];
  const completedChecklistCount = checklistItems.filter((item) => item.isCompleted).length;
  const checklistProgress = checklistItems.length > 0 
    ? Math.round((completedChecklistCount / checklistItems.length) * 100) 
    : 0;

  const taskTags = availableTags.filter((tag) => editedTask.tags?.includes(tag.id));
  const availableTagsToAdd = availableTags.filter(
    (tag) => !editedTask.tags?.includes(tag.id)
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

            {/* 우선순위 & 마감일 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>우선순위</Label>
                <Select
                  value={editedTask.priority || 'medium'}
                  onValueChange={(value) => updateEditedTask({ priority: value as Priority })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="설정되지 않음" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        높음
                      </span>
                    </SelectItem>
                    <SelectItem value="medium">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        보통
                      </span>
                    </SelectItem>
                    <SelectItem value="low">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        낮음
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>마감일</Label>
                <Input
                  type="date"
                  value={editedTask.dueDate || ''}
                  onChange={(e) => updateEditedTask({ dueDate: e.target.value })}
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
                      {editedTask.assignee.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm">{editedTask.assignee}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">담당자 없음</span>
                )}
              </div>
            </div>

            {/* 참여자 */}
            <div className="space-y-2">
              <Label>참여자</Label>
              <div className="flex flex-wrap gap-2">
                {editedTask.participants?.map((participant) => (
                  <div
                    key={participant}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full border border-purple-200"
                  >
                    <User className="h-3 w-3 text-purple-600" />
                    <span className="text-sm text-purple-700">{participant}</span>
                    <button
                      onClick={() => handleRemoveParticipant(participant)}
                      className="text-purple-400 hover:text-purple-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {showMemberSelect ? (
                  <div className="flex gap-1">
                    <Select onValueChange={handleAddParticipant}>
                      <SelectTrigger className="w-[150px] h-8">
                        <SelectValue placeholder="멤버 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMembers.map((member) => (
                          <SelectItem key={member} value={member}>
                            {member}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowMemberSelect(false)}
                    >
                      취소
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowMemberSelect(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    참여자 추가
                  </Button>
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
                <Label className="text-base font-semibold">Cooperation</Label>
              </div>
              <div className="text-sm text-gray-600">
                {checklistProgress}%
              </div>
            </div>

            {/* 체크리스트 항목들 */}
            <div className="space-y-2">
              {checklistItems
                .sort((a, b) => a.order - b.order)
                .map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => handleToggleChecklistItem(item.id)}
                    onUpdate={(updates) => handleUpdateChecklistItem(item.id, updates)}
                    onDelete={() => handleDeleteChecklistItem(item.id)}
                    availableMembers={availableMembers}
                  />
                ))}

              {/* 새 항목 추가 */}
              <AddChecklistItemInput onAdd={handleAddChecklistItem} />
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
  availableMembers,
}: {
  item: ChecklistItem;
  onToggle: () => void;
  onUpdate: (updates: Partial<ChecklistItem>) => void;
  onDelete: () => void;
  availableMembers: string[];
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
    item.dueDate && new Date(item.dueDate) < new Date() && !item.isCompleted;
  const isDueSoon =
    item.dueDate &&
    new Date(item.dueDate).getTime() - new Date().getTime() < 86400000 &&
    !item.isCompleted;

  return (
    <div className="group flex items-start gap-2 p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200">
      {/* 체크박스 */}
      <button
        onClick={onToggle}
        className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
          item.isCompleted ? 'bg-green-500' : 'bg-gray-300 hover:bg-gray-400'
        }`}
      >
        {item.isCompleted && (
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
              item.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
            }`}
            onClick={() => setIsEditing(true)}
          >
            {item.title}
          </div>
        )}

        {/* 메타 정보 */}
        <div className="flex items-center gap-2 mt-1">
          {item.dueDate && (
            <div
              className={`flex items-center gap-1 text-xs ${
                isOverdue
                  ? 'text-red-600'
                  : isDueSoon
                  ? 'text-orange-600'
                  : 'text-gray-500'
              }`}
            >
              <Clock className="h-3 w-3" />
              {new Date(item.dueDate).toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
              })}
            </div>
          )}
          {item.assignee && (
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
                {item.assignee.charAt(0).toUpperCase()}
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
            <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg p-2 z-10 min-w-[150px]">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 px-2 py-1">
                  마감일
                </div>
                <Input
                  type="date"
                  value={item.dueDate || ''}
                  onChange={(e) => onUpdate({ dueDate: e.target.value })}
                  className="text-xs h-7"
                />
                <div className="text-xs font-semibold text-gray-500 px-2 py-1 mt-2">
                  담당자
                </div>
                <Select
                  value={item.assignee || 'none'}
                  onValueChange={(value) => onUpdate({ assignee: value === 'none' ? undefined : value })}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="없음" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-xs">없음</span>
                    </SelectItem>
                    {availableMembers.map((member) => (
                      <SelectItem key={member} value={member}>
                        <span className="text-xs">{member}</span>
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
function AddChecklistItemInput({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value);
      setValue('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      setValue('');
      setIsAdding(false);
    }
  };

  if (!isAdding) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-gray-600 hover:bg-gray-100"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add an item
      </Button>
    );
  }

  return (
    <div className="flex gap-2 p-2">
      <div className="w-4 h-4 rounded bg-gray-200 flex-shrink-0 mt-0.5" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (!value.trim()) {
            setIsAdding(false);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder="항목 입력..."
        className="flex-1 text-xs h-7"
        autoFocus
      />
      <Button size="sm" onClick={handleAdd} className="h-7">
        추가
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setValue('');
          setIsAdding(false);
        }}
        className="h-7"
      >
        취소
      </Button>
    </div>
  );
}