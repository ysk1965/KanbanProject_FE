import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Users, Settings, Filter, ArrowLeft, Bell, LayoutGrid, Calendar, CalendarDays } from 'lucide-react';

// 뷰 모드 타입
type ViewMode = 'kanban' | 'weekly' | 'schedule';
import { DragProvider } from '../contexts/DragContext';
import { useAuth } from '../contexts/AuthContext';
import { Block, Feature, Task, Priority, Tag, Board, InviteLink, Subscription, PricingPlan, ActivityLog, Milestone } from '../types';
import { KanbanBlock } from '../components/KanbanBlock';
import { FeatureCard } from '../components/FeatureCard';
import { FeatureDetailModal } from '../components/FeatureDetailModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { AddBlockModal } from '../components/AddBlockModal';
import { AddFeatureModal } from '../components/AddFeatureModal';
import { TrialBanner } from '../components/TrialBanner';
import { FilterModal, FilterOptions } from '../components/FilterModal';
import { ShareBoardModal, BoardMember as ShareBoardMember, MemberRole } from '../components/ShareBoardModal';
import { SubscriptionModal } from '../components/SubscriptionModal';
import { ActivityLogModal } from '../components/ActivityLogModal';
import { MilestoneModal } from '../components/MilestoneModal';
import { UserMenu } from '../components/UserMenu';
import { DailyScheduleView } from '../components/DailyScheduleView';
import { WeeklyScheduleView } from '../components/WeeklyScheduleView';
import { Button } from '../components/ui/button';
import {
  boardService,
  featureService,
  taskService,
  blockService,
  tagService,
  memberService,
  inviteLinkService,
  subscriptionService,
  activityService,
  pricingService,
  milestoneService
} from '../utils/services';

import { getRandomFeatureColor } from '../constants';

