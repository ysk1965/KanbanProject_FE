import {
  boardAPI,
  featureAPI,
  taskAPI,
  blockAPI,
  tagAPI,
  memberAPI,
  authAPI,
  inviteLinkAPI,
  subscriptionAPI,
  activityAPI,
  pricingAPI,
  checklistAPI,
  milestoneAPI,
} from './api';
import {
  mockBoards,
  mockFeatures,
  mockTasks,
  mockBlocks,
  mockTags,
  mockMembers,
  loadFromLocalStorage,
  saveToLocalStorage,
} from './mockData';
import type {
  Board,
  Feature,
  Task,
  Block,
  Tag,
  BoardMember,
  InviteLink,
  InviteResult,
  Subscription,
  ActivityLog,
  PricingPlan,
  ChecklistItem,
  User,
  Milestone,
} from '../types';

// API 호출 실패 시 목업 데이터 사용
const USE_MOCK_ON_ERROR = true;

// ========================================
// Board Service
// ========================================

export const boardService = {
  getBoards: async (): Promise<Board[]> => {
    try {
      const boards = await boardAPI.getBoards();
      return boards;
    } catch (error) {
      console.warn('API failed, using mock data for boards', error);
      if (USE_MOCK_ON_ERROR) {
        return loadFromLocalStorage('kanban_boards', mockBoards);
      }
      throw error;
    }
  },

  getBoard: async (boardId: string): Promise<Board> => {
    try {
      const board = await boardAPI.getBoard(boardId);
      return board;
    } catch (error) {
      console.warn('API failed, using mock data for board', error);
      if (USE_MOCK_ON_ERROR) {
        const boards = loadFromLocalStorage('kanban_boards', mockBoards);
        const board = boards.find((b: Board) => b.id === boardId);
        if (board) return board;
      }
      throw error;
    }
  },

  createBoard: async (name: string, description?: string): Promise<Board> => {
    try {
      const board = await boardAPI.createBoard({ name, description });
      return board;
    } catch (error) {
      console.warn('API failed, using mock data for create board', error);
      if (USE_MOCK_ON_ERROR) {
        const boards = loadFromLocalStorage('kanban_boards', mockBoards);
        const newBoard: Board = {
          id: `board-${Date.now()}`,
          name,
          description,
          is_starred: false,
          member_count: 1,
          subscription: {
            status: 'TRIAL',
            plan: null,
            trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            current_period_end: null,
          },
          created_at: new Date().toISOString(),
        };
        const updatedBoards = [...boards, newBoard];
        saveToLocalStorage('kanban_boards', updatedBoards);
        return newBoard;
      }
      throw error;
    }
  },

  toggleStar: async (boardId: string): Promise<{ board_id: string; is_starred: boolean }> => {
    try {
      const result = await boardAPI.toggleStar(boardId);
      return result;
    } catch (error) {
      console.warn('API failed, using mock data for toggle star', error);
      if (USE_MOCK_ON_ERROR) {
        const boards = loadFromLocalStorage('kanban_boards', mockBoards);
        const board = boards.find((b: Board) => b.id === boardId);
        const newStarred = !board?.is_starred;
        const updatedBoards = boards.map((b: Board) =>
          b.id === boardId ? { ...b, is_starred: newStarred } : b
        );
        saveToLocalStorage('kanban_boards', updatedBoards);
        return { board_id: boardId, is_starred: newStarred };
      }
      throw error;
    }
  },

  deleteBoard: async (boardId: string): Promise<void> => {
    try {
      await boardAPI.deleteBoard(boardId);
    } catch (error) {
      console.warn('API failed, using mock data for delete board', error);
      if (USE_MOCK_ON_ERROR) {
        const boards = loadFromLocalStorage('kanban_boards', mockBoards);
        const updatedBoards = boards.filter((b: Board) => b.id !== boardId);
        saveToLocalStorage('kanban_boards', updatedBoards);
        return;
      }
      throw error;
    }
  },

  updateSelectedMilestone: async (boardId: string, milestoneId: string | null): Promise<Board> => {
    try {
      const board = await boardAPI.updateSelectedMilestone(boardId, milestoneId);
      return board;
    } catch (error) {
      console.warn('API failed for updateSelectedMilestone', error);
      throw error;
    }
  },
};

// ========================================
// Block Service
// ========================================

