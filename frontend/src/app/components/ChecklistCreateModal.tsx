import { useState, useEffect, useMemo } from 'react';
import { X, Clock, ChevronDown, Folder, FileText, Loader2, CheckSquare, Layers } from 'lucide-react';
import { featureAPI, taskAPI, checklistAPI, FeatureResponse, TaskResponse, ChecklistItemResponse } from '../utils/api';

interface ChecklistCreateModalProps {
  boardId: string;
  assigneeId: string;
  startTime: string;
  endTime: string;
  displayMode: 'time' | 'block';
  startBlockIndex?: number;
  endBlockIndex?: number;
  onCreate: (taskId: string, title: string) => void;
  onSelectExisting: (checklistItemId: string) => void;
  onClose: () => void;
}

export function ChecklistCreateModal({
  boardId,
  assigneeId,
  startTime,
  endTime,
  displayMode,
  startBlockIndex,
  endBlockIndex,
  onCreate,
  onSelectExisting,
  onClose,
}: ChecklistCreateModalProps) {
  const [features, setFeatures] = useState<FeatureResponse[]>([]);
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemResponse[]>([]);
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);

  const [selectedFeatureId, setSelectedFeatureId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [title, setTitle] = useState('');

  const [isFeatureDropdownOpen, setIsFeatureDropdownOpen] = useState(false);
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feature 목록 로드
  useEffect(() => {
    const loadFeatures = async () => {
      setIsLoadingFeatures(true);
      try {
        const response = await featureAPI.getFeatures(boardId);
        setFeatures(response.features);
      } catch (error) {
        console.error('Failed to load features:', error);
      } finally {
        setIsLoadingFeatures(false);
      }
    };
    loadFeatures();
  }, [boardId]);

  // Feature 선택 시 Task 목록 로드
  useEffect(() => {
    if (!selectedFeatureId) {
      setTasks([]);
      setSelectedTaskId('');
      return;
    }

    const loadTasks = async () => {
      setIsLoadingTasks(true);
      try {
        const response = await taskAPI.getTasks(boardId, { feature_id: selectedFeatureId });
        setTasks(response.tasks);
        setSelectedTaskId('');
      } catch (error) {
        console.error('Failed to load tasks:', error);
      } finally {
        setIsLoadingTasks(false);
      }
    };
    loadTasks();
  }, [boardId, selectedFeatureId]);

  // Task 선택 시 체크리스트 항목 로드
  useEffect(() => {
    if (!selectedTaskId) {
      setChecklistItems([]);
      return;
    }

    const loadChecklist = async () => {
      setIsLoadingChecklist(true);
      try {
        const response = await checklistAPI.getChecklist(boardId, selectedTaskId);
        setChecklistItems(response.items);
      } catch (error) {
        console.error('Failed to load checklist:', error);
      } finally {
        setIsLoadingChecklist(false);
      }
    };
    loadChecklist();
  }, [boardId, selectedTaskId]);

  const selectedFeature = useMemo(
    () => features.find((f) => f.id === selectedFeatureId),
    [features, selectedFeatureId]
  );

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId),
    [tasks, selectedTaskId]
  );

  const canSubmit = selectedTaskId && title.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      onCreate(selectedTaskId, title.trim());
    } catch (error) {
      console.error('Failed to create checklist item:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-bridge-obsidian rounded-2xl shadow-2xl w-[560px] min-h-[700px] max-h-[90vh] flex flex-col overflow-hidden border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">타임블록 추가</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Time/Block Display */}
        <div className="px-6 py-3 border-b border-white/5">
          <div className="bg-bridge-accent/20 rounded-xl px-4 py-2.5 flex items-center gap-3 border border-bridge-accent/30">
            {displayMode === 'block' ? (
              <>
                <Layers className="h-4 w-4 text-bridge-accent" />
                <span className="text-bridge-accent font-medium text-sm">
                  {startBlockIndex !== undefined && endBlockIndex !== undefined
                    ? startBlockIndex === endBlockIndex
                      ? `${startBlockIndex + 1}번 블록`
                      : `${startBlockIndex + 1}번 ~ ${endBlockIndex + 1}번 블록`
                    : '블록 선택'}
                </span>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 text-bridge-accent" />
                <span className="text-bridge-accent font-medium text-sm">
                  {startTime} - {endTime}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Feature Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              <Folder className="inline h-4 w-4 mr-1 text-amber-500" />
              Feature
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFeatureDropdownOpen(!isFeatureDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-left hover:border-white/20 transition-colors"
              >
                {isLoadingFeatures ? (
                  <span className="text-slate-500 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </span>
                ) : selectedFeature ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedFeature.color }}
                    />
                    <span className="text-white">{selectedFeature.title}</span>
                  </div>
                ) : (
                  <span className="text-slate-500">Select a feature</span>
                )}
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isFeatureDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFeatureDropdownOpen && !isLoadingFeatures && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-bridge-obsidian border border-white/10 rounded-xl shadow-xl z-10 max-h-72 overflow-y-auto">
                  {features.length === 0 ? (
                    <div className="px-4 py-3 text-slate-500 text-sm">No features found</div>
                  ) : (
                    features.map((feature) => (
                      <button
                        key={feature.id}
                        onClick={() => {
                          setSelectedFeatureId(feature.id);
                          setIsFeatureDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                          feature.id === selectedFeatureId ? 'bg-bridge-accent/20' : ''
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: feature.color }}
                        />
                        <span className="text-white">{feature.title}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Task Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              <FileText className="inline h-4 w-4 mr-1 text-bridge-accent" />
              Task
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => selectedFeatureId && setIsTaskDropdownOpen(!isTaskDropdownOpen)}
                disabled={!selectedFeatureId}
                className={`w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-left transition-colors ${
                  !selectedFeatureId ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/20'
                }`}
              >
                {isLoadingTasks ? (
                  <span className="text-slate-500 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </span>
                ) : selectedTask ? (
                  <span className="text-white">{selectedTask.title}</span>
                ) : (
                  <span className="text-slate-500">
                    {selectedFeatureId ? 'Select a task' : 'Select a feature first'}
                  </span>
                )}
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isTaskDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isTaskDropdownOpen && !isLoadingTasks && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-bridge-obsidian border border-white/10 rounded-xl shadow-xl z-10 max-h-72 overflow-y-auto">
                  {tasks.length === 0 ? (
                    <div className="px-4 py-3 text-slate-500 text-sm">No tasks found</div>
                  ) : (
                    tasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => {
                          setSelectedTaskId(task.id);
                          setIsTaskDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                          task.id === selectedTaskId ? 'bg-bridge-accent/20' : ''
                        }`}
                      >
                        <span className="text-white">{task.title}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 기존 체크리스트에서 선택 */}
          {selectedTaskId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <CheckSquare className="inline h-4 w-4 mr-1 text-purple-400" />
                  기존 체크리스트에서 선택
                </label>
                {checklistItems.filter(i => !i.completed).length > 0 && (
                  <span className="text-xs text-slate-500">클릭하여 선택</span>
                )}
              </div>
              <div className="border border-white/10 rounded-xl max-h-48 overflow-y-auto bg-white/5">
                {isLoadingChecklist ? (
                  <div className="px-4 py-3 text-slate-500 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : checklistItems.filter(i => !i.completed).length === 0 ? (
                  <div className="px-4 py-3 text-slate-500 text-sm text-center">
                    선택 가능한 체크리스트가 없습니다
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {checklistItems.filter(i => !i.completed).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onSelectExisting(item.id)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-bridge-accent/10 transition-colors text-left"
                      >
                        <div className="w-4 h-4 rounded border border-white/20 flex-shrink-0" />
                        <span className="text-sm text-slate-300 flex-1">{item.title}</span>
                        <span className="text-xs text-bridge-accent font-medium">선택</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 구분선 */}
          {selectedTaskId && checklistItems.filter(i => !i.completed).length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-white/10" />
              <span className="text-xs text-slate-500">또는 새로 생성</span>
              <div className="flex-1 border-t border-white/10" />
            </div>
          )}

          {/* 새 체크리스트 생성 */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              새 체크리스트 항목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="새 체크리스트 제목 입력"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-bridge-accent/50 focus:border-bridge-accent transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors border border-white/10 rounded-xl hover:bg-white/5"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="flex-1 py-3 bg-gradient-to-r from-bridge-accent to-purple-500 text-sm font-bold text-white rounded-xl shadow-lg shadow-bridge-accent/20 disabled:opacity-50 disabled:grayscale hover:shadow-bridge-accent/40 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : (
              '생성'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
