import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Board } from '../../types';

const GRADIENTS = [
  'linear-gradient(135deg, #6366F1 0%, #a855f7 100%)',
  'linear-gradient(135deg, #2DD4BF 0%, #0891B2 100%)',
  'linear-gradient(135deg, #F43F5E 0%, #FB923C 100%)',
  'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  'linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)',
];

// boardId를 기반으로 그라데이션 선택 (BoardCard와 동일한 로직)
function getGradient(boardId: string): string {
  let hash = 0;
  for (let i = 0; i < boardId.length; i++) {
    hash = boardId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

interface EditBoardModalProps {
  isOpen: boolean;
  board: Board | null;
  onClose: () => void;
  onUpdate: (boardId: string, name: string, description?: string) => void;
}

export function EditBoardModal({ isOpen, board, onClose, onUpdate }: EditBoardModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // 보드 데이터로 초기화
  useEffect(() => {
    if (board) {
      setName(board.name);
      setDescription(board.description || '');
    }
  }, [board]);

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  const handleUpdate = () => {
    if (name.trim() && board) {
      onUpdate(board.id, name.trim(), description.trim() || undefined);
      handleClose();
    }
  };

  if (!isOpen || !board) return null;

  const gradient = getGradient(board.id);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-bridge-obsidian rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        >
          {/* Preview Section */}
          <div
            className="h-32 w-full flex items-end p-6 relative overflow-hidden"
            style={{ background: gradient }}
          >
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <h3 className="text-xl font-bold text-white drop-shadow-md truncate relative z-10">
              {name || board.name}
            </h3>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">보드 수정</h2>
              <button
                onClick={handleClose}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Board Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Board Name <span className="text-rose-500">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="보드 이름을 입력하세요"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-bridge-accent focus:ring-2 focus:ring-bridge-accent/20 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      handleUpdate();
                    }
                  }}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="보드에 대한 간단한 설명 (선택)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-bridge-accent focus:ring-2 focus:ring-bridge-accent/20 transition-all resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleClose}
                className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors border border-white/10 rounded-xl hover:bg-white/5"
              >
                취소
              </button>
              <button
                disabled={!name.trim()}
                onClick={handleUpdate}
                className="flex-[2] py-3 bg-gradient-to-r from-bridge-accent to-purple-500 text-sm font-bold rounded-xl shadow-lg shadow-bridge-accent/20 disabled:opacity-50 disabled:grayscale hover:shadow-bridge-accent/40 transition-all"
              >
                저장
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
