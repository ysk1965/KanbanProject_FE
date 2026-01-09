import { useState, useMemo, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, Users, Settings, Filter, ArrowLeft, Bell } from 'lucide-react';
import { Block, Feature, Task, Priority, Tag, Board, InviteLink, Subscription, PricingPlan, ActivityLog } from './types';
import { KanbanBlock } from './components/KanbanBlock';
import { FeatureCard } from './components/FeatureCard';
import { FeatureDetailModal } from './components/FeatureDetailModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { AddBlockModal } from './components/AddBlockModal';
import { AddFeatureModal } from './components/AddFeatureModal';
import { TrialBanner } from './components/TrialBanner';
import { FilterModal, FilterOptions } from './components/FilterModal';
import { ShareBoardModal, BoardMember as ShareBoardMember, MemberRole } from './components/ShareBoardModal';
import { BoardListPage } from './components/BoardListPage';
import { LoginPage } from './components/LoginPage';
import { SubscriptionModal } from './components/SubscriptionModal';
import { ActivityLogModal } from './components/ActivityLogModal';
import { UserMenu } from './components/UserMenu';
import { Button } from './components/ui/button';
import { 
  boardService, 
  featureService, 
  taskService, 
  blockService, 
  tagService, 
  memberService,
  authService,
  inviteLinkService,
  subscriptionService,
  activityService,
  pricingService
} from './utils/services';
import { initializeMockData } from './utils/mockData';

// Feature 색상 팔레트
export const FEATURE_COLORS = [
  '#8B5CF6', // purple
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
  '#84CC16', // lime
];

// 랜덤 색상 선택
const getRandomFeatureColor = () => {
  return FEATURE_COLORS[Math.floor(Math.random() * FEATURE_COLORS.length)];
};

