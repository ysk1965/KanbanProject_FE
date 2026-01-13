
import React from 'react';
import { Feature, Priority } from '../../types';
import { Calendar, ChevronRight, AlertCircle } from 'lucide-react';

interface FeatureCardProps {
  feature: Feature;
  onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, onClick }) => {
  const priorityInfo = {
    [Priority.HIGH]: { color: 'text-red-400', bg: 'bg-red-500/10', label: '높음' },
    [Priority.MEDIUM]: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: '보통' },
    [Priority.LOW]: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: '낮음' },
  };

  const p = priorityInfo[feature.priority];

  return (
    <div 
      onClick={onClick}
      className="group relative bg-[#16161a] rounded-2xl border border-[#2a2a2f] p-5 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-pointer overflow-hidden"
    >
      <div 
        className="absolute top-0 left-0 bottom-0 w-1.5" 
        style={{ backgroundColor: feature.color }}
      />

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: feature.color }}></div>
            <h3 className="font-bold text-white text-[15px] group-hover:text-indigo-400 transition-colors">
              {feature.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 bg-[#1a1a1f] px-2 py-0.5 rounded-md border border-[#2a2a2f]">
            <span className="text-[10px] text-indigo-400 font-bold">Sprint 1 - MVP 기능</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-[11px] mb-1.5">
          <span className="text-zinc-500 font-medium">{feature.completedTasks}/{feature.totalTasks} 완료</span>
          <span className="text-white font-bold">{feature.progress}%</span>
        </div>
        <div className="h-1.5 w-full bg-[#1f1f25] rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-1000 ease-out rounded-full"
            style={{ 
              width: `${feature.progress}%`, 
              backgroundColor: feature.color,
              boxShadow: `0 0 10px ${feature.color}44`
            }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#2a2a2f] pt-4 mt-1">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${p.bg}`}>
            <AlertCircle size={12} className={p.color} />
            <span className={`text-[10px] font-bold ${p.color}`}>{p.label}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Calendar size={12} />
            <span className="text-[10px] font-medium">{feature.dueDate}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 group/sub">
          <span className="text-[10px] font-bold text-zinc-400 group-hover/sub:text-white">서브태스크</span>
          <ChevronRight size={14} className="text-zinc-600 group-hover/sub:text-white transition-all" />
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;
