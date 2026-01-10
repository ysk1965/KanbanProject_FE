import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { BoardListPage } from './components/BoardListPage';
import { InviteLandingPage } from './components/InviteLandingPage';
import { KanbanBoardPage } from './pages/KanbanBoardPage';
import { boardService, inviteLinkService } from './utils/services';
import { useState, useEffect } from 'react';
import { Board } from './types';

// 인증이 필요한 라우트 래퍼
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1d2125] flex items-center justify-center">
        <div className="text-white text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// 로그인 페이지 래퍼 (이미 로그인되어 있으면 보드 목록으로)
function LoginRoute() {
  const { isAuthenticated, isLoading, login, signup, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [isProcessingInvite, setIsProcessingInvite] = useState(false);

  useEffect(() => {
    const handlePostLogin = async () => {
      if (isAuthenticated && !isLoading && !isProcessingInvite) {
        // 대기 중인 초대가 있으면 자동으로 수락
        const pendingCode = localStorage.getItem('pending_invite_code');
        if (pendingCode) {
          setIsProcessingInvite(true);
          localStorage.removeItem('pending_invite_code');
          try {
            const result = await inviteLinkService.acceptInvite(pendingCode);
            navigate(`/boards/${result.board_id}`);
          } catch (error: any) {
            console.error('Failed to accept invite:', error);
            alert(error?.message || '초대 수락에 실패했습니다. 보드 목록으로 이동합니다.');
            navigate('/boards');
          } finally {
            setIsProcessingInvite(false);
          }
        } else {
          navigate('/boards');
        }
      }
    };

    handlePostLogin();
  }, [isAuthenticated, isLoading, navigate, isProcessingInvite]);

  if (isLoading || isProcessingInvite) {
    return (
      <div className="min-h-screen bg-[#1d2125] flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-lg mb-2">
            {isProcessingInvite ? '초대를 수락하는 중...' : '로딩 중...'}
          </div>
          {isProcessingInvite && (
            <div className="text-gray-400 text-sm">잠시만 기다려주세요</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <LoginPage
      onLogin={login}
      onSignup={signup}
      onGoogleLogin={googleLogin}
    />
  );
}

// 보드 목록 페이지 래퍼
function BoardsRoute() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBoards = async () => {
      try {
        const boardsData = await boardService.getBoards();
        setBoards(boardsData);
      } catch (error) {
        console.error('Failed to load boards:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBoards();
  }, []);

  const handleSelectBoard = (boardId: string) => {
    navigate(`/boards/${boardId}`);
  };

  const handleCreateBoard = async (name: string, description?: string) => {
    try {
      const newBoard = await boardService.createBoard(name, description);
      setBoards([...boards, newBoard]);
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  };

  const handleToggleStar = async (boardId: string) => {
    const board = boards.find((b) => b.id === boardId);
    if (!board) return;

    const newStarredStatus = !board.is_starred;

    try {
      await boardService.toggleStar(boardId, newStarredStatus);
      setBoards(
        boards.map((b) =>
          b.id === boardId ? { ...b, is_starred: newStarredStatus } : b
        )
      );
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1d2125] flex items-center justify-center">
        <div className="text-white text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <BoardListPage
      boards={boards}
      onSelectBoard={handleSelectBoard}
      onCreateBoard={handleCreateBoard}
      onToggleStar={handleToggleStar}
      onLogout={logout}
    />
  );
}

// 초대 페이지 래퍼
function InviteRoute() {
  const { code } = useParams<{ code: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    // 초대 코드를 저장하고 로그인 페이지로 이동
    if (code) {
      localStorage.setItem('pending_invite_code', code);
    }
    navigate('/login');
  };

  const handleAcceptInvite = async (boardId: string) => {
    navigate(`/boards/${boardId}`);
  };

  if (!code) {
    return <Navigate to="/boards" replace />;
  }

  return (
    <InviteLandingPage
      inviteCode={code}
      isAuthenticated={isAuthenticated}
      onLogin={handleLogin}
      onAcceptInvite={handleAcceptInvite}
    />
  );
}

// 메인 앱 라우터
function AppRoutes() {
  return (
    <Routes>
      {/* 루트 경로 - 로그인 여부에 따라 리디렉션 */}
      <Route path="/" element={<Navigate to="/boards" replace />} />

      {/* 로그인 */}
      <Route path="/login" element={<LoginRoute />} />

      {/* 보드 목록 */}
      <Route
        path="/boards"
        element={
          <PrivateRoute>
            <BoardsRoute />
          </PrivateRoute>
        }
      />

      {/* 칸반 보드 */}
      <Route
        path="/boards/:boardId"
        element={
          <PrivateRoute>
            <KanbanBoardPage />
          </PrivateRoute>
        }
      />

      {/* 초대 링크 */}
      <Route path="/invite/:code" element={<InviteRoute />} />

      {/* 404 - 존재하지 않는 경로 */}
      <Route path="*" element={<Navigate to="/boards" replace />} />
    </Routes>
  );
}

// App 컴포넌트
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