function App() {
  // 인증 상태
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());

  // 보드 목록 및 현재 선택된 보드
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 블록 설정 (고정 3개 + 커스텀 예시)
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Feature 데이터
  const [features, setFeatures] = useState<Feature[]>([]);

  // Task 데이터
  const [tasks, setTasks] = useState<Task[]>([]);

  // 태그 데이터
  const [tags, setTags] = useState<Tag[]>([]);

  // 초대 링크 데이터
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);

  // 구독 데이터
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);

  // 활동 로그 데이터
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activityCursor, setActivityCursor] = useState<string | undefined>();
  const [hasMoreActivity, setHasMoreActivity] = useState(false);

  // 멤버 데이터
  const availableMembers = ['김철수', '이영희', '박개발', '이디자인', '최QA', '김기획'];
  const boardMembers = availableMembers;

  // 모달 상태
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAddBlockModalOpen, setIsAddBlockModalOpen] = useState(false);
  const [isAddFeatureModalOpen, setIsAddFeatureModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isShareBoardModalOpen, setIsShareBoardModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isActivityLogModalOpen, setIsActivityLogModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    keyword: '',
    members: [],
    features: [],
    tags: [],
    cardStatus: [],
    dueDate: [],
  });

  // 보드 멤버 상태
  const [boardMembersData, setBoardMembersData] = useState<ShareBoardMember[]>([
    {
      id: 'user_1',
      name: '김철수',
      email: 'kim@example.com',
      role: 'admin',
    },
    {
      id: 'user_2',
      name: '이영희',
      email: 'lee@example.com',
      role: 'member',
    },
    {
      id: 'user_3',
      name: '박개발',
      email: 'park@example.com',
      role: 'member',
    },
    {
      id: 'user_4',
      name: '이디자인',
      email: 'design@example.com',
      role: 'member',
    },
    {
      id: 'user_5',
      name: '최QA',
      email: 'qa@example.com',
      role: 'observer',
    },
    {
      id: 'user_6',
      name: '김기획',
      email: 'plan@example.com',
      role: 'member',
    },
  ]);

  const currentUserId = 'user_1'; // 현재 로그인한 사용자 ID

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      // 인증되지 않은 경우 데이터 로드하지 않음
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // 보드 목록 로드
        const boardsData = await boardService.getBoards();
        setBoards(boardsData);
        
        // 목업 데이터 초기화
        const mockData = initializeMockData();
        setBlocks(mockData.blocks);
        setFeatures(mockData.features);
        setTasks(mockData.tasks);
        setTags(mockData.tags);
        
        // 초대 링크 로드 (보드 ID가 필요하므로 나중에 로드)
        const inviteLinksData = await inviteLinkService.getInviteLinks('board_1');
        setInviteLinks(inviteLinksData);
        
        // 구독 정보 로드
        const subscriptionData = await subscriptionService.getSubscription('board_1');
        setSubscription(subscriptionData);
        
        // 가격 책정 정보 로드
        const pricingPlansData = await pricingService.getPlans();
        setPricingPlans(pricingPlansData);
        
        // 활동 로그 로드
        const activitiesResponse = await activityService.getActivity('board_1');
        setActivities(activitiesResponse.items);
        setActivityCursor(activitiesResponse.nextCursor);
        setHasMoreActivity(activitiesResponse.hasMore);
        
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [isAuthenticated]);

  // 보드 관리 함수
  const handleSelectBoard = async (boardId: string) => {
    setCurrentBoardId(boardId);
    // TODO: 보드별 데이터 로드
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

  const handleBackToBoards = () => {
    setCurrentBoardId(null);
  };

  // 보드 멤버 관리 함수
  const handleAddMember = (email: string, role: MemberRole) => {
    // 이메일 형식 검증 (간단)
    if (!email.includes('@')) {
      alert('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    // 이미 존재하는 멤버인지 확인
    if (boardMembersData.some((m) => m.email === email)) {
      alert('이미 보드에 추가된 멤버입니다.');
      return;
    }

    // 새 멤버 추가
    const newMember: ShareBoardMember = {
      id: `user_${Date.now()}`,
      name: email.split('@')[0], // 이메일에서 이름 추출 (실제로는 서버에서 받아야 함)
      email,
      role,
    };

    setBoardMembersData([...boardMembersData, newMember]);
  };

  const handleUpdateMemberRole = (memberId: string, role: MemberRole) => {
    setBoardMembersData(
      boardMembersData.map((m) => (m.id === memberId ? { ...m, role } : m))
    );
  };

  const handleRemoveMember = (memberId: string) => {
    // 자기 자신은 삭제할 수 없음
    if (memberId === currentUserId) {
      alert('자기 자신은 제거할 수 없습니다.');
      return;
    }

    setBoardMembersData(boardMembersData.filter((m) => m.id !== memberId));
  };

  // 로그인/로그아웃 핸들러
  const handleLogin = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setIsAuthenticated(true);
    setCurrentUser(response.user);
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    const response = await authService.signup(email, password, name);
    setIsAuthenticated(true);
    setCurrentUser(response.user);
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentBoardId(null);
  };

  // 초대 링크 핸들러
  const handleCreateInviteLink = async (role: string, maxUses: number, expiresIn: string) => {
    const link = await inviteLinkService.createInviteLink(currentBoardId || 'board_1', role, maxUses, expiresIn);
    setInviteLinks([...inviteLinks, link]);
  };

  const handleDeleteInviteLink = async (linkId: string) => {
    await inviteLinkService.deleteInviteLink(currentBoardId || 'board_1', linkId);
    setInviteLinks(inviteLinks.filter(l => l.id !== linkId));
  };

  // 구독 핸들러
  const handleSubscribe = async (planId: string, billingCycle: 'monthly' | 'yearly') => {
    const newSubscription = await subscriptionService.subscribe(currentBoardId || 'board_1', planId, billingCycle);
    setSubscription(newSubscription);
  };

  const handleChangePlan = async (planId: string, billingCycle: 'monthly' | 'yearly') => {
    const newSubscription = await subscriptionService.changePlan(currentBoardId || 'board_1', planId, billingCycle);
    setSubscription(newSubscription);
  };

  const handleCancelSubscription = async () => {
    await subscriptionService.cancelSubscription(currentBoardId || 'board_1');
    // 구독 정보 다시 로드
    const subscriptionData = await subscriptionService.getSubscription(currentBoardId || 'board_1');
    setSubscription(subscriptionData);
  };

  // 활동 로그 핸들러
  const handleLoadMoreActivity = async () => {
    if (!hasMoreActivity || !activityCursor) return;
    const response = await activityService.getActivity(currentBoardId || 'board_1', 20, activityCursor);
    setActivities([...activities, ...response.items]);
    setActivityCursor(response.nextCursor);
    setHasMoreActivity(response.hasMore);
  };

  const sortedBlocks = useMemo(() => {
    return [...blocks].sort((a, b) => a.position - b.position);
  }, [blocks]);

  // 블록 관리
  const handleAddBlock = (name: string, color: string) => {
    // Task와 Done 사이에 블록 추가
    const taskBlock = blocks.find((b) => b.id === 'task');
    const doneBlock = blocks.find((b) => b.id === 'done');

    if (!taskBlock || !doneBlock) return;

    const newPosition = taskBlock.position + 1;

    const newBlock: Block = {
      id: `custom_${Date.now()}`,
      type: 'CUSTOM',
      fixed_type: null,
      name,
      color,
      position: newPosition,
    };

    // 기존 커스텀 블록들의 position 조정
    const updatedBlocks = blocks.map((block) => {
      if (block.position >= newPosition && block.id !== 'task') {
        return { ...block, position: block.position + 1 };
      }
      return block;
    });

    setBlocks([...updatedBlocks, newBlock]);
  };

  const handleDeleteBlock = (blockId: string) => {
    const blockToDelete = blocks.find((b) => b.id === blockId);
    if (!blockToDelete || blockToDelete.type === 'FIXED') return;

    // 해당 블록의 모든 Task를 Task 블록으로 이동
    const updatedTasks = tasks.map((task) =>
      task.block_id === blockId ? { ...task, block_id: 'task' } : task
    );

    // 블록 삭제 및 position 재조정
    const updatedBlocks = blocks
      .filter((b) => b.id !== blockId)
      .map((block) => {
        if (block.position > blockToDelete.position) {
          return { ...block, position: block.position - 1 };
        }
        return block;
      });

    setTasks(updatedTasks);
    setBlocks(updatedBlocks);
  };

  const handleMoveBlock = (blockId: string, direction: 'left' | 'right') => {
    const blockIndex = sortedBlocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return;

    const block = sortedBlocks[blockIndex];
    if (block.type === 'FIXED') return; // 고정 블록은 이동 불가

    const swapIndex = direction === 'left' ? blockIndex - 1 : blockIndex + 1;
    if (swapIndex < 0 || swapIndex >= sortedBlocks.length) return;

    const swapBlock = sortedBlocks[swapIndex];
    if (swapBlock.type === 'FIXED') return; // 고정 블록과는 교환 불가

    // position 교환
    const updatedBlocks = blocks.map((b) => {
      if (b.id === block.id) {
        return { ...b, position: swapBlock.position };
      }
      if (b.id === swapBlock.id) {
        return { ...b, position: block.position };
      }
      return b;
    });

    setBlocks(updatedBlocks);
  };

  // Feature 관리
  const handleAddFeature = (title: string, description: string) => {
    const newFeature: Feature = {
      id: `f${Date.now()}`,
      title,
      description,
      color: getRandomFeatureColor(),
      assignee: null,
      priority: null,
      due_date: null,
      status: 'ACTIVE',
      total_tasks: 0,
      completed_tasks: 0,
      progress_percentage: 0,
      position: features.length,
      tags: [],
      created_at: new Date().toISOString(),
    };
    setFeatures([...features, newFeature]);
  };

  const handleFeatureClick = (feature: Feature) => {
    setSelectedFeature(feature);
    setIsFeatureModalOpen(true);
  };

  const handleUpdateFeature = (
    featureId: string,
    updates: Partial<Feature>
  ) => {
    setFeatures(
      features.map((f) => (f.id === featureId ? { ...f, ...updates } : f))
    );
  };

  const handleDeleteFeature = (featureId: string) => {
    // Feature와 관련된 Task들도 함께 삭제
    setFeatures(features.filter((f) => f.id !== featureId));
    setTasks(tasks.filter((t) => t.feature_id !== featureId));
    setIsFeatureModalOpen(false);
    setSelectedFeature(null);
  };

  // Task 관리
  const handleAddSubtask = (featureId: string, taskTitle: string) => {
    const feature = features.find((f) => f.id === featureId);
    if (!feature) return;

    const newTask: Task = {
      id: `t${Date.now()}`,
      title: taskTitle,
      feature_id: featureId,
      feature_title: feature.title,
      feature_color: feature.color,
      block_id: 'task',
      assignee: null,
      due_date: null,
      estimated_minutes: null,
      is_completed: false,
      position: tasks.filter((t) => t.block_id === 'task').length,
      tags: [],
      created_at: new Date().toISOString(),
    };

    // Task 추가
    setTasks([...tasks, newTask]);

    // Feature의 total_tasks 업데이트
    handleUpdateFeature(featureId, {
      total_tasks: feature.total_tasks + 1,
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));

    // Task의 체크리스트가 업데이트되었을 경우
    if (updates.checklist_total !== undefined || updates.checklist_completed !== undefined) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        // Feature 진행률 업데이트 (Task 자체는 변경 없음)
        updateFeatureProgress(task.feature_id);
      }
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const feature = features.find((f) => f.id === task.feature_id);
    if (feature) {
      const newTotalTasks = feature.total_tasks - 1;
      const newCompletedTasks = task.is_completed
        ? feature.completed_tasks - 1
        : feature.completed_tasks;
      handleUpdateFeature(feature.id, {
        total_tasks: newTotalTasks,
        completed_tasks: newCompletedTasks,
        progress_percentage: newTotalTasks > 0 ? Math.round((newCompletedTasks / newTotalTasks) * 100) : 0,
      });
    }

    setTasks(tasks.filter((t) => t.id !== taskId));
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  const handleMoveTask = (taskId: string, targetBlockId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const wasCompleted = task.is_completed;
    const isNowCompleted = targetBlockId === 'done';

    // Task 이동
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? { ...t, block_id: targetBlockId, is_completed: isNowCompleted }
          : t
      )
    );

    // Feature 진행률 업데이트
    if (wasCompleted !== isNowCompleted) {
      const feature = features.find((f) => f.id === task.feature_id);
      if (feature) {
        const newCompletedTasks = isNowCompleted
          ? feature.completed_tasks + 1
          : feature.completed_tasks - 1;

        handleUpdateFeature(feature.id, {
          completed_tasks: newCompletedTasks,
          progress_percentage: feature.total_tasks > 0 ? Math.round((newCompletedTasks / feature.total_tasks) * 100) : 0,
        });
      }
    }
  };

  const handleReorderTask = (
    taskId: string,
    blockId: string,
    newPosition: number
  ) => {
    const tasksInBlock = tasks.filter((t) => t.block_id === blockId);
    const taskToMove = tasksInBlock.find((t) => t.id === taskId);
    if (!taskToMove) return;

    const oldPosition = taskToMove.position;

    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return { ...task, position: newPosition };
      }
      if (task.block_id === blockId) {
        if (oldPosition < newPosition) {
          // 아래로 이동: 사이의 Task들을 위로
          if (task.position > oldPosition && task.position <= newPosition) {
            return { ...task, position: task.position - 1 };
          }
        } else {
          // 위로 이동: 사이의 Task들을 아래로
          if (task.position >= newPosition && task.position < oldPosition) {
            return { ...task, position: task.position + 1 };
          }
        }
      }
      return task;
    });

    setTasks(updatedTasks);
  };

  // Feature 진행률 업데이트 (체크리스트 변경 시)
  const updateFeatureProgress = (featureId: string) => {
    const feature = features.find((f) => f.id === featureId);
    if (!feature) return;

    const featureTasks = tasks.filter((t) => t.feature_id === featureId);
    const completedTasks = featureTasks.filter((t) => t.block_id === 'done');
    const totalTasks = featureTasks.length;
    const completedCount = completedTasks.length;

    handleUpdateFeature(featureId, {
      total_tasks: totalTasks,
      completed_tasks: completedCount,
      progress_percentage: totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0,
    });
  };

  // 블록별 Task 가져오기
  const getTasksForBlock = (blockId: string) => {
    return filteredTasks
      .filter((task) => task.block_id === blockId)
      .sort((a, b) => a.position - b.position);
  };

  // 태그 생성
  const handleCreateTag = (name: string, color: string) => {
    const newTag: Tag = {
      id: `tag${Date.now()}`,
      name,
      color,
    };
    setTags([...tags, newTag]);
    return newTag.id;
  };

  // 필터링 로직
  const filteredFeatures = useMemo(() => {
    return features.filter((feature) => {
      // 키워드 필터
      if (
        filterOptions.keyword &&
        !feature.title
          .toLowerCase()
          .includes(filterOptions.keyword.toLowerCase())
      ) {
        return false;
      }

      // 멤버 필터
      if (
        filterOptions.members.length > 0 &&
        !filterOptions.members.some(
          (m) => feature.assignee?.name === m
        )
      ) {
        return false;
      }

      // 태그 필터
      if (
        filterOptions.tags.length > 0 &&
        !filterOptions.tags.some((tagId) => feature.tags?.some((t) => t.id === tagId))
      ) {
        return false;
      }

      // 마감일 필터
      if (filterOptions.dueDate.length > 0 && feature.due_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(feature.due_date);
        dueDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        let matchesDueDate = false;

        if (filterOptions.dueDate.includes('overdue') && diffDays < 0) {
          matchesDueDate = true;
        }
        if (filterOptions.dueDate.includes('today') && diffDays === 0) {
          matchesDueDate = true;
        }
        if (filterOptions.dueDate.includes('tomorrow') && diffDays === 1) {
          matchesDueDate = true;
        }
        if (filterOptions.dueDate.includes('week') && diffDays >= 0 && diffDays <= 7) {
          matchesDueDate = true;
        }

        if (!matchesDueDate) {
          return false;
        }
      }

      return true;
    });
  }, [features, filterOptions]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 키워드 필터
      if (
        filterOptions.keyword &&
        !task.title.toLowerCase().includes(filterOptions.keyword.toLowerCase())
      ) {
        return false;
      }

      // 멤버 필터
      if (
        filterOptions.members.length > 0 &&
        !filterOptions.members.some((m) => task.assignee?.name === m)
      ) {
        return false;
      }

      // Feature 필터
      if (
        filterOptions.features.length > 0 &&
        !filterOptions.features.includes(task.feature_id)
      ) {
        return false;
      }

      // 태그 필터
      if (
        filterOptions.tags.length > 0 &&
        !filterOptions.tags.some((tagId) => task.tags?.some((t) => t.id === tagId))
      ) {
        return false;
      }

      // 카드 상태 필터
      if (filterOptions.cardStatus.length > 0) {
        const hasStatus =
          (filterOptions.cardStatus.includes('completed') && task.is_completed) ||
          (filterOptions.cardStatus.includes('incomplete') && !task.is_completed);

        if (!hasStatus) {
          return false;
        }
      }

      // 마감일 필터
      if (filterOptions.dueDate.length > 0 && task.due_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        let matchesDueDate = false;

        if (filterOptions.dueDate.includes('overdue') && diffDays < 0) {
          matchesDueDate = true;
        }
        if (filterOptions.dueDate.includes('today') && diffDays === 0) {
          matchesDueDate = true;
        }
        if (filterOptions.dueDate.includes('tomorrow') && diffDays === 1) {
          matchesDueDate = true;
        }
        if (filterOptions.dueDate.includes('week') && diffDays >= 0 && diffDays <= 7) {
          matchesDueDate = true;
        }

        if (!matchesDueDate) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, filterOptions]);

  // 현재 보드 정보
  const currentBoard = boards.find((b) => b.id === currentBoardId);

  // 로그인하지 않은 경우 로그인 페이지 표시
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={handleLogin}
        onSignup={handleSignup}
      />
    );
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1d2125] flex items-center justify-center">
        <div className="text-white text-lg">로딩 중...</div>
      </div>
    );
  }

  // 보드가 선택되지 않았으면 보드 목록 페이지 표시
  if (!currentBoardId) {
    return (
      <BoardListPage
        boards={boards}
        onSelectBoard={handleSelectBoard}
        onCreateBoard={handleCreateBoard}
        onToggleStar={handleToggleStar}
      />
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-[#1d2125]">
        {/* Trial Banner */}
        <TrialBanner 
          status="trial" 
          daysRemaining={5} 
          onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
        />

        {/* 헤더 */}
        <header className="bg-[#282e33] border-b border-gray-800">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between max-w-full">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToBoards}
                  className="text-gray-300 hover:text-white hover:bg-[#3a4149]"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  보드
                </Button>
                <div className="h-6 w-px bg-gray-700" />
                <h1 className="text-xl font-bold text-white">
                  {currentBoard?.name || '팀 칸반보드'}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsActivityLogModalOpen(true)}
                  className="border-gray-600 text-gray-300 hover:bg-[#3a4149] hover:text-white"
                >
                  <Bell className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFilterModalOpen(true)}
                  className="border-gray-600 text-gray-300 hover:bg-[#3a4149] hover:text-white"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  필터
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsShareBoardModalOpen(true)}
                  className="border-gray-600 text-gray-300 hover:bg-[#3a4149] hover:text-white"
                >
                  <Users className="h-4 w-4 mr-2" />
                  팀원
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-[#3a4149] hover:text-white"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  설정
                </Button>
                
                {currentUser && (
                  <UserMenu
                    user={currentUser}
                    onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
                    onOpenSettings={() => setIsSettingsModalOpen(true)}
                    onLogout={handleLogout}
                  />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* 칸반보드 */}
        <main className="p-6 overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {sortedBlocks.map((block, index) => {
              const customBlocks = sortedBlocks.filter(
                (b) => b.type === 'CUSTOM'
              );
              const customBlockIndex = customBlocks.findIndex(
                (b) => b.id === block.id
              );

              return (
                <div key={block.id} className="flex items-start gap-4">
                  {/* 블록 */}
                  {block.id === 'feature' ? (
                    <div className="flex flex-col bg-[#282e33] rounded-lg min-w-[280px] max-w-[280px]">
                      <div className="flex items-center justify-between p-4 border-b border-gray-700">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">
                            {block.name}
                          </h3>
                          <span className="text-sm text-gray-400">
                            {filteredFeatures.length}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-250px)]">
                        {filteredFeatures.map((feature) => (
                          <FeatureCard
                            key={feature.id}
                            feature={feature}
                            onClick={() => handleFeatureClick(feature)}
                            availableTags={tags}
                            tasks={filteredTasks.filter((task) => task.feature_id === feature.id)}
                          />
                        ))}
                      </div>
                      <div className="p-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-400 hover:text-white hover:bg-[#3a4149]"
                          onClick={() => setIsAddFeatureModalOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Feature 추가
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <KanbanBlock
                      block={block}
                      tasks={getTasksForBlock(block.id).map((task) => ({
                        ...task,
                        onClick: () => handleTaskClick(task),
                      }))}
                      features={features}
                      onMoveTask={handleMoveTask}
                      onReorderTask={handleReorderTask}
                      onEditBlock={
                        block.type === 'CUSTOM'
                          ? () => console.log('Edit block', block.id)
                          : undefined
                      }
                      onDeleteBlock={
                        block.type === 'CUSTOM'
                          ? () => handleDeleteBlock(block.id)
                          : undefined
                      }
                      onMoveBlockLeft={
                        block.type === 'CUSTOM' && customBlockIndex > 0
                          ? () => handleMoveBlock(block.id, 'left')
                          : undefined
                      }
                      onMoveBlockRight={
                        block.type === 'CUSTOM' &&
                        customBlockIndex < customBlocks.length - 1
                          ? () => handleMoveBlock(block.id, 'right')
                          : undefined
                      }
                      canMoveLeft={
                        block.type === 'CUSTOM' && customBlockIndex > 0
                      }
                      canMoveRight={
                        block.type === 'CUSTOM' &&
                        customBlockIndex < customBlocks.length - 1
                      }
                      availableTags={tags}
                    />
                  )}

                  {/* Task와 Done 사이에 블록 추가 버튼 */}
                  {block.id === 'task' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 px-3 mt-4 border-gray-600 text-gray-400 hover:bg-[#3a4149] hover:text-white"
                      onClick={() => setIsAddBlockModalOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </main>

        {/* 모달들 */}
        <FeatureDetailModal
          feature={selectedFeature}
          tasks={
            selectedFeature
              ? tasks.filter((t) => t.feature_id === selectedFeature.id)
              : []
          }
          blocks={blocks}
          open={isFeatureModalOpen}
          onClose={() => {
            setIsFeatureModalOpen(false);
            setSelectedFeature(null);
          }}
          onAddSubtask={handleAddSubtask}
          onUpdateFeature={handleUpdateFeature}
          onDelete={handleDeleteFeature}
          availableTags={tags}
          onCreateTag={handleCreateTag}
          availableMembers={availableMembers}
        />

        <TaskDetailModal
          task={selectedTask}
          open={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(null);
          }}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          availableTags={tags}
          onCreateTag={handleCreateTag}
          availableMembers={availableMembers}
        />

        <AddBlockModal
          open={isAddBlockModalOpen}
          onClose={() => setIsAddBlockModalOpen(false)}
          onAdd={handleAddBlock}
        />

        <AddFeatureModal
          open={isAddFeatureModalOpen}
          onClose={() => setIsAddFeatureModalOpen(false)}
          onAdd={handleAddFeature}
        />

        <FilterModal
          open={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApplyFilter={setFilterOptions}
          availableMembers={boardMembers}
          availableTags={tags}
          availableFeatures={features}
          currentFilters={filterOptions}
        />

        <ShareBoardModal
          open={isShareBoardModalOpen}
          onClose={() => setIsShareBoardModalOpen(false)}
          members={boardMembersData}
          onAddMember={handleAddMember}
          onUpdateMemberRole={handleUpdateMemberRole}
          onRemoveMember={handleRemoveMember}
          currentUserId={currentUserId}
        />

        <SubscriptionModal
          open={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          subscription={subscription}
          plans={pricingPlans}
          onSubscribe={handleSubscribe}
          onChangePlan={handleChangePlan}
          onCancelSubscription={handleCancelSubscription}
        />

        <ActivityLogModal
          open={isActivityLogModalOpen}
          onClose={() => setIsActivityLogModalOpen(false)}
          boardId={currentBoardId || 'board_1'}
          activities={activities}
          hasMore={hasMoreActivity}
          onLoadMore={handleLoadMoreActivity}
        />
      </div>
    </DndProvider>
  );
}

export default App;