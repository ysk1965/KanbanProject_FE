import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Columns, Calendar, Clock, CheckCircle2, TrendingDown } from 'lucide-react';

// --- PRICE COMPARISON DIAGRAM ---
export const PriceComparisonDiagram: React.FC = () => {
  return (
    <div className="flex flex-col p-10 bg-bridge-obsidian rounded-[2.5rem] border border-white/10 shadow-2xl w-full text-stone-100 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8">
        <TrendingDown size={40} className="text-bridge-secondary opacity-20" />
      </div>
      <h3 className="font-serif text-2xl mb-12 text-white flex items-center gap-3">
        Cost Comparison (Annual)
      </h3>

      <div className="space-y-12">
        {[
          { name: 'Flow', cost: 72, color: 'bg-stone-700' },
          { name: 'Trello', cost: 60, color: 'bg-stone-600' },
          { name: 'BRIDGE', cost: 50, color: 'bg-bridge-secondary', highlight: true },
        ].map((item, i) => (
          <div key={i} className="space-y-3">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
              <span className={item.highlight ? 'text-bridge-secondary' : 'text-slate-500'}>{item.name}</span>
              <span className={item.highlight ? 'text-white' : 'text-slate-500'}>${item.cost} / Year</span>
            </div>
            <div className="h-4 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(item.cost / 80) * 100}%` }}
                transition={{ duration: 1.5, delay: i * 0.2, ease: "circOut" }}
                className={`h-full rounded-full ${item.color} ${item.highlight ? 'shadow-[0_0_20px_rgba(45,212,191,0.4)]' : ''}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 bg-bridge-secondary/5 rounded-2xl border border-bridge-secondary/10 text-center">
        <p className="text-sm text-bridge-secondary font-medium italic">"BRIDGE saves teams up to 60% compared to leading competitors."</p>
      </div>
    </div>
  );
};

// --- KANBAN BOARD DIAGRAM ---
export const KanbanDiagram: React.FC = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'DB Architecture', status: 'Task', color: 'bg-stone-700' },
    { id: 2, title: 'API Flow', status: 'In Progress', color: 'bg-indigo-600' },
    { id: 3, title: 'Validation', status: 'Review', color: 'bg-teal-600' },
    { id: 4, title: 'Landing UI', status: 'Done', color: 'bg-bridge-secondary' },
  ]);

  const moveTask = (id: number) => {
    const statuses = ['Task', 'In Progress', 'Review', 'Done'];
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextIdx = (statuses.indexOf(t.status) + 1) % statuses.length;
        return { ...t, status: statuses[nextIdx] };
      }
      return t;
    }));
  };

  return (
    <div className="flex flex-col items-center p-8 bg-bridge-obsidian rounded-2xl border border-white/5 shadow-2xl w-full">
      <h3 className="font-serif text-xl mb-6 text-white flex items-center gap-3">
        <Columns size={20} className="text-bridge-accent" />
        Intelligent Workflow
      </h3>

      <div className="grid grid-cols-4 gap-3 w-full">
        {['Task', 'In Progress', 'Review', 'Done'].map(status => (
          <div key={status} className="flex flex-col gap-3 min-h-[180px] bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-500 text-center">{status}</span>
            <AnimatePresence mode="popLayout">
              {tasks.filter(t => t.status === status).map(task => (
                <motion.div
                  key={task.id}
                  layoutId={String(task.id)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => moveTask(task.id)}
                  className={`p-3 rounded-lg shadow-lg border border-white/10 cursor-pointer ${task.color} text-white text-[10px] font-medium hover:brightness-110 transition-all flex justify-between items-center`}
                >
                  <span className="truncate pr-1">{task.title}</span>
                  {status === 'Done' && <CheckCircle2 size={10} className="flex-shrink-0" />}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>
      <p className="mt-6 text-[10px] text-stone-600 tracking-wider uppercase font-bold">Progress cards with a single click</p>
    </div>
  );
};

// --- GANTT CHART DIAGRAM ---
export const GanttDiagram: React.FC = () => {
  return (
    <div className="flex flex-col p-8 bg-bridge-dark rounded-2xl border border-white/10 shadow-2xl w-full text-stone-100 overflow-hidden">
      <h3 className="font-serif text-xl mb-8 text-bridge-accent flex items-center gap-3">
        <Calendar size={20} className="text-bridge-secondary" />
        Strategic Roadmap
      </h3>

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-8 gap-1 border-b border-white/5 pb-4">
          <div className="col-span-2 text-[9px] text-stone-600 font-bold uppercase tracking-widest">Sprint Assets</div>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div key={i} className="text-center text-[9px] text-stone-600 font-bold">{day}</div>
          ))}
        </div>

        {[
          { name: 'Auth Bridge', color: 'bg-white/10', start: 0, span: 5, type: 'feature' },
          { name: 'Identity Engine', color: 'bg-indigo-500', start: 1, span: 3, type: 'task' },
          { name: 'Node Security', color: 'bg-bridge-secondary', start: 3, span: 4, type: 'task' },
          { name: 'Fluid Design', color: 'bg-white/10', start: 4, span: 3, type: 'feature' },
        ].map((item, i) => (
          <div key={i} className="grid grid-cols-8 gap-1 items-center">
            <div className={`col-span-2 text-[10px] ${item.type === 'task' ? 'pl-4 text-stone-500' : 'font-bold text-stone-300'}`}>
              {item.type === 'task' ? '— ' : '● '}{item.name}
            </div>
            <div className="col-span-6 h-6 relative bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(item.span / 6) * 100}%`, left: `${(item.start / 6) * 100}%` }}
                transition={{ duration: 1.2, delay: i * 0.15, ease: "circOut" }}
                className={`absolute top-1 bottom-1 rounded-full ${item.color} ${item.type === 'feature' ? 'opacity-40' : 'shadow-[0_0_15px_rgba(99,102,241,0.2)]'}`}
              >
                {item.type === 'task' && <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full opacity-50" />}
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- DAILY SCHEDULE DIAGRAM ---
export const DailyScheduleDiagram: React.FC = () => {
  return (
    <div className="flex flex-col p-8 bg-bridge-obsidian rounded-2xl border border-white/10 shadow-2xl w-full max-w-md mx-auto">
      <h3 className="font-serif text-xl mb-6 text-white flex items-center gap-3">
        <Clock size={20} className="text-bridge-secondary" />
        Daily Temporal Flow
      </h3>

      <div className="flex gap-6">
        <div className="flex flex-col gap-10 text-[9px] text-stone-700 font-bold py-2 tracking-widest">
          <span>09:00</span>
          <span>10:30</span>
          <span>12:00</span>
        </div>
        <div className="flex-1 space-y-3">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            className="h-16 bg-indigo-500/10 border-l-2 border-indigo-500 p-3 rounded-r-lg flex flex-col justify-center"
          >
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Logic Alignment</span>
            <span className="text-[9px] text-indigo-300/60 font-mono">09:00 — 10:15</span>
          </motion.div>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="h-12 bg-white/5 border-l-2 border-stone-700 p-3 rounded-r-lg flex flex-col justify-center"
          >
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Focused Build</span>
            <span className="text-[9px] text-stone-600 font-mono">10:15 — 11:30</span>
          </motion.div>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="h-12 bg-bridge-secondary/10 border-l-2 border-bridge-secondary p-3 rounded-r-lg flex flex-col justify-center"
          >
            <span className="text-[10px] font-bold text-bridge-secondary uppercase tracking-widest mb-1">Unified Review</span>
            <span className="text-[9px] text-bridge-secondary/60 font-mono">11:30 — 12:30</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
