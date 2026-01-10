// ========================================
// 사용자 타입
// ========================================

export interface User {
  id: string;
  email: string;
  name: string;
  profile_image?: string | null;
}

// ========================================
// 역할 타입
// ========================================

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

// ========================================
// 구독 관련 타입
// ========================================

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'GRACE' | 'SUSPENDED' | 'CANCELED';

export interface Subscription {
  id?: string;
  status: SubscriptionStatus;
  plan: string | null;
  billing_cycle?: 'MONTHLY' | 'YEARLY' | null;
  price?: number | null;
  trial_ends_at: string | null;
  grace_ends_at?: string | null;
  current_period_start?: string | null;
  current_period_end: string | null;
  billable_member_count?: number;
  member_limit?: number;
  next_payment_at?: string | null;
  created_at?: string;
}

// ========================================
// 보드 관련 타입
// ========================================

export interface BoardOwner {
  id: string;
  name: string;
  email: string;
  profile_image: string | null;
}

export interface BoardSubscription {
  status: SubscriptionStatus;
  plan: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
}

export interface Board {
  id: string;
  name: string;
  description?: string | null;
  owner?: BoardOwner;
  role?: Role;
  my_role?: Role;
  is_starred: boolean;
  member_count: number;
  subscription: BoardSubscription;
  created_at: string;
  updated_at?: string;
}

// ========================================
// 멤버 타입
// ========================================

export interface BoardMember {
  id: string;
  user: User;
  role: Role;
  joined_at: string;
  invited_by?: { id: string; name: string } | null;
}

// ========================================
// 블록 타입
// ========================================

export type BlockType = 'FIXED' | 'CUSTOM';
export type FixedBlockType = 'FEATURE' | 'TASK' | 'DONE' | null;

export interface Block {
  id: string;
  name: string;
  type: BlockType;
  fixed_type: FixedBlockType;
  color: string | null;
  position: number;
}

// ========================================
// 태그 타입
// ========================================

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at?: string;
}

// ========================================
// 담당자 타입
// ========================================

export interface Assignee {
  id: string;
  name: string;
  email: string;
  profile_image: string | null;
}

// ========================================
// 우선순위 타입
// ========================================

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

// ========================================
// Feature 타입
// ========================================

export type FeatureStatus = 'ACTIVE' | 'COMPLETED';

export interface Feature {
  id: string;
  title: string;
  description?: string;
  color: string;
  assignee: Assignee | null;
  priority: Priority | null;
  due_date: string | null;
  status: FeatureStatus;
  total_tasks: number;
  completed_tasks: number;
  progress_percentage: number;
  position: number;
  tags: Tag[];
  created_by?: { id: string; name: string };
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  // Legacy compatibility
  boardId?: string;
}

// ========================================
// Task 타입
// ========================================

export interface Task {
  id: string;
  feature_id: string;
  feature_title: string;
  feature_color: string;
  block_id: string;
  block_name?: string;
  title: string;
  description?: string;
  assignee: Assignee | null;
  due_date: string | null;
  estimated_minutes: number | null;
  completed: boolean;
  position: number;
  tags: Tag[];
  checklist_total?: number;
  checklist_completed?: number;
  created_by?: { id: string; name: string };
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  // Legacy compatibility
  boardId?: string;
  currentBlock?: string;
}

// ========================================
// 체크리스트 타입
// ========================================

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  assignee?: {
    id: string;
    name: string;
    profile_image: string | null;
  } | null;
  due_date: string | null;
  position: number;
  created_at?: string;
  completed_at?: string | null;
}

export interface Checklist {
  total: number;
  completed: number;
  items: ChecklistItem[];
}

// ========================================
// 초대 링크 타입
// ========================================

export interface InviteLink {
  id: string;
  code: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_by: { id: string; name: string };
  created_at: string;
}

// ========================================
// 활동 로그 타입
// ========================================

export type ActivityAction =
  | 'BOARD_CREATED'
  | 'BOARD_UPDATED'
  | 'BLOCK_CREATED'
  | 'BLOCK_UPDATED'
  | 'BLOCK_DELETED'
  | 'BLOCK_REORDERED'
  | 'FEATURE_CREATED'
  | 'FEATURE_UPDATED'
  | 'FEATURE_DELETED'
  | 'FEATURE_COMPLETED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'TASK_MOVED'
  | 'TASK_COMPLETED'
  | 'TASK_REOPENED'
  | 'TAG_CREATED'
  | 'TAG_DELETED'
  | 'MEMBER_INVITED'
  | 'MEMBER_JOINED'
  | 'MEMBER_LEFT'
  | 'MEMBER_REMOVED'
  | 'MEMBER_ROLE_CHANGED'
  | 'SUBSCRIPTION_STARTED'
  | 'SUBSCRIPTION_PLAN_CHANGED'
  | 'SUBSCRIPTION_CANCELED';

export interface ActivityLog {
  id: string;
  user: {
    id: string;
    name: string;
    profile_image: string | null;
  };
  action: ActivityAction | string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ========================================
// 요금제 타입
// ========================================

export interface PricingPlan {
  id: string;
  name: string;
  min_members: number;
  max_members: number;
  monthly_price: number;
  yearly_price: number;
  yearly_monthly_price: number;
  discount_percentage: number;
}

// ========================================
// 필터 옵션 타입
// ========================================

export interface FilterOptions {
  keyword: string;
  members: string[];
  features: string[];
  tags: string[];
  cardStatus: string[];
  dueDate: string[];
}

// ========================================
// 드래그 아이템 타입
// ========================================

export interface DragItem {
  type: 'task';
  taskId: string;
  currentBlock: string;
}

// ========================================
// API 에러 타입
// ========================================

export interface ApiError {
  code: string;
  message: string;
  timestamp: string;
}

// 에러 코드 상수
export const ERROR_CODES = {
  // 공통
  C001: '잘못된 입력값',
  C002: '서버 오류',
  // 인증
  A001: '이미 사용 중인 이메일',
  A002: '이메일/비밀번호 불일치',
  A003: '유효하지 않은 토큰',
  A004: '만료된 토큰',
  A005: '인증 필요',
  // 사용자
  U001: '사용자 없음',
  // 보드
  B001: '보드 없음',
  B002: '보드 접근 권한 없음',
  B003: '보드 정지 상태',
  // 블록
  BL001: '블록 없음',
  BL002: '고정 블록 삭제 불가',
  BL003: '고정 블록 수정 불가',
  // Feature
  F001: 'Feature 없음',
  // Task
  T001: 'Task 없음',
  T002: 'Task 이동 불가 블록',
  // 태그
  TG001: '태그 없음',
  TG002: '이미 존재하는 태그',
  // 체크리스트
  CL001: '체크리스트 항목 없음',
  // 멤버
  M001: '멤버 없음',
  M002: '이미 멤버임',
  M003: 'Owner 내보내기 불가',
  M004: 'Owner 역할 변경 불가',
  // 초대
  I001: '초대 링크 없음',
  I002: '만료된 초대 링크',
  I003: '유효하지 않은 초대 링크',
  // 구독
  S001: '구독 정보 없음',
  S002: '체험 기간 만료',
  S003: '결제 필요',
  S004: '멤버 수 제한 초과',
} as const;
