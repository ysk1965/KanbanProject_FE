import { useState, useEffect } from 'react';
import { Feature, Task, Tag, Priority } from '../types';
import { FEATURE_COLORS } from '../App';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Plus, Check, ArrowRight, X, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface FeatureDetailModalProps {
  feature: Feature | null;
  tasks: Task[];
  blocks: Array<{ id: string; name: string }>;
  open: boolean;
  onClose: () => void;
  onAddSubtask: (title: string) => void;
  onUpdateFeature: (feature: Partial<Feature>) => void;
  onDelete: (featureId: string) => void;
  availableTags: Tag[];
  onCreateTag: (name: string, color: string) => void;
  availableMembers: string[];
}

export function FeatureDetailModal({
  feature,
  tasks,
  blocks,
  open,
  onClose,
  onAddSubtask,
  onUpdateFeature,
  onDelete,
  availableTags,
  onCreateTag,
  availableMembers,
}: FeatureDetailModalProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // 변경사항 추적
  const [initialFeature, setInitialFeature] = useState<Feature | null>(null);
  const [editedFeature, setEditedFeature] = useState<Feature | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (feature && open) {
      setInitialFeature(JSON.parse(JSON.stringify(feature)));
      setEditedFeature(JSON.parse(JSON.stringify(feature)));
      setHasChanges(false);
    }
  }, [feature, open]);

  useEffect(() => {
    if (initialFeature && editedFeature) {
      const changed = JSON.stringify(initialFeature) !== JSON.stringify(editedFeature);
      setHasChanges(changed);
    }
  }, [initialFeature, editedFeature]);

  if (!feature || !editedFeature) return null;

  const progressPercent = feature.progress_percentage;

  const handleClose = () => {
    if (hasChanges) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    if (hasChanges && editedFeature) {
      onUpdateFeature(editedFeature);
      setHasChanges(false);
    }
    onClose();
  };

  const handleDiscardAndClose = () => {
    setShowConfirmDialog(false);
    onClose();
  };

  const handleSaveAndClose = () => {
    if (editedFeature) {
      onUpdateFeature(editedFeature);
    }
    setShowConfirmDialog(false);
    onClose();
  };

  const updateEditedFeature = (updates: Partial<Feature>) => {
    setEditedFeature((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      onAddSubtask(newSubtaskTitle.trim());
      setNewSubtaskTitle('');
    }
  };

  const handleAddTag = (tagId: string) => {
    const currentTags = editedFeature.tags || [];
    const tagToAdd = availableTags.find((t) => t.id === tagId);
    if (tagToAdd && !currentTags.some((t) => t.id === tagId)) {
      updateEditedFeature({ tags: [...currentTags, tagToAdd] });
    }
  };

  const handleRemoveTag = (tagId: string) => {
    const currentTags = editedFeature.tags || [];
    updateEditedFeature({ tags: currentTags.filter((t) => t.id !== tagId) });
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

  const getBlockName = (blockId: string) => {
    return blocks.find((b) => b.id === blockId)?.name || blockId;
  };

  const featureTags = editedFeature.tags || [];
  const availableTagsToAdd = availableTags.filter(
    (tag) => !featureTags.some((t) => t.id === tag.id)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" onPointerDownOutside={(e) => {
          if (hasChanges) {
            e.preventDefault();
            handleClose();
          }
        }}>
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <span>🟣</span>
                  <Input
                    value={editedFeature.title}
                    onChange={(e) => updateEditedFeature({ title: e.target.value })}
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
          </DialogHeader>

          <div className="space-y-4">
            {/* 설명 */}
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea
                value={editedFeature.description || ''}
                onChange={(e) => updateEditedFeature({ description: e.target.value })}
                placeholder="Feature 설명을 입력하세요..."
                rows={3}
              />
            </div>

            {/* 우선순위 & 마감일 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>우선순위</Label>
                <Select
                  value={editedFeature.priority || 'MEDIUM'}
                  onValueChange={(value) => updateEditedFeature({ priority: value as Priority })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="설정되지 않음" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        높음
                      </span>
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        보통
                      </span>
                    </SelectItem>
                    <SelectItem value="LOW">
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
                  value={editedFeature.due_date || ''}
                  onChange={(e) => updateEditedFeature({ due_date: e.target.value })}
                />
              </div>
            </div>

            {/* 담당자 */}
            <div className="space-y-2">
              <Label>담당자</Label>
              <div className="flex items-center gap-2">
                {editedFeature.assignee ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
                      {editedFeature.assignee.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm">{editedFeature.assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">담당자 없음</span>
                )}
              </div>
            </div>

            {/* 색상 선택 */}
            <div className="space-y-2">
              <Label>Feature 색상</Label>
              <div className="flex flex-wrap gap-2">
                {FEATURE_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${ editedFeature.color === color
                        ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => updateEditedFeature({ color })}
                  />
                ))}
              </div>
            </div>

            {/* 태그 */}
            <div className="space-y-2">
              <Label>태그</Label>
              <div className="flex flex-wrap gap-2">
                {featureTags.map((tag) => (
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

            {/* 진행률 */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  📋 서브태스크
                </span>
                <span className="text-sm font-semibold text-purple-600">
                  {feature.completed_tasks}/{feature.total_tasks} 완료
                </span>
              </div>
              <Progress value={progressPercent} className="h-2 mb-1" />
              <p className="text-xs text-gray-500 text-right">
                {Math.round(progressPercent)}%
              </p>
            </div>

            {/* 서브태스크 목록 */}
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    task.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {task.completed ? (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        task.completed
                          ? 'line-through text-gray-500'
                          : 'text-gray-900'
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.assignee && (
                      <p className="text-xs text-gray-500 mt-1">
                        @{task.assignee.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <ArrowRight className="h-3 w-3" />
                    <span className="font-medium">
                      {getBlockName(task.block_id)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 서브태스크 추가 */}
            <div className="flex gap-2">
              <Input
                placeholder="새 서브태스크 제목..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddSubtask();
                  }
                }}
              />
              <Button onClick={handleAddSubtask}>
                <Plus className="h-4 w-4 mr-1" />
                추가
              </Button>
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
            <AlertDialogTitle>이 기능을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 기능은 삭제되면 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(feature.id);
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