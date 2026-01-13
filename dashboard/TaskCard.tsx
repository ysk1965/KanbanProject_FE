
import React from 'react';
import { Task } from '../../types';
import { Calendar, CheckSquare, GripVertical, ChevronDown } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  featureColor?: string;
  featureTitle?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, featureColor, featureTitle }) => {
  const completedChecklistItems = task.checklist.filter(c => c.completed).length;

  return (
    <div className="group relative bg-[#1a1a1f] rounded-xl border border-[#2a2a2f] p-4 hover:border-zinc-500 transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/5">
      <div className="absolute top-3 left-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical size={14} className="text-zinc-600" />
      </div>

      <div className="mb-3 pl-2">
        <h4 className="text-sm font-semibold text-white mb-2 leading-snug">
          {task.title}
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {featureTitle && (
            <span 
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
              style={{ 
                backgroundColor: `${featureColor}15`, 
                borderColor: `${featureColor}44`,
                color: featureColor 
              }}
            >
              {featureTitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 pl-2">
        <div className="flex items-center gap-1.5 bg-[#202025] px-2 py-1 rounded-md border border-[#2a2a2f]">
          <Calendar size={12} className="text-amber-400" />
          <span className="text-[10px] font-bold text-amber-200">{task.dueDate}</span>
        </div>
        {task.checklist.length > 0 && (
          <div className="flex items-center gap-1.5 text-zinc-400">
            <CheckSquare size={12} />
            <span className="text-[10px] font-semibold">체크리스트 {completedChecklistItems}/{task.checklist.length}</span>
            <ChevronDown size={12} className="text-zinc-600" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[#2a2a2f] pt-3 pl-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white border border-[#2a2a2f] shadow-inner">
            {task.assignee.name.charAt(0)}
          </div>
          <span className="text-[11px] font-medium text-zinc-400">{task.assignee.name}</span>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