export function KanbanBoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // 뷰 모드 상태
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  // 보드 데이터
  const [board, setBoard] = useState<Board | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activityCursor, setActivityCursor] = useState<string | undefined>();
  const [hasMoreActivity, setHasMoreActivity] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 체크리스트 펼침 상태
  const [expandedChecklistTaskIds, setExpandedChecklistTaskIds] = useState<Set<string>>(new Set());

  // 멤버 데이터
  const availableMembers = ['김철수', '이영희', '박개발', '이디자인', '최QA', '김기획'];
  const [boardMembersData, setBoardMembersData] = useState<ShareBoardMember[]>([]);
  const currentUserId = currentUser?.id || '';

  // 모달 상태
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);
  const [isAddBlockModalOpen, setIsAddBlockModalOpen] = useState(false);
  const [isAddFeatureModalOpen, setIsAddFeatureModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isShareBoardModalOpen, setIsShareBoardModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isActivityLogModalOpen, setIsActivityLogModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    keyword: '',
    members: [],
    features: [],
    tags: [],
    cardStatus: [],
    dueDate: [],
  });

  // 보드 데이터 로드
  useEffect(() => {
    const loadBoardData = async () => {
      if (!boardId) {
        navigate('/boards');
        return;
      }

      try {
        setIsLoading(true);

        const [
          boardData,
          blocksData,
          featuresData,
          tasksData,
          tagsData,
          inviteLinksData,
          subscriptionData,
          activitiesResponse,
          membersData,
          pricingResponse,
          milestonesData,
        ] = await Promise.all([
          boardService.getBoard(boardId),
          blockService.getBlocks(boardId),
          featureService.getFeatures(boardId),
          taskService.getTasks(boardId),
          tagService.getTags(boardId),
          inviteLinkService.getInviteLinks(boardId),
          subscriptionService.getSubscription(boardId),
          activityService.getActivities(boardId),
          memberService.getMembers(boardId),
          pricingService.getPlans(),
          milestoneService.getMilestones(boardId),
        ]);

        setBoard(boardData);
        setBlocks(blocksData);
        setFeatures(featuresData);
        setTasks(tasksData);
        setTags(tagsData);
        setInviteLinks(inviteLinksData);
        setSubscription(subscriptionData);
        setActivities(activitiesResponse.activities);
        setActivityCursor(activitiesResponse.next_cursor || undefined);
        setHasMoreActivity(activitiesResponse.has_more);
        setPricingPlans(pricingResponse.plans);
        setMilestones(milestonesData);
        setBoardMembersData(membersData.members.map((m: any) => ({
          id: m.id,
          userId: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: (m.role === 'VIEWER' ? 'observer' : m.role.toLowerCase()) as MemberRole,
        })));
      } catch (error) {
        console.error('Failed to load board data:', error);
        navigate('/boards');
      } finally {
        setIsLoading(false);
      }
    };

    loadBoardData();
  }, [boardId, navigate]);

  // 보드 멤버 관리 함수
  const handleAddMember = async (email: string, role: MemberRole) => {
    if (!boardId) return;

    if (!email.includes('@')) {
      alert('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    if (boardMembersData.some((m) => m.email === email)) {
      alert('이미 보드에 추가된 멤버입니다.');
      return;
    }

    const backendRole = role === 'observer' ? 'VIEWER' : role.toUpperCase();

    try {
      const result = await memberService.inviteMember(boardId, email, backendRole as any);

      if (result.type === 'DIRECT_ADD' && result.member) {
        // 기존 사용자 - 바로 멤버로 추가됨
        setBoardMembersData([...boardMembersData, {
          id: result.member.id,
          userId: result.member.user.id,
          name: result.member.user.name,
          email: result.member.user.email,
          role: (result.member.role === 'VIEWER' ? 'observer' : result.member.role.toLowerCase()) as MemberRole,
        }]);
        alert(`${result.member.user.name}님이 멤버로 추가되었습니다.`);
      } else if (result.type === 'EMAIL_SENT') {
        // 미가입 사용자 - 이메일 초대 발송됨
        alert(`${result.email}로 초대 이메일이 발송되었습니다. 가입 후 참여할 수 있습니다.`);
      }
    } catch (error: any) {
      console.error('Failed to invite member:', error);
      alert(error?.message || '멤버 초대에 실패했습니다.');
    }
  };

  const handleUpdateMemberRole = async (memberId: string, role: MemberRole) => {
    if (!boardId) return;

    const prevMembers = [...boardMembersData];
    setBoardMembersData(
      boardMembersData.map((m) => (m.id === memberId ? { ...m, role } : m))
    );

    const backendRole = role === 'observer' ? 'VIEWER' : role.toUpperCase();

    try {
      await memberService.updateMemberRole(boardId, memberId, backendRole as any);
    } catch (error: any) {
      console.error('Failed to update member role:', error);
      setBoardMembersData(prevMembers);
      alert(error?.message || '역할 변경에 실패했습니다.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!boardId) return;

    if (memberId === currentUserId) {
      alert('자기 자신은 제거할 수 없습니다.');
      return;
    }

    const prevMembers = [...boardMembersData];
    setBoardMembersData(boardMembersData.filter((m) => m.id !== memberId));

    try {
      await memberService.removeMember(boardId, memberId);
    } catch (error: any) {
      console.error('Failed to remove member:', error);
      setBoardMembersData(prevMembers);
      alert(error?.message || '멤버 제거에 실패했습니다.');
    }
  };

  // 초대 링크 핸들러
  const handleCreateInviteLink = async (role: string, maxUses: number, expiresIn: string) => {
    if (!boardId) return {} as InviteLink;

    let expiresInHours: number | null = null;
    if (expiresIn) {
      const match = expiresIn.match(/^(\d+)([dhm])$/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        if (unit === 'd') expiresInHours = value * 24;
        else if (unit === 'h') expiresInHours = value;
        else if (unit === 'm') expiresInHours = Math.ceil(value / 60);
      }
    }

    const link = await inviteLinkService.createInviteLink(boardId, {
      role: role as 'ADMIN' | 'MEMBER' | 'VIEWER',
      max_uses: maxUses || null,
      expires_in_hours: expiresInHours,
    });
    setInviteLinks([...inviteLinks, link]);
    return link;
  };

  const handleDeleteInviteLink = async (linkId: string) => {
    if (!boardId) return;
    await inviteLinkService.deleteInviteLink(boardId, linkId);
    setInviteLinks(inviteLinks.filter(l => l.id !== linkId));
  };

  // 구독 핸들러
  const handleSubscribe = async (planId: string, billingCycle: 'monthly' | 'yearly') => {
    if (!boardId) return;
    const newSubscription = await subscriptionService.subscribe(boardId, planId, billingCycle);
    setSubscription(newSubscription);
  };

  const handleChangePlan = async (planId: string, billingCycle: 'monthly' | 'yearly') => {
    if (!boardId) return;
    const newSubscription = await subscriptionService.changePlan(boardId, planId, billingCycle);
    setSubscription(newSubscription);
  };

  const handleCancelSubscription = async () => {
    if (!boardId) return;
    await subscriptionService.cancelSubscription(boardId);
    const subscriptionData = await subscriptionService.getSubscription(boardId);
    setSubscription(subscriptionData);
  };

  // 활동 로그 핸들러
  const handleLoadMoreActivity = async () => {
    if (!hasMoreActivity || !activityCursor || !boardId) return;
    const response = await activityService.getActivities(boardId, { cursor: activityCursor, limit: 20 });
    setActivities([...activities, ...response.activities]);
    setActivityCursor(response.next_cursor || undefined);
    setHasMoreActivity(response.has_more);
  };

  const sortedBlocks = useMemo(() => {
    return [...blocks].sort((a, b) => a.position - b.position);
  }, [blocks]);

  // 블록 관리
  const handleAddBlock = async (name: string, color: string) => {
    if (!boardId) return;

    try {
      const newBlock = await blockService.createBlock(boardId, { name, color });
      const blocksData = await blockService.getBlocks(boardId);
      setBlocks(blocksData);
    } catch (error) {
      console.error('Failed to create block:', error);
    }
  };

  const handleDeleteBlock = (blockId: string) => {
    const blockToDelete = blocks.find((b) => b.id === blockId);
    if (!blockToDelete || blockToDelete.type === 'FIXED') return;

    const updatedTasks = tasks.map((task) =>
      task.block_id === blockId ? { ...task, block_id: 'task' } : task
    );

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
    if (block.type === 'FIXED') return;

    const swapIndex = direction === 'left' ? blockIndex - 1 : blockIndex + 1;
    if (swapIndex < 0 || swapIndex >= sortedBlocks.length) return;

    const swapBlock = sortedBlocks[swapIndex];
    if (swapBlock.type === 'FIXED') return;

    const updatedBlocks = blocks.map((b) => {
      if (b.id === block.id) return { ...b, position: swapBlock.position };
      if (b.id === swapBlock.id) return { ...b, position: block.position };
      return b;
    });

    setBlocks(updatedBlocks);
  };

  const handleMoveBlockDrag = (dragIndex: number, targetIndex: number) => {
    const dragBlock = sortedBlocks[dragIndex];
    if (!dragBlock || dragBlock.type === 'FIXED') return;

    const otherBlocks = sortedBlocks.filter((_, index) => index !== dragIndex);
    let insertIndex = targetIndex;
    if (dragIndex < targetIndex) insertIndex = targetIndex - 1;
    if (insertIndex < 0) insertIndex = 0;
    if (insertIndex > otherBlocks.length) insertIndex = otherBlocks.length;

    const newBlockOrder = [
      ...otherBlocks.slice(0, insertIndex),
      dragBlock,
      ...otherBlocks.slice(insertIndex),
    ];

    const updatedBlocks = blocks.map((b) => {
      const newIndex = newBlockOrder.findIndex((nb) => nb.id === b.id);
      return { ...b, position: newIndex };
    });

    setBlocks(updatedBlocks);

    if (boardId) {
      const blockIds = newBlockOrder.map((b) => b.id);
      blockService.reorderBlocks(boardId, blockIds).catch((error) => {
        console.error('Failed to reorder blocks:', error);
      });
    }
  };

  // Feature 관리
  const handleAddFeature = async (data: {
    title: string;
    description?: string;
    priority?: Priority;
    dueDate?: string;
  }) => {
    if (!boardId) return;

    try {
      const newFeature = await featureService.createFeature(boardId, {
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
    if (!boardId || !updates.id) return;

    const featureId = updates.id;

    try {
      const updatedFeature = await featureService.updateFeature(boardId, featureId, {
        title: updates.title,
        description: updates.description,
        color: updates.color,
        assignee_id: updates.assignee?.id,
        priority: updates.priority,
        due_date: updates.due_date,
      });
      setFeatures(features.map((f) => (f.id === featureId ? updatedFeature : f)));
    } catch (error) {
      console.error('Failed to update feature:', error);
      setFeatures(features.map((f) => (f.id === featureId ? { ...f, ...updates } : f)));
    }
  };

  const handleDeleteFeature = (featureId: string) => {
    setFeatures(features.filter((f) => f.id !== featureId));
    setTasks(tasks.filter((t) => t.feature_id !== featureId));
    setIsFeatureModalOpen(false);
    setSelectedFeature(null);
  };

  // Task 관리
  const handleAddSubtask = async (featureId: string, taskTitle: string) => {
    if (!boardId) return;

    const feature = features.find((f) => f.id === featureId);
    if (!feature) return;

    try {
      const newTask = await taskService.createTask(boardId, featureId, { title: taskTitle });
      setTasks([...tasks, newTask]);
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
    if (!boardId) return;

    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));

    const isOnlyChecklistUpdate = Object.keys(updates).every(key =>
      key === 'checklist_total' || key === 'checklist_completed'
    );

    if (isOnlyChecklistUpdate) {
      // 체크리스트 변경 시 스케줄 뷰 새로고침 트리거
      setScheduleRefreshKey((prev) => prev + 1);
      return;
    }

    try {
      const updatedTask = await taskService.updateTask(boardId, taskId, {
        title: updates.title,
        description: updates.description,
        assignee_id: updates.assignee?.id ?? null,
        start_date: updates.start_date ?? null,
        due_date: updates.due_date ?? null,
        estimated_minutes: updates.estimated_minutes ?? null,
      });
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === taskId ? {
          ...updatedTask,
          checklist_total: t.checklist_total,
          checklist_completed: t.checklist_completed,
        } : t))
      );
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !boardId) return;

    const feature = features.find((f) => f.id === task.feature_id);
    if (feature) {
      const newTotalTasks = feature.total_tasks - 1;
      const newCompletedTasks = task.completed ? feature.completed_tasks - 1 : feature.completed_tasks;
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
      await taskService.deleteTask(boardId, taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // Milestone 핸들러
  const handleOpenMilestoneModal = (milestone?: Milestone) => {
    setSelectedMilestone(milestone || null);
    setIsMilestoneModalOpen(true);
  };

  const handleSaveMilestone = async (data: {
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    feature_ids?: string[];
  }) => {
    if (!boardId) return;

    try {
      if (selectedMilestone) {
        // 수정
        const updated = await milestoneService.updateMilestone(boardId, selectedMilestone.id, {
          title: data.title,
          description: data.description,
          start_date: data.start_date,
          end_date: data.end_date,
        });

        // Feature 연결 변경 처리
        const currentFeatureIds = new Set(selectedMilestone.features?.map((f) => f.id) || []);
        const newFeatureIds = new Set(data.feature_ids || []);

        // 제거할 Feature들
        const featuresToRemove = [...currentFeatureIds].filter((id) => !newFeatureIds.has(id));
        // 추가할 Feature들
        const featuresToAdd = [...newFeatureIds].filter((id) => !currentFeatureIds.has(id));

        // Feature 제거
        for (const featureId of featuresToRemove) {
          await milestoneService.removeFeature(boardId, selectedMilestone.id, featureId);
        }

        // Feature 추가
        if (featuresToAdd.length > 0) {
          await milestoneService.addFeatures(boardId, selectedMilestone.id, featuresToAdd);
        }

        // 최신 마일스톤 데이터 다시 조회
        const refreshedMilestone = await milestoneService.getMilestone(boardId, selectedMilestone.id);
        setMilestones((prev) => prev.map((m) => (m.id === refreshedMilestone.id ? refreshedMilestone : m)));
      } else {
        // 생성
        const created = await milestoneService.createMilestone(boardId, data);
        setMilestones((prev) => [...prev, created]);

        // 생성된 마일스톤으로 보드 선택 업데이트
        await boardService.updateSelectedMilestone(boardId, created.id);
        setBoard((prev) => prev ? { ...prev, selected_milestone_id: created.id } : prev);
      }
    } catch (error) {
      console.error('Failed to save milestone:', error);
      throw error;
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!boardId) return;

    try {
      await milestoneService.deleteMilestone(boardId, milestoneId);
      setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
    } catch (error) {
      console.error('Failed to delete milestone:', error);
      throw error;
    }
  };

  const handleMoveTask = async (taskId: string, targetBlockId: string, newPosition: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !boardId) return;

    const doneBlock = blocks.find((b) => b.fixed_type === 'DONE');
    const targetBlock = blocks.find((b) => b.id === targetBlockId);
    const wasInDone = doneBlock?.id === task.block_id;
    const isMovingToDone = doneBlock?.id === targetBlockId;
    const isNowCompleted = isMovingToDone;

    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === taskId
          ? { ...t, block_id: targetBlockId, block_name: targetBlock?.name, completed: isNowCompleted, position: newPosition }
          : t
      )
    );

    if (wasInDone !== isMovingToDone) {
      const feature = features.find((f) => f.id === task.feature_id);
      if (feature) {
        const newCompletedTasks = isMovingToDone
          ? Math.min(feature.completed_tasks + 1, feature.total_tasks)
          : Math.max(feature.completed_tasks - 1, 0);

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
      await taskService.moveTask(boardId, taskId, targetBlockId, newPosition);
      const tasksData = await taskService.getTasks(boardId);
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  const handleReorderTask = async (taskId: string, blockId: string, newPosition: number) => {
    if (!boardId) return;

    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === taskId ? { ...t, position: newPosition } : t))
    );

    try {
      await taskService.moveTask(boardId, taskId, blockId, newPosition);
      const tasksData = await taskService.getTasks(boardId);
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to reorder task:', error);
    }
  };

  const handleToggleChecklistExpand = (taskId: string) => {
    setExpandedChecklistTaskIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) newSet.delete(taskId);
      else newSet.add(taskId);
      return newSet;
    });
  };

  const getTasksForBlock = (blockId: string) => {
    return filteredTasks
      .filter((task) => task.block_id === blockId)
      .sort((a, b) => a.position - b.position);
  };

  const handleCreateTag = async (name: string, color: string) => {
    if (!boardId) return;

    const tempId = `tag_temp_${Date.now()}`;
    const newTag: Tag = { id: tempId, name, color };
    setTags([...tags, newTag]);

    try {
      const createdTag = await tagService.createTag(boardId, { name, color });
      setTags((prevTags) => prevTags.map((t) => (t.id === tempId ? createdTag : t)));
      return createdTag.id;
    } catch (error) {
      console.error('Failed to create tag:', error);
      setTags((prevTags) => prevTags.filter((t) => t.id !== tempId));
    }
  };

  // 필터링
  const filteredFeatures = useMemo(() => {
    return features.filter((feature) => {
      if (filterOptions.keyword && !feature.title.toLowerCase().includes(filterOptions.keyword.toLowerCase())) {
        return false;
      }
      if (filterOptions.members.length > 0 && !filterOptions.members.some((m) => feature.assignee?.name === m)) {
        return false;
      }
      if (filterOptions.tags.length > 0 && !filterOptions.tags.some((tagId) => feature.tags?.some((t) => t.id === tagId))) {
        return false;
      }
      return true;
    });
  }, [features, filterOptions]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterOptions.keyword && !task.title.toLowerCase().includes(filterOptions.keyword.toLowerCase())) {
        return false;
      }
      if (filterOptions.members.length > 0 && !filterOptions.members.some((m) => task.assignee?.name === m)) {
        return false;
      }
      if (filterOptions.features.length > 0 && !filterOptions.features.includes(task.feature_id)) {
        return false;
      }
      if (filterOptions.tags.length > 0 && !filterOptions.tags.some((tagId) => task.tags?.some((t) => t.id === tagId))) {
        return false;
      }
      if (filterOptions.cardStatus.length > 0) {
        const hasStatus =
          (filterOptions.cardStatus.includes('completed') && task.completed) ||
          (filterOptions.cardStatus.includes('incomplete') && !task.completed);
        if (!hasStatus) return false;
      }
      return true;
    });
  }, [tasks, filterOptions]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1d2125] flex items-center justify-center">
        <div className="text-white text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <DragProvider>
      <div className="min-h-screen bg-[#1d2125] flex flex-col">
        <TrialBanner
          status="trial"
          daysRemaining={5}
          onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
        />

        <header className="bg-[#282e33] border-b border-gray-800">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between max-w-full">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/boards')}
                  className="text-gray-300 hover:text-white hover:bg-[#3a4149]"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  보드
                </Button>
                <div className="h-6 w-px bg-gray-700" />
                <h1 className="text-xl font-bold text-white">
                  {board?.name || '팀 칸반보드'}
                </h1>
                <div className="h-6 w-px bg-gray-700" />
                {/* 뷰 모드 전환 탭 */}
                <div className="flex items-center bg-[#1d2125] rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'kanban'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-[#3a4149]'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    칸반보드
                  </button>
                  <button
                    onClick={() => setViewMode('weekly')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'weekly'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-[#3a4149]'
                    }`}
                  >
                    <CalendarDays className="h-4 w-4" />
                    위클리스케줄
                  </button>
                  <button
                    onClick={() => setViewMode('schedule')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'schedule'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-[#3a4149]'
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    데일리스케줄
                  </button>
                </div>
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
                    onOpenSettings={() => {}}
                    onLogout={logout}
                  />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* 뷰 모드에 따른 컨텐츠 렌더링 */}
        {viewMode === 'weekly' ? (
          <main className="flex-1 overflow-hidden">
            <WeeklyScheduleView
              boardId={boardId || ''}
              features={features}
              tasks={tasks}
              milestones={milestones}
              onViewFeature={(featureId) => {
                const feature = features.find((f) => f.id === featureId);
                if (feature) handleFeatureClick(feature);
              }}
              onViewTask={(taskId) => {
                const task = tasks.find((t) => t.id === taskId);
                if (task) handleTaskClick(task);
              }}
              onUpdateTaskDates={async (taskId, startDate, endDate) => {
                try {
                  const updatedTask = await taskService.updateTaskDates(boardId || '', taskId, {
                    start_date: startDate,
                    end_date: endDate,
                  });
                  // 로컬 상태 업데이트
                  setTasks((prev) =>
                    prev.map((t) =>
                      t.id === taskId
                        ? { ...t, start_date: updatedTask.start_date, due_date: updatedTask.due_date }
                        : t
                    )
                  );
                } catch (error) {
                  console.error('Failed to update task dates:', error);
                }
              }}
              onCreateMilestone={() => handleOpenMilestoneModal()}
              onEditMilestone={(milestone) => handleOpenMilestoneModal(milestone)}
              initialSelectedMilestoneId={board?.selected_milestone_id}
              onMilestoneChange={async (milestoneId) => {
                try {
                  await boardService.updateSelectedMilestone(boardId || '', milestoneId);
                  setBoard((prev) => prev ? { ...prev, selected_milestone_id: milestoneId } : prev);
                } catch (error) {
                  console.error('Failed to save selected milestone:', error);
                }
              }}
            />
          </main>
        ) : viewMode === 'kanban' ? (
          <main className="p-6 overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {sortedBlocks.map((block, index) => {
              const customBlocks = sortedBlocks.filter((b) => b.type === 'CUSTOM');
              const customBlockIndex = customBlocks.findIndex((b) => b.id === block.id);

              return (
                <div key={block.id} className="flex items-start gap-4">
                  {block.fixed_type === 'FEATURE' ? (
                    <div className="flex flex-col bg-[#282e33] rounded-lg min-w-[280px] max-w-[280px]">
                      <div className="flex items-center justify-between p-4 border-b border-gray-700">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{block.name}</h3>
                          <span className="text-sm text-gray-400">{filteredFeatures.length}</span>
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
                      onEditBlock={block.type === 'CUSTOM' ? () => {} : undefined}
                      onDeleteBlock={block.type === 'CUSTOM' ? () => handleDeleteBlock(block.id) : undefined}
                      onMoveBlockLeft={
                        block.type === 'CUSTOM' && customBlockIndex > 0
                          ? () => handleMoveBlock(block.id, 'left')
                          : undefined
                      }
                      onMoveBlockRight={
                        block.type === 'CUSTOM' && customBlockIndex < customBlocks.length - 1
                          ? () => handleMoveBlock(block.id, 'right')
                          : undefined
                      }
                      canMoveLeft={block.type === 'CUSTOM' && customBlockIndex > 0}
                      canMoveRight={block.type === 'CUSTOM' && customBlockIndex < customBlocks.length - 1}
                      availableTags={tags}
                      boardId={boardId || ''}
                      expandedChecklistTaskIds={expandedChecklistTaskIds}
                      onToggleChecklistExpand={handleToggleChecklistExpand}
                      blockIndex={index}
                      onMoveBlockDrag={handleMoveBlockDrag}
                    />
                  )}

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
        ) : (
          <main className="flex-1 overflow-hidden">
            <DailyScheduleView
              boardId={boardId || ''}
              boardMembers={boardMembersData}
              onViewFeature={(featureId) => {
                const feature = features.find((f) => f.id === featureId);
                if (feature) handleFeatureClick(feature);
              }}
              onViewTask={(taskId) => {
                const task = tasks.find((t) => t.id === taskId);
                if (task) handleTaskClick(task);
              }}
              refreshTrigger={scheduleRefreshKey}
            />
          </main>
        )}

        {/* 모달들 */}
        <FeatureDetailModal
          feature={selectedFeature}
          tasks={selectedFeature ? tasks.filter((t) => t.feature_id === selectedFeature.id) : []}
          blocks={blocks}
          open={isFeatureModalOpen}
          onClose={() => { setIsFeatureModalOpen(false); setSelectedFeature(null); }}
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
          onClose={() => { setIsTaskModalOpen(false); setSelectedTask(null); }}
          onUpdate={(updates) => selectedTask && handleUpdateTask(selectedTask.id, updates)}
          onDelete={handleDeleteTask}
          availableTags={tags}
          onCreateTag={handleCreateTag}
          boardMembers={boardMembersData}
          currentUser={currentUser}
          boardId={boardId || ''}
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
          availableMembers={availableMembers}
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
          inviteLinks={inviteLinks}
          onCreateInviteLink={handleCreateInviteLink}
          onDeleteInviteLink={handleDeleteInviteLink}
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
          boardId={boardId || ''}
          activities={activities}
          hasMore={hasMoreActivity}
          onLoadMore={handleLoadMoreActivity}
        />

        <MilestoneModal
          isOpen={isMilestoneModalOpen}
          onClose={() => {
            setIsMilestoneModalOpen(false);
            setSelectedMilestone(null);
          }}
          milestone={selectedMilestone}
          features={features}
          onSave={handleSaveMilestone}
          onDelete={handleDeleteMilestone}
        />
      </div>
    </DragProvider>
  );
}
