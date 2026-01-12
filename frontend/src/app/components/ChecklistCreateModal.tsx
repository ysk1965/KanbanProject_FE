import { useState, useEffect, useMemo } from 'react';
import { X, Clock, ChevronDown, Folder, FileText, Loader2, CheckSquare, Check, Layers } from 'lucide-react';
import { Button } from './ui/button';
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[560px] min-h-[700px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">타임블록 추가</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Time/Block Display */}
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="bg-indigo-50 rounded-lg px-4 py-2 flex items-center gap-3">
            {displayMode === 'block' ? (
              <>
                <Layers className="h-4 w-4 text-indigo-600" />
                <span className="text-indigo-700 font-medium text-sm">
                  {startBlockIndex !== undefined && endBlockIndex !== undefined
                    ? startBlockIndex === endBlockIndex
                      ? `${startBlockIndex + 1}번 블록`
                      : `${startBlockIndex + 1}번 ~ ${endBlockIndex + 1}번 블록`
                    : '블록 선택'}
                </span>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 text-indigo-600" />
                <span className="text-indigo-700 font-medium text-sm">
                  {startTime} - {endTime}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Feature Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Folder className="inline h-4 w-4 mr-1 text-yellow-500" />
              Feature
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFeatureDropdownOpen(!isFeatureDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg text-left hover:border-gray-300 transition-colors"
              >
                {isLoadingFeatures ? (
                  <span className="text-gray-400 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </span>
                ) : selectedFeature ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedFeature.color }}
                    />
                    <span className="text-gray-900">{selectedFeature.title}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">Select a feature</span>
                )}
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isFeatureDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFeatureDropdownOpen && !isLoadingFeatures && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-72 overflow-y-auto">
                  {features.length === 0 ? (
                    <div className="px-4 py-3 text-gray-500 text-sm">No features found</div>
                  ) : (
                    features.map((feature) => (
                      <button
                        key={feature.id}
                        onClick={() => {
                          setSelectedFeatureId(feature.id);
                          setIsFeatureDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 ${
                          feature.id === selectedFeatureId ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: feature.color }}
                        />
                        <span className="text-gray-900">{feature.title}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Task Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline h-4 w-4 mr-1 text-blue-500" />
              Task
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => selectedFeatureId && setIsTaskDropdownOpen(!isTaskDropdownOpen)}
                disabled={!selectedFeatureId}
                className={`w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg text-left transition-colors ${
                  !selectedFeatureId ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-300'
                }`}
              >
                {isLoadingTasks ? (
                  <span className="text-gray-400 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </span>
                ) : selectedTask ? (
                  <span className="text-gray-900">{selectedTask.title}</span>
                ) : (
                  <span className="text-gray-400">
                    {selectedFeatureId ? 'Select a task' : 'Select a feature first'}
                  </span>
                )}
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isTaskDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isTaskDropdownOpen && !isLoadingTasks && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-72 overflow-y-auto">
                  {tasks.length === 0 ? (
                    <div className="px-4 py-3 text-gray-500 text-sm">No tasks found</div>
                  ) : (
                    tasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => {
                          setSelectedTaskId(task.id);
                          setIsTaskDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 ${
                          task.id === selectedTaskId ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <span className="text-gray-900">{task.title}</span>
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
                <label className="block text-sm font-medium text-gray-700">
                  <CheckSquare className="inline h-4 w-4 mr-1 text-purple-500" />
                  기존 체크리스트에서 선택
                </label>
                {checklistItems.filter(i => !i.completed).length > 0 && (
                  <span className="text-xs text-gray-400">클릭하여 선택</span>
                )}
              </div>
              <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                {isLoadingChecklist ? (
                  <div className="px-4 py-3 text-gray-400 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : checklistItems.filter(i => !i.completed).length === 0 ? (
                  <div className="px-4 py-3 text-gray-500 text-sm text-center">
                    선택 가능한 체크리스트가 없습니다
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {checklistItems.filter(i => !i.completed).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onSelectExisting(item.id)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-indigo-50 transition-colors text-left"
                      >
                        <div className="w-4 h-4 rounded border border-gray-300 flex-shrink-0" />
                        <span className="text-sm text-gray-700 flex-1">{item.title}</span>
                        <span className="text-xs text-indigo-500">선택</span>
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
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400">또는 새로 생성</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
          )}

          {/* 새 체크리스트 생성 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              새 체크리스트 항목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="새 체크리스트 제목 입력"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
