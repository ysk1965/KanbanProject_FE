import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Plus, Users, LogOut, FlaskConical, Loader2, LayoutGrid } from 'lucide-react';
import { CreateBoardModal } from './CreateBoardModal';
import { Button } from './ui/button';
import type { Board } from '../types';
import { testDataAPI } from '../utils/api';

interface BoardListPageProps {
  boards: Board[];
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: (name: string, description?: string) => void;
  onToggleStar: (boardId: string) => void;
  onLogout: () => void;
  onRefreshBoards?: () => void;
}

// 보드 색상 gradient 생성 (Bridge 테마)
const BOARD_GRADIENTS = [
  'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',  // Indigo (Bridge accent)
  'linear-gradient(135deg, #2DD4BF 0%, #14B8A6 100%)',  // Teal (Bridge secondary)
  'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',  // Light indigo
  'linear-gradient(135deg, #34D399 0%, #10B981 100%)',  // Emerald
  'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',  // Violet
  'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)',  // Pink
];

function getBoardGradient(boardId: string): string {
  const hash = boardId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return BOARD_GRADIENTS[hash % BOARD_GRADIENTS.length];
}

export function BoardListPage({
  boards,
  onSelectBoard,
  onCreateBoard,
  onToggleStar,
  onLogout,
  onRefreshBoards,
}: BoardListPageProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingTestData, setIsCreatingTestData] = useState(false);
  const navigate = useNavigate();

  const handleCreateTestBoard = async () => {
    if (isCreatingTestData) return;

    setIsCreatingTestData(true);
    try {
      const response = await testDataAPI.createTestBoard();
      console.log('Test board created:', response);
      alert(`${response.message}\n\n- Board: ${response.board_name}\n- Members: ${response.member_count}\n- Features: ${response.feature_count}\n- Tasks: ${response.task_count}\n- Checklists: ${response.checklist_item_count}\n- Schedule Blocks: ${response.schedule_block_count}`);
      onRefreshBoards?.();
    } catch (error) {
      console.error('Failed to create test board:', error);
      alert('테스트 보드 생성에 실패했습니다.');
    } finally {
      setIsCreatingTestData(false);
    }
  };

  const starredBoards = boards.filter((b) => b.is_starred);

  return (
    <div className="min-h-screen bg-bridge-dark text-white">
      {/* 헤더 */}
      <header className="border-b border-white/5 glass">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-4 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <div className="w-12 h-12 bg-bridge-accent rounded-xl flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.4)] group-hover:rotate-6 transition-all duration-500">
                <span className="text-xl font-serif font-bold text-white">B</span>
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold tracking-tight group-hover:text-bridge-secondary transition-colors">BRIDGE</h1>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="px-2 py-0.5 bg-bridge-accent/20 text-bridge-secondary rounded-full text-[10px] font-bold tracking-wider uppercase">
                    Premium
                  </span>
                  <span className="text-slate-500">Workspace</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 rounded-full px-4"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* 즐겨찾기한 보드 */}
        {starredBoards.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <h2 className="text-lg font-serif font-bold text-white tracking-tight">
                Starred Boards
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-bridge-accent/10 rounded-lg">
              <LayoutGrid className="h-5 w-5 text-bridge-accent" />
            </div>
            <h2 className="text-lg font-serif font-bold text-white tracking-tight">Your Boards</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              className="h-28 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-bridge-accent/50 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-white transition-all duration-300 group"
            >
              <div className="p-3 bg-white/5 rounded-xl group-hover:bg-bridge-accent/20 transition-colors mb-2">
                <Plus className="h-6 w-6 group-hover:text-bridge-accent" />
              </div>
              <span className="text-sm font-medium">Create new board</span>
            </button>

            {/* 테스트 보드 생성 카드 (개발용) */}
            <button
              onClick={handleCreateTestBoard}
              disabled={isCreatingTestData}
              className="h-28 bg-gradient-to-br from-bridge-accent/10 to-bridge-secondary/10 hover:from-bridge-accent/20 hover:to-bridge-secondary/20 border border-bridge-accent/30 rounded-2xl flex flex-col items-center justify-center text-bridge-secondary hover:text-bridge-secondary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingTestData ? (
                <>
                  <Loader2 className="h-6 w-6 mb-2 animate-spin" />
                  <span className="text-sm font-medium">Creating...</span>
                </>
              ) : (
                <>
                  <div className="p-3 bg-bridge-accent/20 rounded-xl mb-2">
                    <FlaskConical className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium">Create Test Board</span>
                </>
              )}
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
      className="relative h-28 rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-xl hover:shadow-bridge-accent/10 transition-all duration-300"
      onClick={onClick}
    >
      {/* 배경 그라데이션 */}
      <div
        className="absolute inset-0"
        style={{ background: getBoardGradient(board.id) }}
      />

      {/* 패턴 오버레이 */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />

      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

      {/* 별표 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar();
        }}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-black/20 transition-colors z-10"
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
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
        <h3 className="font-semibold text-white text-sm mb-1 truncate">{board.name}</h3>
        {board.member_count > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-white/70">
            <Users className="h-3 w-3" />
            <span>{board.member_count} members</span>
          </div>
        )}
      </div>
    </div>
  );
}