export const blockService = {
  getBlocks: async (boardId: string): Promise<Block[]> => {
    try {
      const response = await blockAPI.getBlocks(boardId);
      return response.blocks;
    } catch (error) {
      console.warn('API failed, using mock data for blocks', error);
      if (USE_MOCK_ON_ERROR) {
        return loadFromLocalStorage('kanban_blocks', mockBlocks);
      }
      throw error;
    }
  },

  createBlock: async (boardId: string, data: { name: string; color: string }): Promise<Block> => {
    try {
      const block = await blockAPI.createBlock(boardId, data);
      return block;
    } catch (error) {
      console.warn('API failed, using mock data for create block', error);
      if (USE_MOCK_ON_ERROR) {
        const blocks = loadFromLocalStorage('kanban_blocks', mockBlocks);
        const maxPosition = Math.max(...blocks.map((b: Block) => b.position), 0);
        const newBlock: Block = {
          id: `block-${Date.now()}`,
          name: data.name,
          color: data.color,
          type: 'CUSTOM',
          fixed_type: null,
          position: maxPosition + 1,
        };
        const updatedBlocks = [...blocks, newBlock];
        saveToLocalStorage('kanban_blocks', updatedBlocks);
        return newBlock;
      }
      throw error;
    }
  },

  updateBlock: async (
    boardId: string,
    blockId: string,
    data: { name?: string; color?: string }
  ): Promise<Block> => {
    try {
      const block = await blockAPI.updateBlock(boardId, blockId, data);
      return block;
    } catch (error) {
      console.warn('API failed, using mock data for update block', error);
      if (USE_MOCK_ON_ERROR) {
        const blocks = loadFromLocalStorage('kanban_blocks', mockBlocks);
        const updatedBlocks = blocks.map((b: Block) =>
          b.id === blockId ? { ...b, ...data } : b
        );
        saveToLocalStorage('kanban_blocks', updatedBlocks);
        return updatedBlocks.find((b: Block) => b.id === blockId)!;
      }
      throw error;
    }
  },

  deleteBlock: async (boardId: string, blockId: string): Promise<void> => {
    try {
      await blockAPI.deleteBlock(boardId, blockId);
    } catch (error) {
      console.warn('API failed, using mock data for delete block', error);
      if (USE_MOCK_ON_ERROR) {
        const blocks = loadFromLocalStorage('kanban_blocks', mockBlocks);
        const updatedBlocks = blocks.filter((b: Block) => b.id !== blockId);
        saveToLocalStorage('kanban_blocks', updatedBlocks);
        return;
      }
      throw error;
    }
  },

  reorderBlocks: async (boardId: string, blockIds: string[]): Promise<Block[]> => {
    try {
      const response = await blockAPI.reorderBlocks(boardId, blockIds);
      return response.blocks;
    } catch (error) {
      console.warn('API failed, using mock data for reorder blocks', error);
      if (USE_MOCK_ON_ERROR) {
        const blocks = loadFromLocalStorage('kanban_blocks', mockBlocks);
        const updatedBlocks = blockIds.map((id, index) => {
          const block = blocks.find((b: Block) => b.id === id);
          return block ? { ...block, position: index } : null;
        }).filter(Boolean) as Block[];
        saveToLocalStorage('kanban_blocks', updatedBlocks);
        return updatedBlocks;
      }
      throw error;
    }
  },
};

// ========================================
// Feature Service
// ========================================

