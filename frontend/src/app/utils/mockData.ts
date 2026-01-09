import { Board } from '../components/BoardListPage';
import { Feature, Task, Block, Tag, TeamMember } from '../types';

// ========================================
// Mock Boards
// ========================================

export const mockBoards: Board[] = [
  {
    id: '1',
    name: '프로젝트 관리',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    isStarred: true,
    memberCount: 5,
  },
  {
    id: '2',
    name: '마케팅 캠페인',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    isStarred: false,
    memberCount: 3,
  },
  {
    id: '3',
    name: '제품 로드맵',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    isStarred: true,
    memberCount: 8,
  },
];

// ========================================
// Mock Blocks
// ========================================

export const mockBlocks: Block[] = [
  { id: 'feature', name: 'Feature', type: 'fixed', order: 0 },
  { id: 'task', name: 'Task', type: 'fixed', order: 1 },
  { id: 'done', name: 'Done', type: 'fixed', order: 3 },
];

// ========================================
// Mock Features
// ========================================

export const mockFeatures: Feature[] = [
  {
    id: '1',
    title: '사용자 인증 시스템',
    description: '로그인, 회원가입, 비밀번호 찾기 기능',
    color: '#3b82f6',
    progress: 60,
    dueDate: '2026-01-15',
    tagIds: ['tag1', 'tag2'],
    assignees: ['member1', 'member2'],
  },
  {
    id: '2',
    title: '대시보드 UI 개선',
    description: '사용자 경험 향상을 위한 대시보드 리디자인',
    color: '#10b981',
    progress: 30,
    dueDate: '2026-01-20',
    tagIds: ['tag3'],
    assignees: ['member3'],
  },
];

// ========================================
// Mock Tasks
// ========================================

export const mockTasks: Task[] = [
  {
    id: 'task1',
    featureId: '1',
    title: 'JWT 토큰 인증 구현',
    description: 'JWT 기반 인증 시스템 구현',
    blockId: 'task',
    order: 0,
    dueDate: '2026-01-12',
    tagIds: ['tag1'],
    assignees: ['member1'],
    checklist: [
      { id: 'c1', text: 'JWT 라이브러리 설치', completed: true },
      { id: 'c2', text: '토큰 발급 API 구현', completed: true },
      { id: 'c3', text: '토큰 검증 미들웨어 작성', completed: false },
    ],
  },
  {
    id: 'task2',
    featureId: '1',
    title: '소셜 로그인 연동',
    description: 'Google, GitHub 소셜 로그인',
    blockId: 'task',
    order: 1,
    tagIds: ['tag2'],
    assignees: ['member2'],
  },
  {
    id: 'task3',
    featureId: '2',
    title: '차트 컴포넌트 개발',
    description: 'Recharts를 활용한 데이터 시각화',
    blockId: 'done',
    order: 0,
    dueDate: '2026-01-10',
    tagIds: ['tag3'],
    assignees: ['member3'],
  },
];

// ========================================
// Mock Tags
// ========================================

export const mockTags: Tag[] = [
  { id: 'tag1', name: 'Backend', color: '#3b82f6' },
  { id: 'tag2', name: 'Frontend', color: '#10b981' },
  { id: 'tag3', name: 'Design', color: '#f59e0b' },
  { id: 'tag4', name: 'Bug', color: '#ef4444' },
];

// ========================================
// Mock Members
// ========================================

export const mockMembers: TeamMember[] = [
  {
    id: 'member1',
    name: '김철수',
    email: 'kim@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kim',
    role: 'owner',
  },
  {
    id: 'member2',
    name: '이영희',
    email: 'lee@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lee',
    role: 'admin',
  },
  {
    id: 'member3',
    name: '박민수',
    email: 'park@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=park',
    role: 'member',
  },
];

// ========================================
// Helper Functions
// ========================================

// LocalStorage에서 데이터 로드
export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage`, error);
    return defaultValue;
  }
}

// LocalStorage에 데이터 저장
export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage`, error);
  }
}

// 초기 목업 데이터 로드
export function initializeMockData() {
  const boards = loadFromLocalStorage('kanban_boards', mockBoards);
  const features = loadFromLocalStorage('kanban_features', mockFeatures);
  const tasks = loadFromLocalStorage('kanban_tasks', mockTasks);
  const blocks = loadFromLocalStorage('kanban_blocks', mockBlocks);
  const tags = loadFromLocalStorage('kanban_tags', mockTags);
  const members = loadFromLocalStorage('kanban_members', mockMembers);

  return {
    boards,
    features,
    tasks,
    blocks,
    tags,
    members,
  };
}
