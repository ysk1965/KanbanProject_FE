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

  // 체크리스트 펼침 상태 (task ID 집합)
  const [expandedChecklistTaskIds, setExpandedChecklistTaskIds] = useState<Set<string>>(new Set());

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
  const [boardMembersData, setBoardMembersData] = useState<ShareBoardMember[]>([]);

  const currentUserId = currentUser?.id || ''; // 현재 로그인한 사용자 ID

  // 초기 데이터 로드 (보드 목록 및 가격 정보)
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

        // 가격 책정 정보 로드 (보드 선택과 무관)
        const pricingResponse = await pricingService.getPlans();
        setPricingPlans(pricingResponse.plans);

      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [isAuthenticated]);

  // 보드 선택 시 보드별 데이터 로드
  useEffect(() => {
    const loadBoardData = async () => {
      if (!currentBoardId) {
        // 보드가 선택되지 않으면 데이터 초기화
        setBlocks([]);
        setFeatures([]);
        setTasks([]);
        setTags([]);
        setInviteLinks([]);
        setSubscription(null);
        setActivities([]);
        return;
      }

      try {
        setIsLoading(true);

        // 병렬로 모든 보드 데이터 로드
        const [
          blocksData,
          featuresData,
          tasksData,
          tagsData,
          inviteLinksData,
          subscriptionData,
          activitiesResponse,
          membersData,
        ] = await Promise.all([
          blockService.getBlocks(currentBoardId),
          featureService.getFeatures(currentBoardId),
          taskService.getTasks(currentBoardId),
          tagService.getTags(currentBoardId),
          inviteLinkService.getInviteLinks(currentBoardId),
          subscriptionService.getSubscription(currentBoardId),
          activityService.getActivities(currentBoardId),
          memberService.getMembers(currentBoardId),
        ]);

        setBlocks(blocksData);
        setFeatures(featuresData);
        setTasks(tasksData);
        setTags(tagsData);
        setInviteLinks(inviteLinksData);
        setSubscription(subscriptionData);
        setActivities(activitiesResponse.activities);
        setActivityCursor(activitiesResponse.next_cursor || undefined);
        setHasMoreActivity(activitiesResponse.has_more);
        // 멤버 데이터 변환 및 설정
        setBoardMembersData(membersData.members.map((m: any) => ({
          id: m.id,
          userId: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role.toLowerCase() as MemberRole,
        })));

      } catch (error) {
        console.error('Failed to load board data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBoardData();
  }, [currentBoardId]);

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
  const handleAddMember = async (email: string, role: MemberRole) => {
    if (!currentBoardId) return;

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

    try {
      // API 호출: POST /boards/{boardId}/members/invite
      const newMember = await memberService.inviteMember(currentBoardId, email, role.toUpperCase());
      setBoardMembersData([...boardMembersData, {
        id: newMember.id,
        userId: newMember.user.id,
        name: newMember.user.name,
        email: newMember.user.email,
        role: newMember.role.toLowerCase() as MemberRole,
      }]);
    } catch (error: any) {
      console.error('Failed to invite member:', error);
      alert(error?.message || '멤버 초대에 실패했습니다.');
    }
  };

  const handleUpdateMemberRole = async (memberId: string, role: MemberRole) => {
    if (!currentBoardId) return;

    const prevMembers = [...boardMembersData];
    // 낙관적 업데이트
    setBoardMembersData(
      boardMembersData.map((m) => (m.id === memberId ? { ...m, role } : m))
    );

    try {
      // API 호출: PUT /boards/{boardId}/members/{memberId}/role
      await memberService.updateMemberRole(currentBoardId, memberId, role.toUpperCase());
    } catch (error: any) {
      console.error('Failed to update member role:', error);
      // 롤백
      setBoardMembersData(prevMembers);
      alert(error?.message || '역할 변경에 실패했습니다.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentBoardId) return;

    // 자기 자신은 삭제할 수 없음
    if (memberId === currentUserId) {
      alert('자기 자신은 제거할 수 없습니다.');
      return;
    }

    const prevMembers = [...boardMembersData];
    // 낙관적 업데이트
    setBoardMembersData(boardMembersData.filter((m) => m.id !== memberId));

    try {
      // API 호출: DELETE /boards/{boardId}/members/{memberId}
      await memberService.removeMember(currentBoardId, memberId);
    } catch (error: any) {
      console.error('Failed to remove member:', error);
      // 롤백
      setBoardMembersData(prevMembers);
      alert(error?.message || '멤버 제거에 실패했습니다.');
    }
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
    if (!hasMoreActivity || !activityCursor || !currentBoardId) return;
    const response = await activityService.getActivities(currentBoardId, { cursor: activityCursor, limit: 20 });
    setActivities([...activities, ...response.activities]);
    setActivityCursor(response.next_cursor || undefined);
    setHasMoreActivity(response.has_more);
  };

  const sortedBlocks = useMemo(() => {
    return [...blocks].sort((a, b) => a.position - b.position);
  }, [blocks]);

  // 블록 관리
  const handleAddBlock = async (name: string, color: string) => {
    if (!currentBoardId) return;

    try {
      // API 호출로 블록 생성
      const newBlock = await blockService.createBlock(currentBoardId, { name, color });

      // 블록 목록 새로고침
      const blocksData = await blockService.getBlocks(currentBoardId);
      setBlocks(blocksData);
    } catch (error) {
      console.error('Failed to create block:', error);

      // 폴백: 로컬에서 블록 추가
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

      const updatedBlocks = blocks.map((block) => {
        if (block.position >= newPosition && block.id !== 'task') {
          return { ...block, position: block.position + 1 };
        }
        return block;
      });

      setBlocks([...updatedBlocks, newBlock]);
    }
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
  const handleAddFeature = async (data: {
    title: string;
    description?: string;
    priority?: Priority;
    dueDate?: string;
  }) => {
    if (!currentBoardId) return;

    try {
      const newFeature = await featureService.createFeature(currentBoardId, {
        title: data.title,
        description: data.description,
        color: getRandomFeatureColor(),
        priority: data.priority?.toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW' | undefined,
        due_date: data.dueDate,
      });
      setFeatures([...features, newFeature]);
    } catch (error) {
      console.error('Failed to create feature:', error);
    }
  };

  const handleFeatureClick = (feature: Feature) => {
    setSelectedFeature(feature);
    setIsFeatureModalOpen(true);
  };

  const handleUpdateFeature = async (updates: Partial<Feature>) => {
    if (!currentBoardId || !updates.id) return;

    const featureId = updates.id;

    try {
      const updatedFeature = await featureService.updateFeature(currentBoardId, featureId, {
        title: updates.title,
        description: updates.description,
        color: updates.color,
        assignee_id: updates.assignee?.id,
        priority: updates.priority,
        due_date: updates.due_date,
      });
      setFeatures(
        features.map((f) => (f.id === featureId ? updatedFeature : f))
      );
    } catch (error) {
      console.error('Failed to update feature:', error);
      // Fallback: 로컬 상태만 업데이트
      setFeatures(
        features.map((f) => (f.id === featureId ? { ...f, ...updates } : f))
      );
    }
  };

  const handleDeleteFeature = (featureId: string) => {
    // Feature와 관련된 Task들도 함께 삭제
    setFeatures(features.filter((f) => f.id !== featureId));
    setTasks(tasks.filter((t) => t.feature_id !== featureId));
    setIsFeatureModalOpen(false);
    setSelectedFeature(null);
  };

  // Task 관리
  const handleAddSubtask = async (featureId: string, taskTitle: string) => {
    if (!currentBoardId) return;

    const feature = features.find((f) => f.id === featureId);
    if (!feature) return;

    try {
      const newTask = await taskService.createTask(currentBoardId, featureId, {
        title: taskTitle,
      });

      // Task 추가
      setTasks([...tasks, newTask]);

      // Feature의 total_tasks 업데이트 (API 응답에서 이미 업데이트됐을 수 있음)
      setFeatures(
        features.map((f) =>
          f.id === featureId ? { ...f, total_tasks: f.total_tasks + 1 } : f
        )
      );
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!currentBoardId) return;

    // 로컬 상태 즉시 업데이트 (낙관적 업데이트)
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));

    // 체크리스트만 업데이트하는 경우 API 호출 불필요 (체크리스트는 별도 API로 관리)
    const isOnlyChecklistUpdate =
      Object.keys(updates).every(key =>
        key === 'checklist_total' || key === 'checklist_completed'
      );

    if (isOnlyChecklistUpdate) {
      return; // 로컬 상태만 업데이트하고 종료
    }

    // Task의 체크리스트가 업데이트되었을 경우
    if (updates.checklist_total !== undefined || updates.checklist_completed !== undefined) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        // Feature 진행률 업데이트 (Task 자체는 변경 없음)
        updateFeatureProgress(task.feature_id);
      }
    }

    // API 호출 (실제 task 필드 업데이트)
    try {
      const currentTask = tasks.find((t) => t.id === taskId);
      const updatedTask = await taskService.updateTask(currentBoardId, taskId, {
        title: updates.title,
        description: updates.description,
        assignee_id: updates.assignee?.id ?? null,
        due_date: updates.due_date ?? null,
        estimated_minutes: updates.estimated_minutes ?? null,
      });
      // API 응답과 기존 체크리스트 데이터 병합
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === taskId ? {
          ...updatedTask,
          checklist_total: t.checklist_total,
          checklist_completed: t.checklist_completed,
        } : t))
      );
    } catch (error) {
      console.error('Failed to update task:', error);
      // 실패 시 원래 상태로 롤백
      const originalTask = tasks.find((t) => t.id === taskId);
      if (originalTask) {
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t.id === taskId ? originalTask : t))
        );
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !currentBoardId) return;

    // 낙관적 업데이트
    const feature = features.find((f) => f.id === task.feature_id);
    if (feature) {
      const newTotalTasks = feature.total_tasks - 1;
      const newCompletedTasks = task.completed
        ? feature.completed_tasks - 1
        : feature.completed_tasks;
      setFeatures(
        features.map((f) =>
          f.id === feature.id
            ? {
                ...f,
                total_tasks: newTotalTasks,
                completed_tasks: newCompletedTasks,
                progress_percentage: newTotalTasks > 0 ? Math.round((newCompletedTasks / newTotalTasks) * 100) : 0,
              }
            : f
        )
      );
    }

    setTasks(tasks.filter((t) => t.id !== taskId));
    setIsTaskModalOpen(false);
    setSelectedTask(null);

    try {
      // API 호출: DELETE /boards/{boardId}/tasks/{taskId}
      await taskService.deleteTask(currentBoardId, taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
      // 롤백: Task 복구
      setTasks([...tasks]);
      if (feature) {
        setFeatures(
          features.map((f) =>
            f.id === feature.id ? feature : f
          )
        );
      }
    }
  };

  const handleMoveTask = async (taskId: string, targetBlockId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !currentBoardId) return;

    // Done 블록 찾기 (fixed_type이 DONE인 블록)
    const doneBlock = blocks.find((b) => b.fixed_type === 'DONE');
    const targetBlock = blocks.find((b) => b.id === targetBlockId);

    // Done 블록 이동 여부 판단 (block_id 기반으로 판단 - is_completed 플래그 불일치 방지)
    const wasInDone = doneBlock?.id === task.block_id;
    const isMovingToDone = doneBlock?.id === targetBlockId;
    const isNowCompleted = isMovingToDone;

    // 낙관적 업데이트
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? { ...t, block_id: targetBlockId, block_name: targetBlock?.name, completed: isNowCompleted }
          : t
      )
    );

    // Feature 진행률 업데이트 (로컬) - Done 블록으로 이동하거나 Done에서 나올 때만
    if (wasInDone !== isMovingToDone) {
      const feature = features.find((f) => f.id === task.feature_id);
      if (feature) {
        let newCompletedTasks: number;
        if (isMovingToDone) {
          // Done으로 이동
          newCompletedTasks = Math.min(feature.completed_tasks + 1, feature.total_tasks);
        } else {
          // Done에서 나옴
          newCompletedTasks = Math.max(feature.completed_tasks - 1, 0);
        }

        setFeatures(
          features.map((f) =>
            f.id === feature.id
              ? {
                  ...f,
                  completed_tasks: newCompletedTasks,
                  progress_percentage: f.total_tasks > 0 ? Math.round((newCompletedTasks / f.total_tasks) * 100) : 0,
                }
              : f
          )
        );
      }
    }

    try {
      // API 호출: PUT /boards/{boardId}/tasks/{taskId}/move
      const updatedTask = await taskService.moveTask(currentBoardId, taskId, targetBlockId, task.position);
      // API 응답으로 상태 업데이트 (백엔드에서 설정된 is_completed 값 반영)
      if (updatedTask) {
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === taskId
              ? { ...t, ...updatedTask }
              : t
          )
        );
      }
    } catch (error) {
      console.error('Failed to move task:', error);
      // 롤백
      setTasks(
        tasks.map((t) =>
          t.id === taskId
            ? { ...t, block_id: task.block_id, block_name: task.block_name, completed: wasInDone }
            : t
        )
      );
      // Feature 진행률 롤백
      if (wasInDone !== isMovingToDone) {
        const feature = features.find((f) => f.id === task.feature_id);
        if (feature) {
          const rollbackCompletedTasks = isMovingToDone
            ? Math.max(feature.completed_tasks - 1, 0)
            : Math.min(feature.completed_tasks + 1, feature.total_tasks);

          setFeatures(
            features.map((f) =>
              f.id === feature.id
                ? {
                    ...f,
                    completed_tasks: rollbackCompletedTasks,
                    progress_percentage: f.total_tasks > 0 ? Math.round((rollbackCompletedTasks / f.total_tasks) * 100) : 0,
                  }
                : f
            )
          );
        }
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

  // 체크리스트 펼침 상태 토글
  const handleToggleChecklistExpand = (taskId: string) => {
    setExpandedChecklistTaskIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // 블록별 Task 가져오기
  const getTasksForBlock = (blockId: string) => {
    return filteredTasks
      .filter((task) => task.block_id === blockId)
      .sort((a, b) => a.position - b.position);
  };

  // 태그 생성
  const handleCreateTag = async (name: string, color: string) => {
    if (!currentBoardId) return;

    // 낙관적 업데이트용 임시 ID
    const tempId = `tag_temp_${Date.now()}`;
    const newTag: Tag = {
      id: tempId,
      name,
      color,
    };
    setTags([...tags, newTag]);

    try {
      // API 호출: POST /boards/{boardId}/tags
      const createdTag = await tagService.createTag(currentBoardId, { name, color });
      // 임시 ID를 실제 ID로 교체
      setTags((prevTags) =>
        prevTags.map((t) => (t.id === tempId ? createdTag : t))
      );
      return createdTag.id;
    } catch (error) {
      console.error('Failed to create tag:', error);
      // 롤백
      setTags((prevTags) => prevTags.filter((t) => t.id !== tempId));
    }
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
          (filterOptions.cardStatus.includes('completed') && task.completed) ||
          (filterOptions.cardStatus.includes('incomplete') && !task.completed);

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
        onLogout={handleLogout}
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
                  {block.fixed_type === 'FEATURE' ? (
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
                      boardId={currentBoardId}
                      expandedChecklistTaskIds={expandedChecklistTaskIds}
                      onToggleChecklistExpand={handleToggleChecklistExpand}
                    />
                  )}

                  {/* Task와 Done 사이에 블록 추가 버튼 */}
                  {block.fixed_type === 'TASK' && (
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
          onAddSubtask={(title) => handleAddSubtask(selectedFeature!.id, title)}
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
          onUpdate={(updates) => selectedTask && handleUpdateTask(selectedTask.id, updates)}
          onDelete={handleDeleteTask}
          availableTags={tags}
          onCreateTag={handleCreateTag}
          availableMembers={availableMembers}
          boardId={currentBoardId}
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