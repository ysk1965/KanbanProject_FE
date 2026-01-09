import { Feature, Task } from '../types';
import { Progress } from './ui/progress';
import { Calendar, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from './ui/badge';
import { useState } from 'react';

interface FeatureCardProps {
  feature: Feature;
  onClick?: () => void;
  availableTags?: Array<{ id: string; name: string; color: string }>;
  tasks?: Task[]; // 서브태스크 목록
}

const priorityColors: Record<string, string> = {
  HIGH: 'bg-red-100 border-red-300 text-red-700',
  MEDIUM: 'bg-yellow-100 border-yellow-300 text-yellow-700',
  LOW: 'bg-green-100 border-green-300 text-green-700',
};

const priorityLabels: Record<string, string> = {
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
};

export function FeatureCard({ feature, onClick, availableTags = [], tasks = [] }: FeatureCardProps) {
  const progressPercent = feature.progress_percentage;

  const featureTags = feature.tags || [];
  
  // Feature 색상 (기본값: 보라색)
  const featureColor = feature.color || '#8B5CF6';

  const [isExpanded, setIsExpanded] = useState(false);

  // 확장 버튼 클릭 핸들러
  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모의 onClick 이벤트 방지
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className="bg-white rounded-lg p-4 border-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      style={{ borderColor: featureColor }}
      onClick={onClick}
    >
      {/* 제목 */}
      <div className="flex items-start gap-2 mb-3">
        <div 
          className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
          style={{ backgroundColor: featureColor }}
        />
        <h4 className="font-semibold text-gray-900 flex-1 break-words">
          {feature.title}
        </h4>
      </div>

      {/* 태그 표시 */}
      {featureTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {featureTags.map((tag) => (
            <Badge
              key={tag.id}
              style={{ backgroundColor: tag.color }}
              className="text-white text-xs"
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* 진행률 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">
            {feature.completed_tasks}/{feature.total_tasks} 완료
          </span>
          <span className="text-xs font-semibold text-purple-600">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* 추가 정보 */}
      <div className="flex items-center gap-2 flex-wrap">
        {feature.priority && (
          <span
            className={`text-xs px-2 py-1 rounded-full border ${
              priorityColors[feature.priority]
            }`}
          >
            <AlertCircle className="h-3 w-3 inline mr-1" />
            {priorityLabels[feature.priority]}
          </span>
        )}
        {feature.due_date && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {feature.due_date}
          </span>
        )}
      </div>

      {/* 담당자 */}
      {feature.assignee && (
        <div className="mt-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white">
            {feature.assignee.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-gray-600">{feature.assignee.name}</span>
        </div>
      )}

      {/* 서브태스크 목록 */}
      {tasks.length > 0 && (
        <div className="mt-4">
          <div
            className="flex items-center gap-2 cursor-pointer hover:text-gray-700"
            onClick={handleExpandClick}
          >
            <span className="text-xs text-gray-500">
              서브태스크
            </span>
            {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
          </div>
          {isExpanded && (
            <div className="mt-2 space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-2 p-2 rounded bg-gray-50 hover:bg-gray-100">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${task.is_completed ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    {task.is_completed && (
                      <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-xs block ${task.is_completed ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}
                    >
                      {task.title}
                    </span>
                    <span className="text-xs text-gray-400">
                      {task.block_name || task.block_id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}