export const featureService = {
  getFeatures: async (boardId: string): Promise<Feature[]> => {
    try {
      const response = await featureAPI.getFeatures(boardId);
      return response.features;
    } catch (error) {
      console.warn('API failed, using mock data for features', error);
      if (USE_MOCK_ON_ERROR) {
        return loadFromLocalStorage('kanban_features', mockFeatures);
      }
      throw error;
    }
  },

  getFeature: async (boardId: string, featureId: string): Promise<Feature> => {
    try {
      const feature = await featureAPI.getFeature(boardId, featureId);
      return feature;
    } catch (error) {
      console.warn('API failed, using mock data for feature', error);
      if (USE_MOCK_ON_ERROR) {
        const features = loadFromLocalStorage('kanban_features', mockFeatures);
        return features.find((f: Feature) => f.id === featureId);
      }
      throw error;
    }
  },

  createFeature: async (
    boardId: string,
    data: {
      title: string;
      description?: string;
      color?: string;
      assignee_id?: string;
      priority?: 'HIGH' | 'MEDIUM' | 'LOW';
      due_date?: string;
    }
  ): Promise<Feature> => {
    try {
      const feature = await featureAPI.createFeature(boardId, data);
      return feature;
    } catch (error) {
      console.warn('API failed, using mock data for create feature', error);
      if (USE_MOCK_ON_ERROR) {
        const features = loadFromLocalStorage('kanban_features', mockFeatures);
        const newFeature: Feature = {
          id: `feature-${Date.now()}`,
          title: data.title,
          description: data.description,
          color: data.color || '#3B82F6',
          assignee: null,
          priority: data.priority || null,
          due_date: data.due_date || null,
          status: 'ACTIVE',
          total_tasks: 0,
          completed_tasks: 0,
          progress_percentage: 0,
          position: features.length,
          tags: [],
          created_at: new Date().toISOString(),
        };
        const updatedFeatures = [...features, newFeature];
        saveToLocalStorage('kanban_features', updatedFeatures);
        return newFeature;
      }
      throw error;
    }
  },

  updateFeature: async (
    boardId: string,
    featureId: string,
    data: {
      title?: string;
      description?: string;
      color?: string;
      assignee_id?: string | null;
      priority?: 'HIGH' | 'MEDIUM' | 'LOW' | null;
      due_date?: string | null;
    }
  ): Promise<Feature> => {
    try {
      const feature = await featureAPI.updateFeature(boardId, featureId, data);
      return feature;
    } catch (error) {
      console.warn('API failed, using mock data for update feature', error);
      if (USE_MOCK_ON_ERROR) {
        const features = loadFromLocalStorage('kanban_features', mockFeatures);
        const updatedFeatures = features.map((f: Feature) =>
          f.id === featureId ? { ...f, ...data } : f
        );
        saveToLocalStorage('kanban_features', updatedFeatures);
        return updatedFeatures.find((f: Feature) => f.id === featureId)!;
      }
      throw error;
    }
  },

  deleteFeature: async (boardId: string, featureId: string): Promise<void> => {
    try {
      await featureAPI.deleteFeature(boardId, featureId);
    } catch (error) {
      console.warn('API failed, using mock data for delete feature', error);
      if (USE_MOCK_ON_ERROR) {
        const features = loadFromLocalStorage('kanban_features', mockFeatures);
        const updatedFeatures = features.filter((f: Feature) => f.id !== featureId);
        saveToLocalStorage('kanban_features', updatedFeatures);
        return;
      }
      throw error;
    }
  },

  reorderFeatures: async (boardId: string, featureIds: string[]): Promise<Feature[]> => {
    try {
      const response = await featureAPI.reorderFeatures(boardId, featureIds);
      return response.features;
    } catch (error) {
      console.warn('API failed, using mock data for reorder features', error);
      if (USE_MOCK_ON_ERROR) {
        const features = loadFromLocalStorage('kanban_features', mockFeatures);
        const updatedFeatures = featureIds.map((id, index) => {
          const feature = features.find((f: Feature) => f.id === id);
          return feature ? { ...feature, position: index } : null;
        }).filter(Boolean) as Feature[];
        saveToLocalStorage('kanban_features', updatedFeatures);
        return updatedFeatures;
      }
      throw error;
    }
  },

  addTag: async (boardId: string, featureId: string, tagId: string): Promise<Tag[]> => {
    try {
      const tags = await featureAPI.addTag(boardId, featureId, tagId);
      return tags;
    } catch (error) {
      console.warn('API failed for add tag to feature', error);
      throw error;
    }
  },

  removeTag: async (boardId: string, featureId: string, tagId: string): Promise<void> => {
    try {
      await featureAPI.removeTag(boardId, featureId, tagId);
    } catch (error) {
      console.warn('API failed for remove tag from feature', error);
      throw error;
    }
  },
};

// ========================================
// Task Service
// ========================================

