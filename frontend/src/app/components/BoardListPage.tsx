import { useState } from 'react';
import { Star, Plus, Users } from 'lucide-react';
import { CreateBoardModal } from './CreateBoardModal';
import type { Board } from '../types';

interface BoardListPageProps {
  boards: Board[];
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: (name: string, description?: string) => void;
  onToggleStar: (boardId: string) => void;
}

// 보드 색상 gradient 생성
const BOARD_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
];

function getBoardGradient(boardId: string): string {
  // boardId 해시로 일관된 색상 선택
  const hash = boardId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return BOARD_GRADIENTS[hash % BOARD_GRADIENTS.length];
}

export function BoardListPage({
  boards,
  onSelectBoard,
  onCreateBoard,
  onToggleStar,
}: BoardListPageProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const starredBoards = boards.filter((b) => b.is_starred);

  return (
    <div className="min-h-screen bg-[#1d2125] text-white">
      {/* 헤더 */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-600 rounded flex items-center justify-center">
              <span className="text-2xl font-bold text-white">K</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold">Kanban Workspace</h1>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px]">
                  Premium
                </span>
                <span className="flex items-center gap-1">
                  Private
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 즐겨찾기한 보드 */}
        {starredBoards.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-4 w-4 text-white" />
              <h2 className="text-base font-semibold text-white">
                Starred boards
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {starredBoards.map((board) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  onClick={() => onSelectBoard(board.id)}
                  onToggleStar={() => onToggleStar(board.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* 내 보드 */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-white" />
            <h2 className="text-base font-semibold text-white">Your boards</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onClick={() => onSelectBoard(board.id)}
                onToggleStar={() => onToggleStar(board.id)}
              />
            ))}

            {/* 새 보드 생성 카드 */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="h-24 bg-[#282e33] hover:bg-[#2c3339] rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-gray-300 transition-colors"
            >
              <Plus className="h-6 w-6 mb-1" />
              <span className="text-sm">Create new board</span>
            </button>
          </div>
        </section>
      </main>

      {/* 새 보드 생성 모달 */}
      <CreateBoardModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateBoard={(name, description) => {
          onCreateBoard(name, description);
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}

interface BoardCardProps {
  board: Board;
  onClick: () => void;
  onToggleStar: () => void;
}

function BoardCard({ board, onClick, onToggleStar }: BoardCardProps) {
  return (
    <div
      className="relative h-24 rounded-lg overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {/* 배경 그라데이션 */}
      <div
        className="absolute inset-0"
        style={{ background: getBoardGradient(board.id) }}
      />

      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

      {/* 별표 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar();
        }}
        className="absolute top-2 right-2 p-1 rounded hover:bg-black/20 transition-colors z-10"
      >
        <Star
          className={`h-4 w-4 ${
            board.is_starred
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-white/70 hover:text-white'
          }`}
        />
      </button>

      {/* 보드 이름 */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="font-semibold text-white text-sm mb-1">{board.name}</h3>
        {board.member_count > 0 && (
          <div className="flex items-center gap-1 text-xs text-white/70">
            <Users className="h-3 w-3" />
            <span>{board.member_count} members</span>
          </div>
        )}
      </div>
    </div>
  );
}
