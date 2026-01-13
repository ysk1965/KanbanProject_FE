
import React, { useState } from 'react';
import { Feature, Priority, Task } from '../../types';
import { X, Trash2, ChevronDown, Calendar, Plus, ChevronRight, ClipboardList, CheckCircle2 } from 'lucide-react';

interface FeatureDetailModalProps {
  feature: Feature;
  tasks: Task[];
  onClose: () => void;
}

const COLORS = [
  '#A855F7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

const FeatureDetailModal: React.FC<FeatureDetailModalProps> = ({ feature, tasks, onClose }) => {
  const [selectedColor, setSelectedColor] = useState(feature.color);
  const featureTasks = tasks.filter(t => t.featureId === feature.id);
  const completedCount = featureTasks.filter(t => t.completed || t.blockId === 'done').length;
  const totalCount = featureTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-[#0f0f12] text-zinc-300 rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/2">
          <div className="flex items-center gap-3 flex-1">
            <div 
              className="w-5 h-5 rounded-md shadow-lg flex-shrink-0 transition-all duration-300" 
              style={{ 
                backgroundColor: selectedColor, 
                boxShadow: `0 0 15px ${selectedColor}88`,
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            ></div>
            <input 
              type="text" 
              defaultValue={feature.title}
              className="text-lg font-bold bg-transparent border-none focus:outline-none rounded w-full text-white placeholder-zinc-600"
            />
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
              <Trash2 size={18} />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Description Module */}
          <section>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">설명</label>
            <textarea 
              placeholder="FEATURE 설명을 입력하세요..."
              defaultValue={feature.description}
              className="w-full min-h-[100px] bg-[#050507] border border-white/5 rounded-xl p-4 text-zinc-300 focus:outline-none focus:border-indigo-500/50 transition-all resize-none text-sm leading-relaxed"
            />
          </section>

          {/* Core Specs Grid */}
          <div className="grid grid-cols-2 gap-6">
            <section>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">우선순위</label>
              <div className="relative">
                <select className="w-full bg-[#16161a] border border-white/5 rounded-lg px-4 py-2.5 appearance-none focus:outline-none focus:border-indigo-500/50 text-xs font-bold text-zinc-200">
                  <option className="bg-[#0f0f12]">🔴 높음</option>
                  <option className="bg-[#0f0f12]">🟡 보통</option>
                  <option className="bg-[#0f0f12]">🔵 낮음</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={14} />
              </div>
            </section>
            <section>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">마감일</label>
              <div className="relative">
                <input 
                  type="text" 
                  defaultValue="2026. 01. 20."
                  className="w-full bg-[#16161a] border border-white/5 rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500/50 text-xs font-bold text-zinc-200"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
              </div>
            </section>
          </div>

          {/* Spectrum Selection */}
          <section>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">FEATURE 색상</label>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map(color => (
                <button 
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full transition-all duration-300 ${
                    selectedColor === color 
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f0f12] scale-110' 
                    : 'opacity-40 hover:opacity-100 hover:scale-110'
                  }`}
                  style={{ 
                    backgroundColor: color,
                    boxShadow: selectedColor === color ? `0 0 15px ${color}` : 'none'
                  }}
                />
              ))}
            </div>
          </section>

          {/* Subtask Module (Sharp Tech Style) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <ClipboardList size={14} className="text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">서브태스크 리스트</span>
              </div>
              <span className="text-[11px] font-bold text-indigo-400 tabular-nums">{completedCount}/{totalCount} 완료</span>
            </div>

            <div className="bg-[#0a0a0c] border border-white/5 rounded-xl overflow-hidden">
              <div className="p-5">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="mt-2 text-right">
                  <span className="text-[9px] font-black text-zinc-600 tracking-tighter uppercase">{progressPercent}% PROGRESS</span>
                </div>
              </div>

              {/* Task Entries */}
              <div className="border-t border-white/5 divide-y divide-white/5">
                {featureTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: selectedColor, boxShadow: `0 0 8px ${selectedColor}44` }}></div>
                      <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600">
                      <span className="tracking-widest group-hover:text-indigo-400 transition-colors">
                        → {task.blockId.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Add Dock */}
              <div className="bg-white/[0.02] p-2 flex gap-2 border-t border-white/5">
                <input 
                  type="text" 
                  placeholder="새 서브태스크 추가..."
                  className="flex-1 bg-transparent border-none rounded-lg px-3 py-2 text-xs focus:outline-none text-zinc-300"
                />
                <button className="px-4 py-2 bg-indigo-600/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-500/20 hover:bg-indigo-600/20 hover:text-white transition-all active:scale-95">
                  ADD
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-5 border-t border-white/5 bg-white/2 flex justify-end items-center gap-4">
          <button onClick={onClose} className="text-[11px] font-bold text-zinc-500 hover:text-white transition-all tracking-wider">
            취소
          </button>
          <button className="px-6 py-2.5 bg-white text-black font-black text-[11px] rounded-lg tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-2 active:scale-[0.98]">
            변경사항 저장
            <CheckCircle2 size={14} className="text-indigo-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureDetailModal;