export const taskService = {
  getTasks: async (
    boardId: string,
    params?: { block_id?: string; feature_id?: string }
  ): Promise<Task[]> => {
    try {
      const response = await taskAPI.getTasks(boardId, params);
      return response.tasks;
    } catch (error) {
      console.warn('API failed, using mock data for tasks', error);
      if (USE_MOCK_ON_ERROR) {
        let tasks = loadFromLocalStorage('kanban_tasks', mockTasks);
        if (params?.block_id) {
          tasks = tasks.filter((t: Task) => t.block_id === params.block_id);
        }
        if (params?.feature_id) {
          tasks = tasks.filter((t: Task) => t.feature_id === params.feature_id);
        }
        return tasks;
      }
      throw error;
    }
  },

  getTask: async (boardId: string, taskId: string): Promise<Task> => {
    try {
      const task = await taskAPI.getTask(boardId, taskId);
      return task;
    } catch (error) {
      console.warn('API failed, using mock data for task', error);
      if (USE_MOCK_ON_ERROR) {
        const tasks = loadFromLocalStorage('kanban_tasks', mockTasks);
        return tasks.find((t: Task) => t.id === taskId);
      }
      throw error;
    }
  },

  createTask: async (
    boardId: string,
    featureId: string,
    data: {
      title: string;
      description?: string;
      assignee_id?: string;
      start_date?: string;
      due_date?: string;
      estimated_minutes?: number;
    }
  ): Promise<Task> => {
    try {
      const task = await taskAPI.createTask(boardId, featureId, data);
      return task;
    } catch (error) {
      console.warn('API failed, using mock data for create task', error);
      if (USE_MOCK_ON_ERROR) {
        const tasks = loadFromLocalStorage('kanban_tasks', mockTasks);
        const features = loadFromLocalStorage('kanban_features', mockFeatures);
        const blocks = loadFromLocalStorage('kanban_blocks', mockBlocks);
        const feature = features.find((f: Feature) => f.id === featureId);
        const taskBlock = blocks.find((b: Block) => b.fixed_type === 'TASK');

        const newTask: Task = {
          id: `task-${Date.now()}`,
          feature_id: featureId,
          feature_title: feature?.title || '',
          feature_color: feature?.color || '#3B82F6',
          block_id: taskBlock?.id || 'task-block',
          title: data.title,
          description: data.description,
          assignee: null,
          start_date: data.start_date || null,
          due_date: data.due_date || null,
          estimated_minutes: data.estimated_minutes || null,
          completed: false,
          position: tasks.filter((t: Task) => t.feature_id === featureId).length,
          tags: [],
          created_at: new Date().toISOString(),
        };
        const updatedTasks = [...tasks, newTask];
        saveToLocalStorage('kanban_tasks', updatedTasks);
        return newTask;
      }
      throw error;
    }
  },

  updateTask: async (
    boardId: string,
    taskId: string,
    data: {
      title?: string;
      description?: string;
      assignee_id?: string | null;
      start_date?: string | null;
      due_date?: string | null;
      estimated_minutes?: number | null;
    }
  ): Promise<Task> => {
    try {
      const task = await taskAPI.updateTask(boardId, taskId, data);
      return task;
    } catch (error) {
      console.warn('API failed, using mock data for update task', error);
      if (USE_MOCK_ON_ERROR) {
        const tasks = loadFromLocalStorage('kanban_tasks', mockTasks);
        const updatedTasks = tasks.map((t: Task) =>
          t.id === taskId ? { ...t, ...data } : t
        );
        saveToLocalStorage('kanban_tasks', updatedTasks);
        return updatedTasks.find((t: Task) => t.id === taskId)!;
      }
      throw error;
    }
  },

  deleteTask: async (boardId: string, taskId: string): Promise<void> => {
    try {
      await taskAPI.deleteTask(boardId, taskId);
    } catch (error) {
      console.warn('API failed, using mock data for delete task', error);
      if (USE_MOCK_ON_ERROR) {
        const tasks = loadFromLocalStorage('kanban_tasks', mockTasks);
        const updatedTasks = tasks.filter((t: Task) => t.id !== taskId);
        saveToLocalStorage('kanban_tasks', updatedTasks);
        return;
      }
      throw error;
    }
  },

  moveTask: async (
    boardId: string,
    taskId: string,
    targetBlockId: string,
    position: number
  ): Promise<Task> => {
    try {
      const task = await taskAPI.moveTask(boardId, taskId, {
        target_block_id: targetBlockId,
        position,
      });
      return task;
    } catch (error) {
      console.warn('API failed, using mock data for move task', error);
      if (USE_MOCK_ON_ERROR) {
        const tasks = loadFromLocalStorage('kanban_tasks', mockTasks);
        const blocks = loadFromLocalStorage('kanban_blocks', mockBlocks);
        const doneBlock = blocks.find((b: Block) => b.fixed_type === 'DONE');
        const isCompleted = doneBlock?.id === targetBlockId;

        const updatedTasks = tasks.map((t: Task) =>
          t.id === taskId
            ? { ...t, block_id: targetBlockId, position, completed: isCompleted }
            : t
        );
        saveToLocalStorage('kanban_tasks', updatedTasks);
        return updatedTasks.find((t: Task) => t.id === taskId)!;
      }
      throw error;
    }
  },

  updateTaskDates: async (
    boardId: string,
    taskId: string,
    data: {
      start_date?: string | null;
      end_date?: string | null;
    }
  ): Promise<Task> => {
    try {
      const task = await taskAPI.updateTaskDates(boardId, taskId, data);
      return task;
    } catch (error) {
      console.warn('API failed, using mock data for update task dates', error);
      if (USE_MOCK_ON_ERROR) {
        const tasks = loadFromLocalStorage('kanban_tasks', mockTasks);
        const updatedTasks = tasks.map((t: Task) =>
          t.id === taskId
            ? { ...t, start_date: data.start_date ?? t.start_date, due_date: data.end_date ?? t.due_date }
            : t
        );
        saveToLocalStorage('kanban_tasks', updatedTasks);
        return updatedTasks.find((t: Task) => t.id === taskId)!;
      }
      throw error;
    }
  },

  addTag: async (boardId: string, taskId: string, tagId: string): Promise<Tag[]> => {
    try {
      const tags = await taskAPI.addTag(boardId, taskId, tagId);
      return tags;
    } catch (error) {
      console.warn('API failed for add tag to task', error);
      throw error;
    }
  },

  removeTag: async (boardId: string, taskId: string, tagId: string): Promise<void> => {
    try {
      await taskAPI.removeTag(boardId, taskId, tagId);
    } catch (error) {
      console.warn('API failed for remove tag from task', error);
      throw error;
    }
  },
};

