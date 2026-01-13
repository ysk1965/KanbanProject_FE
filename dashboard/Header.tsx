
import React from 'react';
import { Milestone, ViewType } from '../types';
import { 
  ChevronLeft, 
  Plus, 
  Layout, 
  GanttChart, 
  Calendar, 
  BarChart3, 
  Bell, 
  Filter, 
  Users, 
  Settings,
  ChevronDown,
  Flag
} from 'lucide-react';

interface HeaderProps {
  boardName: string;
  milestones: Milestone[];
  selectedMilestoneId: string;
  onMilestoneChange: (id: string) => void;
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const Header: React.FC<HeaderProps> = ({
  boardName,
  milestones,
  selectedMilestoneId,
  onMilestoneChange,
  activeView,
  onViewChange
}) => {
  return (
    <header className="h-16 border-b border-[#2a2a2f] flex items-center justify-between px-6 bg-[#0f0f12] shrink-0 z-30">
      <div className="flex items-center gap-6">
        <button className="p-2 hover:bg-[#202025] rounded-lg transition-colors">
          <ChevronLeft size={18} />
        </button>
        
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight text-white">{boardName}</h1>
          <div className="flex items-center gap-2 bg-[#1a1a1f] px-3 py-1.5 rounded-md border border-[#2a2a2f] hover:border-indigo-500/50 cursor-pointer transition-all">
            <Flag size={14} className="text-indigo-400" />
            <select 
              value={selectedMilestoneId}
              onChange={(e) => onMilestoneChange(e.target.value)}
              className="bg-transparent text-xs font-medium focus:outline-none appearance-none cursor-pointer"
            >
              {milestones.map(m => (
                <option key={m.id} value={m.id} className="bg-[#1a1a1f]">{m.title}</option>
              ))}
            </select>
            <ChevronDown size={14} className="text-zinc-500" />
          </div>
          <button className="p-1.5 hover:text-white text-zinc-400 transition-colors">
            <Plus size={18} />
          </button>
        </div>
      </div>

      <nav className="flex items-center gap-1 bg-[#1a1a1f] p-1 rounded-xl border border-[#2a2a2f]">
        {[
          { id: 'kanban', label: '칸반보드', icon: Layout },
          { id: 'gantt', label: '간트차트', icon: GanttChart },
          { id: 'daily', label: '데일리스케줄', icon: Calendar },
          { id: 'stats', label: '통계', icon: BarChart3 },
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id as ViewType)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === view.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#2a2a2f]'
            }`}
          >
            <view.icon size={14} />
            {view.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 border-r border-[#2a2a2f] pr-3 mr-1">
          <HeaderAction icon={Bell} />
          <HeaderAction icon={Filter} label="필터" />
          <HeaderAction icon={Users} label="팀원" />
          <HeaderAction icon={Settings} />
        </div>
        
        <button className="flex items-center gap-2 pl-2 group">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
            A
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-xs font-bold text-white">Admin</span>
            <span className="text-[10px] text-zinc-500 group-hover:text-indigo-400 transition-colors">Premium</span>
          </div>
          <ChevronDown size={14} className="text-zinc-600" />
        </button>
      </div>
    </header>
  );
};

const HeaderAction: React.FC<{ icon: any; label?: string }> = ({ icon: Icon, label }) => (
  <button className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-[#202025] rounded-lg transition-all">
    <Icon size={18} />
    {label && <span className="text-xs font-semibold">{label}</span>}
  </button>
);

export default Header;
