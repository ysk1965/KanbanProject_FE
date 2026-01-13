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

export type BoardTier = 'TRIAL' | 'STANDARD' | 'PREMIUM';

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

export interface MemberPreview {
  id: string;
  name: string;
  profile_image: string | null;
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
  task_count?: number;
  completed_tasks?: number;
  members?: MemberPreview[];
  subscription: BoardSubscription;
  tier?: BoardTier;
  trial_ends_at?: string | null;
  selected_milestone_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface BoardTierInfo {
  tier: BoardTier;
  trial_ends_at: string | null;
  can_access_schedule: boolean;
  can_access_milestone: boolean;
  can_access_statistics: boolean;
}

export interface BoardLimits {
  task_limit: number | null;
  current_task_count: number;
  can_create_task: boolean;
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
  start_date: string | null;  // 시작일 (위클리 스케줄용)
  due_date: string | null;
  estimated_minutes: number | null;
  completed: boolean;
  position: number;
  tags: Tag[];
  checklist_total?: number;
  checklist_completed?: number;
  checklist_version?: number; // 체크리스트 변경 감지용 버전
  created_by?: { id: string; name: string };
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  // Legacy compatibility
  boardId?: string;
  currentBlock?: string;
}

// ========================================
// 마일스톤 타입
// ========================================

export interface MilestoneFeatureInfo {
  id: string;
  title: string;
  color: string;
  total_tasks: number;
  completed_tasks: number;
  progress_percentage: number;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  feature_count: number;
  progress_percentage: number;
  features?: MilestoneFeatureInfo[];
  created_by?: { id: string; name: string };
  created_at?: string;
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
  start_date: string | null;
  due_date: string | null;
  done_date: string | null;
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
// 초대 결과 타입
// ========================================

export interface InviteResult {
  type: 'DIRECT_ADD' | 'EMAIL_SENT';
  member?: BoardMember;  // DIRECT_ADD인 경우
  email?: string;        // EMAIL_SENT인 경우
  role?: string;         // EMAIL_SENT인 경우
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

export interface SeatPricing {
  price_per_seat: {
    monthly: number;
    yearly: number;
  };
  seat_count: number;
  estimated_price: {
    monthly: number;
    yearly: number;
  };
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

export interface BlockDragItem {
  type: 'block';
  blockId: string;
  position: number;
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
  B004: 'Premium 기능 필요',
  // 블록
  BL001: '블록 없음',
  BL002: '고정 블록 삭제 불가',
  BL003: '고정 블록 수정 불가',
  // Feature
  F001: 'Feature 없음',
  // Task
  T001: 'Task 없음',
  T002: 'Task 이동 불가 블록',
  T003: 'Task 제한 초과 (Standard 보드 10개 제한)',
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

// ========================================
// 통계 시스템 타입 (Statistics & Productivity)
// ========================================

/**
 * 가중치 레벨 - 보드별로 커스텀 설정 가능
 * 예: Low(0.5), Medium(1.0), High(1.5), Critical(2.0)
 */
export interface WeightLevel {
  id: string;
  name: string;
  weight: number;
  color: string;
  position: number;
  is_default?: boolean;
}

/**
 * 보드의 가중치 설정
 */
export interface BoardWeightSettings {
  board_id: string;
  levels: WeightLevel[];
  default_level_id: string;
}

/**
 * Task에 적용된 가중치 정보
 */
export interface TaskWeight {
  task_id: string;
  weight_level_id: string;
  weight_level?: WeightLevel;
}

/**
 * 통계 필터 옵션
 */
export interface StatisticsFilter {
  start_date: string | null;
  end_date: string | null;
  milestone_ids: string[];
  feature_ids: string[];
  member_ids: string[];
  tag_ids: string[];
}

/**
 * 시간 블록 통계 정보
 */
export interface TimeBlockStatistics {
  total_minutes: number;
  completed_minutes: number;
  incomplete_minutes: number;
  block_count: number;
}

/**
 * 구성원별 통계
 */
export interface MemberStatistics {
  member: {
    id: string;
    name: string;
    profile_image: string | null;
  };
  total_minutes: number;
  completed_minutes: number;
  task_count: number;
  completed_task_count: number;
  impact_score: number;
  by_feature: {
    feature_id: string;
    feature_title: string;
    feature_color: string;
    minutes: number;
  }[];
}

/**
 * Feature별 통계
 */
export interface FeatureStatistics {
  feature: {
    id: string;
    title: string;
    color: string;
  };
  total_minutes: number;
  completed_minutes: number;
  task_count: number;
  completed_task_count: number;
  progress_percentage: number;
  by_member: {
    member_id: string;
    member_name: string;
    minutes: number;
  }[];
}

/**
 * Milestone별 통계
 */
export interface MilestoneStatistics {
  milestone: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
  };
  total_minutes: number;
  completed_minutes: number;
  feature_count: number;
  completed_feature_count: number;
  progress_percentage: number;
  by_feature: FeatureStatistics[];
}

/**
 * 태그별 통계
 */
export interface TagStatistics {
  tag: {
    id: string;
    name: string;
    color: string;
  };
  total_minutes: number;
  task_count: number;
}

/**
 * 임팩트 점수 통계
 * Impact Score = Σ (Task 사용 시간 × Task Weight)
 */
export interface ImpactStatistics {
  total_impact_score: number;
  by_member: {
    member_id: string;
    member_name: string;
    profile_image: string | null;
    impact_score: number;
    weighted_minutes: number;
  }[];
  by_weight_level: {
    level: WeightLevel;
    total_minutes: number;
    task_count: number;
  }[];
}

/**
 * 요약 대시보드 KPI
 */
export interface StatisticsSummary {
  // 시간 기반
  total_work_minutes: number;
  completed_work_minutes: number;
  incomplete_work_minutes: number;

  // 작업 기반
  total_tasks: number;
  completed_tasks: number;
  incomplete_tasks: number;

  // Feature 기반
  total_features: number;
  completed_features: number;
  average_feature_progress: number;

  // 집중도 (완료 시간 / 전체 시간)
  focus_rate: number;

  // 기간 정보
  period_start: string;
  period_end: string;
}

/**
 * 전체 통계 응답
 */
export interface BoardStatistics {
  summary: StatisticsSummary;
  by_member: MemberStatistics[];
  by_feature: FeatureStatistics[];
  by_milestone: MilestoneStatistics[];
  by_tag: TagStatistics[];
  impact: ImpactStatistics;

  // 일별 트렌드 (차트용)
  daily_trend: {
    date: string;
    total_minutes: number;
    completed_minutes: number;
    task_completed_count: number;
  }[];
}

/**
 * 개인 통계 (Member용 - 본인 데이터만)
 */
export interface PersonalStatistics {
  summary: {
    total_work_minutes: number;
    completed_work_minutes: number;
    total_tasks: number;
    completed_tasks: number;
    impact_score: number;
  };
  by_feature: {
    feature_id: string;
    feature_title: string;
    feature_color: string;
    minutes: number;
    task_count: number;
  }[];
  by_tag: {
    tag_id: string;
    tag_name: string;
    tag_color: string;
    minutes: number;
  }[];
  top_tasks: {
    task_id: string;
    task_title: string;
    feature_title: string;
    minutes: number;
  }[];
  daily_trend: {
    date: string;
    minutes: number;
  }[];
}

/**
 * 통계 뷰 타입
 */
export type StatisticsViewType =
  | 'overview'    // 요약 대시보드
  | 'individual'  // 개인 생산성
  | 'team'        // 팀 생산성
  | 'work'        // 작업 분석
  | 'impact';     // 임팩트 분석