// ========================================
// Tag Service
// ========================================

export const tagService = {
  getTags: async (boardId: string): Promise<Tag[]> => {
    try {
      const response = await tagAPI.getTags(boardId);
      return response.tags;
    } catch (error) {
      console.warn('API failed, using mock data for tags', error);
      if (USE_MOCK_ON_ERROR) {
        return loadFromLocalStorage('kanban_tags', mockTags);
      }
      throw error;
    }
  },

  createTag: async (boardId: string, data: { name: string; color: string }): Promise<Tag> => {
    try {
      const tag = await tagAPI.createTag(boardId, data);
      return tag;
    } catch (error) {
      console.warn('API failed, using mock data for create tag', error);
      if (USE_MOCK_ON_ERROR) {
        const tags = loadFromLocalStorage('kanban_tags', mockTags);
        const newTag: Tag = {
          id: `tag-${Date.now()}`,
          name: data.name,
          color: data.color,
          created_at: new Date().toISOString(),
        };
        const updatedTags = [...tags, newTag];
        saveToLocalStorage('kanban_tags', updatedTags);
        return newTag;
      }
      throw error;
    }
  },

  updateTag: async (
    boardId: string,
    tagId: string,
    data: { name?: string; color?: string }
  ): Promise<Tag> => {
    try {
      const tag = await tagAPI.updateTag(boardId, tagId, data);
      return tag;
    } catch (error) {
      console.warn('API failed, using mock data for update tag', error);
      if (USE_MOCK_ON_ERROR) {
        const tags = loadFromLocalStorage('kanban_tags', mockTags);
        const updatedTags = tags.map((t: Tag) =>
          t.id === tagId ? { ...t, ...data } : t
        );
        saveToLocalStorage('kanban_tags', updatedTags);
        return updatedTags.find((t: Tag) => t.id === tagId)!;
      }
      throw error;
    }
  },

  deleteTag: async (boardId: string, tagId: string): Promise<void> => {
    try {
      await tagAPI.deleteTag(boardId, tagId);
    } catch (error) {
      console.warn('API failed, using mock data for delete tag', error);
      if (USE_MOCK_ON_ERROR) {
        const tags = loadFromLocalStorage('kanban_tags', mockTags);
        const updatedTags = tags.filter((t: Tag) => t.id !== tagId);
        saveToLocalStorage('kanban_tags', updatedTags);
        return;
      }
      throw error;
    }
  },
};

// ========================================
// Checklist Service
// ========================================

export const checklistService = {
  getChecklist: async (
    boardId: string,
    taskId: string
  ): Promise<{ total: number; completed: number; items: ChecklistItem[] }> => {
    try {
      const checklist = await checklistAPI.getChecklist(boardId, taskId);
      return checklist;
    } catch (error) {
      console.warn('API failed, using mock data for checklist', error);
      if (USE_MOCK_ON_ERROR) {
        return { total: 0, completed: 0, items: [] };
      }
      throw error;
    }
  },

  addItem: async (
    boardId: string,
    taskId: string,
    data: { title: string; assignee_id?: string; due_date?: string }
  ): Promise<ChecklistItem> => {
    try {
      const item = await checklistAPI.addItem(boardId, taskId, data);
      return item;
    } catch (error) {
      console.warn('API failed for add checklist item', error);
      throw error;
    }
  },

  updateItem: async (
    boardId: string,
    taskId: string,
    itemId: string,
    data: { title?: string; assignee_id?: string | null; due_date?: string | null }
  ): Promise<ChecklistItem> => {
    try {
      const item = await checklistAPI.updateItem(boardId, taskId, itemId, data);
      return item;
    } catch (error) {
      console.warn('API failed for update checklist item', error);
      throw error;
    }
  },

  deleteItem: async (boardId: string, taskId: string, itemId: string): Promise<void> => {
    try {
      await checklistAPI.deleteItem(boardId, taskId, itemId);
    } catch (error) {
      console.warn('API failed for delete checklist item', error);
      throw error;
    }
  },

  toggleItem: async (
    boardId: string,
    taskId: string,
    itemId: string
  ): Promise<ChecklistItem> => {
    try {
      const item = await checklistAPI.toggleItem(boardId, taskId, itemId);
      return item;
    } catch (error) {
      console.warn('API failed for toggle checklist item', error);
      throw error;
    }
  },
};

// ========================================
// Member Service
// ========================================

export const memberService = {
  getMembers: async (
    boardId: string
  ): Promise<{ total: number; billable: number; members: BoardMember[] }> => {
    try {
      const response = await memberAPI.getMembers(boardId);
      return response;
    } catch (error) {
      console.warn('API failed, using mock data for members', error);
      if (USE_MOCK_ON_ERROR) {
        const members = loadFromLocalStorage('kanban_members', mockMembers);
        return { total: members.length, billable: members.length, members };
      }
      throw error;
    }
  },

  inviteMember: async (
    boardId: string,
    email: string,
    role: 'ADMIN' | 'MEMBER' | 'VIEWER'
  ): Promise<InviteResult> => {
    // 멤버 초대는 mock 폴백 없이 API 에러를 그대로 throw
    const result = await memberAPI.inviteMember(boardId, { email, role });

    // API 응답을 InviteResult 형식으로 변환
    if (result.type === 'DIRECT_ADD' && result.member) {
      return {
        type: 'DIRECT_ADD',
        member: {
          id: result.member.id,
          user: {
            id: result.member.user.id,
            email: result.member.user.email,
            name: result.member.user.name,
            profile_image: result.member.user.profile_image,
          },
          role: result.member.role,
          joined_at: result.member.joined_at,
          invited_by: result.member.invited_by,
        },
      };
    } else {
      return {
        type: 'EMAIL_SENT',
        email: result.email,
        role: result.role,
      };
    }
  },

  updateMemberRole: async (
    boardId: string,
    memberId: string,
    role: 'ADMIN' | 'MEMBER' | 'VIEWER'
  ): Promise<BoardMember> => {
    try {
      const member = await memberAPI.updateMemberRole(boardId, memberId, role);
      return member;
    } catch (error) {
      console.warn('API failed, using mock data for update member role', error);
      if (USE_MOCK_ON_ERROR) {
        const members = loadFromLocalStorage('kanban_members', mockMembers);
        const updatedMembers = members.map((m: BoardMember) =>
          m.id === memberId ? { ...m, role } : m
        );
        saveToLocalStorage('kanban_members', updatedMembers);
        return updatedMembers.find((m: BoardMember) => m.id === memberId)!;
      }
      throw error;
    }
  },

  removeMember: async (boardId: string, memberId: string): Promise<void> => {
    try {
      await memberAPI.removeMember(boardId, memberId);
    } catch (error) {
      console.warn('API failed, using mock data for remove member', error);
      if (USE_MOCK_ON_ERROR) {
        const members = loadFromLocalStorage('kanban_members', mockMembers);
        const updatedMembers = members.filter((m: BoardMember) => m.id !== memberId);
        saveToLocalStorage('kanban_members', updatedMembers);
        return;
      }
      throw error;
    }
  },
};

// ========================================
// Auth Service
// ========================================

export const authService = {
  signup: async (email: string, password: string, name: string) => {
    try {
      const response = await authAPI.signup({ email, password, name });
      localStorage.setItem('user', JSON.stringify(response.user));
      return response;
    } catch (error) {
      console.warn('API failed, using mock auth', error);
      if (USE_MOCK_ON_ERROR) {
        const mockUser: User = {
          id: `user-${Date.now()}`,
          email,
          name,
          profile_image: null,
        };
        localStorage.setItem('access_token', 'mock-access-token');
        localStorage.setItem('refresh_token', 'mock-refresh-token');
        localStorage.setItem('user', JSON.stringify(mockUser));
        return {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          token_type: 'Bearer',
          user: mockUser,
        };
      }
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      localStorage.setItem('user', JSON.stringify(response.user));
      return response;
    } catch (error) {
      console.warn('API failed, using mock auth', error);
      if (USE_MOCK_ON_ERROR) {
        const mockUser: User = {
          id: 'user-1',
          email,
          name: email.split('@')[0],
          profile_image: null,
        };
        localStorage.setItem('access_token', 'mock-access-token');
        localStorage.setItem('refresh_token', 'mock-refresh-token');
        localStorage.setItem('user', JSON.stringify(mockUser));
        return {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          token_type: 'Bearer',
          user: mockUser,
        };
      }
      throw error;
    }
  },

  googleLogin: async (idToken: string) => {
    try {
      const response = await authAPI.googleLogin(idToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      return response;
    } catch (error) {
      console.warn('Google login failed', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.warn('API failed for logout', error);
    } finally {
      authAPI.clearTokens();
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return authAPI.isAuthenticated();
  },
};

// ========================================
// Invite Link Service
// ========================================

export const inviteLinkService = {
  getInviteLinks: async (boardId: string): Promise<InviteLink[]> => {
    try {
      const response = await inviteLinkAPI.getInviteLinks(boardId);
      return response.invites;
    } catch (error) {
      console.warn('API failed, using mock data for invite links', error);
      if (USE_MOCK_ON_ERROR) {
        return loadFromLocalStorage('kanban_invite_links', []);
      }
      throw error;
    }
  },

  createInviteLink: async (
    boardId: string,
    data: {
      role: 'ADMIN' | 'MEMBER' | 'VIEWER';
      max_uses?: number | null;
      expires_in_hours?: number | null;
    }
  ): Promise<InviteLink> => {
    // 초대 링크는 반드시 백엔드 API를 통해 생성해야 함 (mock 사용 안함)
    const link = await inviteLinkAPI.createInviteLink(boardId, data);
    return link;
  },

  deleteInviteLink: async (boardId: string, linkId: string): Promise<void> => {
    await inviteLinkAPI.deleteInviteLink(boardId, linkId);
  },

  getInviteLinkInfo: async (code: string) => {
    // 초대 링크 유효성은 반드시 백엔드에서 확인해야 함 (mock 사용 안함)
    const info = await inviteLinkAPI.getInviteLinkInfo(code);
    return info;
  },

  acceptInvite: async (code: string) => {
    // 초대 수락은 반드시 백엔드에서 처리해야 함 (mock 사용 안함)
    const result = await inviteLinkAPI.acceptInvite(code);
    return result;
  },
};

// ========================================
// Subscription Service
// ========================================

export const subscriptionService = {
  getSubscription: async (boardId: string): Promise<Subscription> => {
    try {
      const subscription = await subscriptionAPI.getSubscription(boardId);
      return subscription;
    } catch (error) {
      console.warn('API failed, using mock data for subscription', error);
      if (USE_MOCK_ON_ERROR) {
        return {
          status: 'TRIAL',
          plan: null,
          billing_cycle: null,
          price: null,
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          current_period_end: null,
          billable_member_count: 1,
          member_limit: 5,
        };
      }
      throw error;
    }
  },

  startSubscription: async (
    boardId: string,
    data: { plan_id: string; billing_cycle: 'MONTHLY' | 'YEARLY'; payment_method_id: string }
  ): Promise<Subscription> => {
    try {
      const subscription = await subscriptionAPI.startSubscription(boardId, data);
      return subscription;
    } catch (error) {
      console.warn('API failed for start subscription', error);
      throw error;
    }
  },

  changePlan: async (
    boardId: string,
    data: { plan_id: string; billing_cycle: 'MONTHLY' | 'YEARLY' }
  ): Promise<Subscription> => {
    try {
      const subscription = await subscriptionAPI.changePlan(boardId, data);
      return subscription;
    } catch (error) {
      console.warn('API failed for change plan', error);
      throw error;
    }
  },

  cancelSubscription: async (boardId: string): Promise<void> => {
    try {
      await subscriptionAPI.cancelSubscription(boardId);
    } catch (error) {
      console.warn('API failed for cancel subscription', error);
      throw error;
    }
  },
};

// ========================================
// Activity Service
// ========================================

export const activityService = {
  getActivities: async (
    boardId: string,
    params?: { cursor?: string; limit?: number }
  ): Promise<{ activities: ActivityLog[]; has_more: boolean; next_cursor: string | null }> => {
    try {
      const response = await activityAPI.getActivities(boardId, params);
      return response;
    } catch (error) {
      console.warn('API failed, using mock data for activities', error);
      if (USE_MOCK_ON_ERROR) {
        return {
          activities: loadFromLocalStorage('kanban_activities', []),
          has_more: false,
          next_cursor: null,
        };
      }
      throw error;
    }
  },
};

// ========================================
// Pricing Service
// ========================================

export const pricingService = {
  getPlans: async (): Promise<{
    plans: PricingPlan[];
    currency: string;
    trial_days: string;
  }> => {
    try {
      const response = await pricingAPI.getPlans();
      return response;
    } catch (error) {
      console.warn('API failed, using mock data for pricing plans', error);
      if (USE_MOCK_ON_ERROR) {
        return {
          plans: [
            {
              id: 'team_10',
              name: '팀 10',
              min_members: 4,
              max_members: 10,
              monthly_price: 29000,
              yearly_price: 290000,
              yearly_monthly_price: 24166,
              discount_percentage: 16,
            },
            {
              id: 'team_25',
              name: '팀 25',
              min_members: 11,
              max_members: 25,
              monthly_price: 69000,
              yearly_price: 660000,
              yearly_monthly_price: 55000,
              discount_percentage: 20,
            },
            {
              id: 'team_50',
              name: '팀 50',
              min_members: 26,
              max_members: 50,
              monthly_price: 129000,
              yearly_price: 1190000,
              yearly_monthly_price: 99166,
              discount_percentage: 23,
            },
          ],
          currency: 'KRW',
          trial_days: '7',
        };
      }
      throw error;
    }
  },
};

// ========================================
// Milestone Service
// ========================================

export const milestoneService = {
  getMilestones: async (boardId: string): Promise<Milestone[]> => {
    try {
      const response = await milestoneAPI.getMilestones(boardId);
      // 각 마일스톤의 상세 정보(features 포함)를 가져옴
      const milestonesWithDetails = await Promise.all(
        response.milestones.map(async (m) => {
          try {
            const detail = await milestoneAPI.getMilestone(boardId, m.id);
            return {
              id: detail.id,
              title: detail.title,
              description: detail.description,
              start_date: detail.start_date,
              end_date: detail.end_date,
              feature_count: detail.feature_count,
              progress_percentage: detail.progress_percentage,
              features: detail.features,
              created_by: detail.created_by,
              created_at: detail.created_at,
            };
          } catch {
            // 상세 조회 실패 시 기본 정보만 반환
            return {
              id: m.id,
              title: m.title,
              start_date: m.start_date,
              end_date: m.end_date,
              feature_count: m.feature_count,
              progress_percentage: m.progress_percentage,
            };
          }
        })
      );
      return milestonesWithDetails;
    } catch (error) {
      console.warn('API failed, using empty array for milestones', error);
      if (USE_MOCK_ON_ERROR) {
        return [];
      }
      throw error;
    }
  },

  getMilestone: async (boardId: string, milestoneId: string): Promise<Milestone> => {
    try {
      const m = await milestoneAPI.getMilestone(boardId, milestoneId);
      return {
        id: m.id,
        title: m.title,
        description: m.description,
        start_date: m.start_date,
        end_date: m.end_date,
        feature_count: m.feature_count,
        progress_percentage: m.progress_percentage,
        features: m.features,
        created_by: m.created_by,
        created_at: m.created_at,
      };
    } catch (error) {
      console.warn('API failed for getMilestone', error);
      throw error;
    }
  },

  createMilestone: async (
    boardId: string,
    data: {
      title: string;
      description?: string;
      start_date: string;
      end_date: string;
      feature_ids?: string[];
    }
  ): Promise<Milestone> => {
    try {
      const m = await milestoneAPI.createMilestone(boardId, data);
      return {
        id: m.id,
        title: m.title,
        description: m.description,
        start_date: m.start_date,
        end_date: m.end_date,
        feature_count: m.feature_count,
        progress_percentage: m.progress_percentage,
        features: m.features,
        created_by: m.created_by,
        created_at: m.created_at,
      };
    } catch (error) {
      console.warn('API failed for createMilestone', error);
      throw error;
    }
  },

  updateMilestone: async (
    boardId: string,
    milestoneId: string,
    data: {
      title?: string;
      description?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<Milestone> => {
    try {
      const m = await milestoneAPI.updateMilestone(boardId, milestoneId, data);
      return {
        id: m.id,
        title: m.title,
        description: m.description,
        start_date: m.start_date,
        end_date: m.end_date,
        feature_count: m.feature_count,
        progress_percentage: m.progress_percentage,
        features: m.features,
        created_by: m.created_by,
        created_at: m.created_at,
      };
    } catch (error) {
      console.warn('API failed for updateMilestone', error);
      throw error;
    }
  },

  deleteMilestone: async (boardId: string, milestoneId: string): Promise<void> => {
    try {
      await milestoneAPI.deleteMilestone(boardId, milestoneId);
    } catch (error) {
      console.warn('API failed for deleteMilestone', error);
      throw error;
    }
  },

  addFeatures: async (
    boardId: string,
    milestoneId: string,
    featureIds: string[]
  ): Promise<Milestone> => {
    try {
      const m = await milestoneAPI.addFeatures(boardId, milestoneId, featureIds);
      return {
        id: m.id,
        title: m.title,
        description: m.description,
        start_date: m.start_date,
        end_date: m.end_date,
        feature_count: m.feature_count,
        progress_percentage: m.progress_percentage,
        features: m.features,
        created_by: m.created_by,
        created_at: m.created_at,
      };
    } catch (error) {
      console.warn('API failed for addFeatures', error);
      throw error;
    }
  },

  removeFeature: async (
    boardId: string,
    milestoneId: string,
    featureId: string
  ): Promise<void> => {
    try {
      await milestoneAPI.removeFeature(boardId, milestoneId, featureId);
    } catch (error) {
      console.warn('API failed for removeFeature', error);
      throw error;
    }
  },
};
