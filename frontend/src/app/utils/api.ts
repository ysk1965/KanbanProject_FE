// API Base URL - BE 서버
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// 토큰 관리
const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

// JWT 토큰 디코딩 (만료 시간 확인용)
const decodeToken = (token: string): { exp: number } | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

// 토큰이 곧 만료되는지 확인 (10분 이내)
const isTokenExpiringSoon = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return true;

  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = decoded.exp - now;
  const TEN_MINUTES = 10 * 60;

  return timeUntilExpiry < TEN_MINUTES;
};

// API 에러 타입
export interface ApiError {
  code: string;
  message: string;
  timestamp: string;
}

// API 클라이언트
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit,
    skipAuth: boolean = false
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers as Record<string, string>,
    };

    // 인증 토큰 추가 (선제적 갱신 포함)
    if (!skipAuth) {
      let token = getAccessToken();

      // 토큰이 10분 이내 만료 예정이면 선제적으로 갱신
      if (token && isTokenExpiringSoon(token)) {
        console.log('🔄 [Token] 토큰 만료 임박, 선제적 갱신 시도...');
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          token = getAccessToken();
          console.log('✅ [Token] 선제적 갱신 완료');
        }
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    // Request 로깅
    console.log(`🚀 [API Request] ${options?.method || 'GET'} ${url}`, {
      headers: { ...headers, Authorization: headers.Authorization ? '***' : undefined },
      body: options?.body ? JSON.parse(options.body as string) : undefined,
    });

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          code: 'UNKNOWN',
          message: response.statusText,
          timestamp: new Date().toISOString(),
        }));

        // Error Response 로깅
        console.error(`❌ [API Error] ${options?.method || 'GET'} ${url}`, {
          status: response.status,
          error: errorData,
        });

        // 토큰 만료시 자동 갱신 시도
        if (response.status === 401 && errorData.code === 'A004') {
          const refreshed = await this.tryRefreshToken();
          if (refreshed) {
            // 토큰 갱신 성공, 원래 요청 재시도
            return this.request<T>(endpoint, options, skipAuth);
          }
        }

        throw errorData;
      }

      // 204 No Content 또는 빈 응답 처리
      if (response.status === 204) {
        console.log(`✅ [API Response] ${options?.method || 'GET'} ${url}`, { status: 204, data: null });
        return {} as T;
      }

      // Content-Length가 0이거나 응답 본문이 비어있는 경우 처리
      const contentLength = response.headers.get('Content-Length');
      const contentType = response.headers.get('Content-Type');

      if (contentLength === '0' || !contentType?.includes('application/json')) {
        console.log(`✅ [API Response] ${options?.method || 'GET'} ${url}`, { status: response.status, data: null });
        return {} as T;
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        console.log(`✅ [API Response] ${options?.method || 'GET'} ${url}`, { status: response.status, data: null });
        return {} as T;
      }

      const data = JSON.parse(text);

      // Success Response 로깅
      console.log(`✅ [API Response] ${options?.method || 'GET'} ${url}`, {
        status: response.status,
        data,
      });

      return data;
    } catch (error) {
      console.error(`💥 [API Request failed] ${endpoint}`, error);
      throw error;
    }
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      this.redirectToLogin();
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setTokens(data.access_token, data.refresh_token);
        return true;
      }
    } catch {
      // 갱신 실패
    }

    // 세션 만료 - 로그인 페이지로 리다이렉트
    console.log('🔒 [Auth] 세션 만료, 로그인 페이지로 이동');
    clearTokens();
    this.redirectToLogin();
    return false;
  }

  private redirectToLogin(): void {
    // 이미 로그인 페이지면 리다이렉트 안함
    if (window.location.pathname === '/login' || window.location.pathname === '/signup') {
      return;
    }
    window.location.href = '/login';
  }

  async get<T>(endpoint: string, skipAuth: boolean = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, skipAuth);
  }

  async post<T>(endpoint: string, data?: unknown, skipAuth: boolean = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, skipAuth);
  }

  async put<T>(endpoint: string, data?: unknown, skipAuth: boolean = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, skipAuth);
  }

  async delete<T>(endpoint: string, skipAuth: boolean = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, skipAuth);
  }

  async patch<T>(endpoint: string, data?: unknown, skipAuth: boolean = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }, skipAuth);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// ========================================
// Types - BE 응답 형식에 맞춤 (snake_case)
// ========================================

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  profile_image?: string | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserResponse;
}

export interface BoardSubscription {
  status: 'TRIAL' | 'ACTIVE' | 'GRACE' | 'SUSPENDED' | 'CANCELED';
  plan: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
}

export interface MemberPreviewResponse {
  id: string;
  name: string;
  profile_image: string | null;
}

export interface BoardListItem {
  id: string;
  name: string;
  description: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  is_starred: boolean;
  member_count: number;
  task_count: number;
  completed_tasks: number;
  members: MemberPreviewResponse[];
  subscription: BoardSubscription;
  created_at: string;
}

export interface BoardOwner {
  id: string;
  name: string;
  email: string;
  profile_image: string | null;
}

export interface BoardDetail {
  id: string;
  name: string;
  description: string | null;
  owner: BoardOwner;
  my_role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  is_starred: boolean;
  member_count: number;
  subscription: BoardSubscription;
  selected_milestone_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlockResponse {
  id: string;
  name: string;
  type: 'FIXED' | 'CUSTOM';
  fixed_type: 'FEATURE' | 'TASK' | 'DONE' | null;
  color: string | null;
  position: number;
}

export interface TagResponse {
  id: string;
  name: string;
  color: string;
  created_at?: string;
}

export interface AssigneeResponse {
  id: string;
  name: string;
  email: string;
  profile_image: string | null;
}

export interface FeatureResponse {
  id: string;
  title: string;
  description?: string;
  color: string;
  assignee: AssigneeResponse | null;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  due_date: string | null;
  status: 'ACTIVE' | 'COMPLETED';
  total_tasks: number;
  completed_tasks: number;
  progress_percentage: number;
  position: number;
  tags: TagResponse[];
  created_by?: { id: string; name: string };
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
}

export interface TaskResponse {
  id: string;
  feature_id: string;
  feature_title: string;
  feature_color: string;
  block_id: string;
  block_name?: string;
  title: string;
  description?: string;
  // v7.0: Task.assignee 제거 - ChecklistItem.assignee로 대체
  start_date: string | null;
  due_date: string | null;
  estimated_minutes: number | null;
  completed: boolean;
  position: number;
  tags: TagResponse[];
  checklist_total?: number;
  checklist_completed?: number;
  created_by?: { id: string; name: string };
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
}

export interface ChecklistItemResponse {
  id: string;
  title: string;
  completed: boolean;
  assignee: {
    id: string;
    name: string;
    profile_image: string | null;
  } | null;
  start_date: string | null;
  due_date: string | null;
  done_date: string | null;
  position: number;
  created_at: string;
  completed_at: string | null;
}

export interface ChecklistResponse {
  total: number;
  completed: number;
  items: ChecklistItemResponse[];
}

// Milestone Response Types
export interface MilestoneFeatureInfoResponse {
  id: string;
  title: string;
  color: string;
  total_tasks: number;
  completed_tasks: number;
  progress_percentage: number;
}

export interface MilestoneSimpleResponse {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  feature_count: number;
  progress_percentage: number;
}

export interface MilestoneDetailResponse {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  feature_count: number;
  progress_percentage: number;
  features: MilestoneFeatureInfoResponse[];
  created_by: { id: string; name: string };
  created_at: string;
}

export interface MemberUserResponse {
  id: string;
  name: string;
  email: string;
  profile_image: string | null;
}

export interface MemberResponse {
  id: string;
  user: MemberUserResponse;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joined_at: string;
  invited_by: { id: string; name: string } | null;
}

export interface MembersListResponse {
  total: number;
  billable: number;
  members: MemberResponse[];
}

export interface InviteResultResponse {
  type: 'DIRECT_ADD' | 'EMAIL_SENT';
  member?: MemberResponse;  // DIRECT_ADD인 경우
  email?: string;           // EMAIL_SENT인 경우
  role?: string;            // EMAIL_SENT인 경우
}

export interface InviteLinkResponse {
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

export interface InviteLinkInfoResponse {
  board_id: string;
  board_name: string;
  role: string;
  is_valid: boolean;
  message: string;
}

export interface ActivityLogResponse {
  id: string;
  user: {
    id: string;
    name: string;
    profile_image: string | null;
  };
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ActivitiesResponse {
  activities: ActivityLogResponse[];
  has_more: boolean;
  next_cursor: string | null;
}

export interface SubscriptionResponse {
  id: string;
  status: 'TRIAL' | 'ACTIVE' | 'GRACE' | 'SUSPENDED' | 'CANCELED';
  plan: string | null;
  billing_cycle: 'MONTHLY' | 'YEARLY' | null;
  price: number | null;
  trial_ends_at: string | null;
  grace_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  billable_member_count: number;
  member_limit: number;
  next_payment_at: string | null;
  created_at: string;
}

export interface PricingPlanResponse {
  id: string;
  name: string;
  min_members: number;
  max_members: number;
  monthly_price: number;
  yearly_price: number;
  yearly_monthly_price: number;
  discount_percentage: number;
}

export interface PricingResponse {
  plans: PricingPlanResponse[];
  currency: string;
  trial_days: string;
}

// Board Tier Response Types
export type BoardTier = 'TRIAL' | 'STANDARD' | 'PREMIUM';

export interface BoardTierResponse {
  tier: BoardTier;
  trial_ends_at: string | null;
  can_access_schedule: boolean;
  can_access_milestone: boolean;
}

export interface BoardLimitsResponse {
  task_limit: number | null;
  current_task_count: number;
  can_create_task: boolean;
}

// Seat Pricing Response
export interface SeatPricingResponse {
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
// Auth API
// ========================================

export const authAPI = {
  signup: async (data: { email: string; password: string; name: string }) => {
    const response = await apiClient.post<AuthResponse>('/auth/signup', data, true);
    setTokens(response.access_token, response.refresh_token);
    return response;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data, true);
    setTokens(response.access_token, response.refresh_token);
    return response;
  },

  googleLogin: async (idToken: string) => {
    const response = await apiClient.post<AuthResponse>('/auth/google', { id_token: idToken }, true);
    setTokens(response.access_token, response.refresh_token);
    return response;
  },

  logout: async () => {
    const response = await apiClient.post<{ message: string }>('/auth/logout');
    clearTokens();
    return response;
  },

  refresh: async (refreshToken: string) => {
    return apiClient.post<{ access_token: string; refresh_token: string; token_type: string }>(
      '/auth/refresh',
      { refresh_token: refreshToken },
      true
    );
  },

  isAuthenticated: () => {
    return !!getAccessToken();
  },

  getAccessToken,
  clearTokens,
};

// ========================================
// Board API
// ========================================

export const boardAPI = {
  getBoards: async () => {
    return apiClient.get<BoardListItem[]>('/boards');
  },

  getBoard: async (boardId: string) => {
    return apiClient.get<BoardDetail>(`/boards/${boardId}`);
  },

  createBoard: async (data: { name: string; description?: string }) => {
    return apiClient.post<BoardDetail>('/boards', data);
  },

  updateBoard: async (boardId: string, data: { name?: string; description?: string }) => {
    return apiClient.put<BoardDetail>(`/boards/${boardId}`, data);
  },

  deleteBoard: async (boardId: string) => {
    return apiClient.delete<{ message: string }>(`/boards/${boardId}`);
  },

  toggleStar: async (boardId: string) => {
    return apiClient.patch<{ board_id: string; is_starred: boolean }>(`/boards/${boardId}/star`);
  },

  updateSelectedMilestone: async (boardId: string, milestoneId: string | null) => {
    return apiClient.patch<BoardDetail>(`/boards/${boardId}/selected-milestone`, {
      milestone_id: milestoneId,
    });
  },

  getBoardTier: async (boardId: string) => {
    return apiClient.get<BoardTierResponse>(`/boards/${boardId}/tier`);
  },

  getBoardLimits: async (boardId: string) => {
    return apiClient.get<BoardLimitsResponse>(`/boards/${boardId}/limits`);
  },
};

// ========================================
// Block API
// ========================================

export const blockAPI = {
  getBlocks: async (boardId: string) => {
    return apiClient.get<{ blocks: BlockResponse[] }>(`/boards/${boardId}/blocks`);
  },

  createBlock: async (boardId: string, data: { name: string; color: string }) => {
    return apiClient.post<BlockResponse>(`/boards/${boardId}/blocks`, data);
  },

  updateBlock: async (boardId: string, blockId: string, data: { name?: string; color?: string }) => {
    return apiClient.put<BlockResponse>(`/boards/${boardId}/blocks/${blockId}`, data);
  },

  deleteBlock: async (boardId: string, blockId: string) => {
    return apiClient.delete<{ message: string }>(`/boards/${boardId}/blocks/${blockId}`);
  },

  reorderBlocks: async (boardId: string, blockIds: string[]) => {
    return apiClient.put<{ blocks: BlockResponse[] }>(`/boards/${boardId}/blocks/reorder`, {
      block_ids: blockIds,
    });
  },
};

// ========================================
// Feature API
// ========================================

export const featureAPI = {
  getFeatures: async (boardId: string, milestoneId?: string) => {
    const query = milestoneId ? `?milestoneId=${milestoneId}` : '';
    return apiClient.get<{ features: FeatureResponse[] }>(`/boards/${boardId}/features${query}`);
  },

  getFeature: async (boardId: string, featureId: string) => {
    return apiClient.get<FeatureResponse>(`/boards/${boardId}/features/${featureId}`);
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
  ) => {
    return apiClient.post<FeatureResponse>(`/boards/${boardId}/features`, data);
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
  ) => {
    return apiClient.put<FeatureResponse>(`/boards/${boardId}/features/${featureId}`, data);
  },

  deleteFeature: async (boardId: string, featureId: string) => {
    return apiClient.delete<{ message: string }>(`/boards/${boardId}/features/${featureId}`);
  },

  reorderFeatures: async (boardId: string, featureIds: string[]) => {
    return apiClient.put<{ features: FeatureResponse[] }>(`/boards/${boardId}/features/reorder`, {
      feature_ids: featureIds,
    });
  },

  // Feature 태그 관리
  addTag: async (boardId: string, featureId: string, tagId: string) => {
    return apiClient.post<TagResponse[]>(`/boards/${boardId}/features/${featureId}/tags`, {
      tag_id: tagId,
    });
  },

  removeTag: async (boardId: string, featureId: string, tagId: string) => {
    return apiClient.delete<{ message: string }>(
      `/boards/${boardId}/features/${featureId}/tags/${tagId}`
    );
  },
};

// ========================================
// Task API
// ========================================

export const taskAPI = {
  getTasks: async (boardId: string, params?: { block_id?: string; feature_id?: string; milestone_id?: string }) => {
    const query = new URLSearchParams();
    if (params?.block_id) query.set('blockId', params.block_id);
    if (params?.feature_id) query.set('featureId', params.feature_id);
    if (params?.milestone_id) query.set('milestoneId', params.milestone_id);
    const queryString = query.toString();
    return apiClient.get<{ tasks: TaskResponse[] }>(
      `/boards/${boardId}/tasks${queryString ? `?${queryString}` : ''}`
    );
  },

  getTask: async (boardId: string, taskId: string) => {
    return apiClient.get<TaskResponse>(`/boards/${boardId}/tasks/${taskId}`);
  },

  createTask: async (
    boardId: string,
    featureId: string,
    data: {
      title: string;
      description?: string;
      // v7.0: assignee_id 제거 - ChecklistItem에서 담당자 설정
      start_date?: string;
      due_date?: string;
      estimated_minutes?: number;
    }
  ) => {
    return apiClient.post<TaskResponse>(
      `/boards/${boardId}/features/${featureId}/tasks`,
      data
    );
  },

  updateTask: async (
    boardId: string,
    taskId: string,
    data: {
      title?: string;
      description?: string;
      // v7.0: assignee_id 제거 - ChecklistItem에서 담당자 설정
      start_date?: string | null;
      due_date?: string | null;
      estimated_minutes?: number | null;
    }
  ) => {
    return apiClient.put<TaskResponse>(`/boards/${boardId}/tasks/${taskId}`, data);
  },

  updateTaskDates: async (
    boardId: string,
    taskId: string,
    data: {
      start_date?: string | null;
      end_date?: string | null;
    }
  ) => {
    return apiClient.put<TaskResponse>(`/boards/${boardId}/tasks/${taskId}/dates`, data);
  },

  deleteTask: async (boardId: string, taskId: string) => {
    return apiClient.delete<{ message: string }>(`/boards/${boardId}/tasks/${taskId}`);
  },

  moveTask: async (
    boardId: string,
    taskId: string,
    data: { target_block_id: string; position: number }
  ) => {
    return apiClient.put<TaskResponse>(`/boards/${boardId}/tasks/${taskId}/move`, data);
  },

  // Task 태그 관리
  addTag: async (boardId: string, taskId: string, tagId: string) => {
    return apiClient.post<TagResponse[]>(`/boards/${boardId}/tasks/${taskId}/tags`, {
      tag_id: tagId,
    });
  },

  removeTag: async (boardId: string, taskId: string, tagId: string) => {
    return apiClient.delete<{ message: string }>(
      `/boards/${boardId}/tasks/${taskId}/tags/${tagId}`
    );
  },
};

// ========================================
// Tag API
// ========================================

export const tagAPI = {
  getTags: async (boardId: string) => {
    return apiClient.get<{ tags: TagResponse[] }>(`/boards/${boardId}/tags`);
  },

  createTag: async (boardId: string, data: { name: string; color: string }) => {
    return apiClient.post<TagResponse>(`/boards/${boardId}/tags`, data);
  },

  updateTag: async (boardId: string, tagId: string, data: { name?: string; color?: string }) => {
    return apiClient.put<TagResponse>(`/boards/${boardId}/tags/${tagId}`, data);
  },

  deleteTag: async (boardId: string, tagId: string) => {
    return apiClient.delete<{ message: string }>(`/boards/${boardId}/tags/${tagId}`);
  },
};

// ========================================
// Checklist API
// ========================================

export const checklistAPI = {
  getChecklist: async (boardId: string, taskId: string) => {
    return apiClient.get<ChecklistResponse>(`/boards/${boardId}/tasks/${taskId}/checklist`);
  },

  addItem: async (
    boardId: string,
    taskId: string,
    data: { title: string; assignee_id?: string; start_date?: string; due_date?: string }
  ) => {
    return apiClient.post<ChecklistItemResponse>(
      `/boards/${boardId}/tasks/${taskId}/checklist`,
      data
    );
  },

  updateItem: async (
    boardId: string,
    taskId: string,
    itemId: string,
    data: { title?: string; assignee_id?: string | null; start_date?: string | null; due_date?: string | null }
  ) => {
    return apiClient.put<ChecklistItemResponse>(
      `/boards/${boardId}/tasks/${taskId}/checklist/${itemId}`,
      data
    );
  },

  deleteItem: async (boardId: string, taskId: string, itemId: string) => {
    return apiClient.delete<{ message: string }>(
      `/boards/${boardId}/tasks/${taskId}/checklist/${itemId}`
    );
  },

  toggleItem: async (boardId: string, taskId: string, itemId: string) => {
    return apiClient.patch<ChecklistItemResponse>(
      `/boards/${boardId}/tasks/${taskId}/checklist/${itemId}/toggle`
    );
  },
};

// ========================================
// Member API
// ========================================

export const memberAPI = {
  getMembers: async (boardId: string) => {
    return apiClient.get<MembersListResponse>(`/boards/${boardId}/members`);
  },

  inviteMember: async (boardId: string, data: { email: string; role: 'ADMIN' | 'MEMBER' | 'VIEWER' }) => {
    return apiClient.post<InviteResultResponse>(`/boards/${boardId}/members/invite`, data);
  },

  updateMemberRole: async (
    boardId: string,
    memberId: string,
    role: 'ADMIN' | 'MEMBER' | 'VIEWER'
  ) => {
    return apiClient.put<MemberResponse>(`/boards/${boardId}/members/${memberId}/role`, { role });
  },

  removeMember: async (boardId: string, memberId: string) => {
    return apiClient.delete<{ message: string }>(`/boards/${boardId}/members/${memberId}`);
  },
};

// ========================================
// Invite Link API
// ========================================

export const inviteLinkAPI = {
  getInviteLinks: async (boardId: string) => {
    return apiClient.get<{ invites: InviteLinkResponse[] }>(`/boards/${boardId}/invites`);
  },

  createInviteLink: async (
    boardId: string,
    data: {
      role: 'ADMIN' | 'MEMBER' | 'VIEWER';
      max_uses?: number | null;
      expires_in_hours?: number | null;
    }
  ) => {
    return apiClient.post<InviteLinkResponse>(`/boards/${boardId}/invites`, data);
  },

  deleteInviteLink: async (boardId: string, inviteId: string) => {
    return apiClient.delete<{ message: string }>(`/boards/${boardId}/invites/${inviteId}`);
  },

  getInviteLinkInfo: async (code: string) => {
    return apiClient.get<InviteLinkInfoResponse>(`/invites/${code}`, true);
  },

  acceptInvite: async (code: string) => {
    return apiClient.post<{ board_id: string; board_name: string; role: string; message: string }>(
      `/invites/${code}/accept`
    );
  },
};

// ========================================
// Activity API
// ========================================

export const activityAPI = {
  getActivities: async (boardId: string, params?: { cursor?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', params.limit.toString());
    const queryString = query.toString();
    return apiClient.get<ActivitiesResponse>(
      `/boards/${boardId}/activities${queryString ? `?${queryString}` : ''}`
    );
  },
};

// ========================================
// Subscription API
// ========================================

export const subscriptionAPI = {
  getSubscription: async (boardId: string) => {
    return apiClient.get<SubscriptionResponse>(`/boards/${boardId}/subscription`);
  },

  startSubscription: async (
    boardId: string,
    data: { plan_id: string; billing_cycle: 'MONTHLY' | 'YEARLY'; payment_method_id: string }
  ) => {
    return apiClient.post<SubscriptionResponse>(`/boards/${boardId}/subscription/start`, data);
  },

  // Seat 기반 구독 시작
  startSeatSubscription: async (
    boardId: string,
    data: { billing_cycle: 'MONTHLY' | 'YEARLY'; payment_method_id: string }
  ) => {
    return apiClient.post<SubscriptionResponse>(`/boards/${boardId}/subscription/start`, {
      ...data,
      plan_id: 'PREMIUM', // Seat 기반은 단일 플랜
    });
  },

  // Seat 가격 조회
  getSeatPricing: async (boardId: string) => {
    return apiClient.get<SeatPricingResponse>(`/boards/${boardId}/subscription/pricing`);
  },

  changePlan: async (
    boardId: string,
    data: { plan_id: string; billing_cycle: 'MONTHLY' | 'YEARLY' }
  ) => {
    return apiClient.put<SubscriptionResponse>(`/boards/${boardId}/subscription/plan`, data);
  },

  cancelSubscription: async (boardId: string) => {
    return apiClient.delete<{ message: string }>(`/boards/${boardId}/subscription`);
  },
};

// ========================================
// Pricing API
// ========================================

export const pricingAPI = {
  getPlans: async () => {
    return apiClient.get<PricingResponse>('/pricing', true);
  },
};

// ========================================
// Schedule Types (snake_case - matches backend Jackson config)
// ========================================

export interface ScheduleSettingsResponse {
  work_hours_per_day: number;
  work_start_time: string; // "HH:mm:ss" format
  schedule_display_mode: 'TIME' | 'BLOCK';
}

export interface ScheduleUserInfo {
  id: string;
  name: string;
  profile_image: string | null;
}

export interface ScheduleChecklistItemInfo {
  id: string;
  title: string;
  completed: boolean;
  start_date: string | null;
  due_date: string | null;
}

export interface ScheduleTaskInfo {
  id: string;
  title: string;
}

export interface ScheduleFeatureInfo {
  id: string;
  title: string;
  color: string;
}

export interface ScheduleBlockInfo {
  id: string;
  start_time: string; // "HH:mm:ss" format
  end_time: string;   // "HH:mm:ss" format
  checklist_item: ScheduleChecklistItemInfo | null;
  task: ScheduleTaskInfo | null;
  feature: ScheduleFeatureInfo | null;
}

export interface ScheduleColumnInfo {
  user: ScheduleUserInfo;
  blocks: ScheduleBlockInfo[];
}

export interface DailyScheduleResponse {
  date: string;
  settings: ScheduleSettingsResponse;
  columns: ScheduleColumnInfo[];
}

export interface ScheduleBlockDetailResponse {
  id: string;
  assignee_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  checklist_item: ScheduleChecklistItemInfo | null;
  task: ScheduleTaskInfo | null;
  feature: ScheduleFeatureInfo | null;
}

export interface BoardChecklistItemResponse {
  id: string;
  title: string;
  completed: boolean;
  assignee: {
    id: string;
    name: string;
    profile_image: string | null;
  } | null;
  start_date: string | null;
  due_date: string | null;
  task: {
    id: string;
    title: string;
  } | null;
  feature: {
    id: string;
    title: string;
    color: string;
  } | null;
}

export interface BoardChecklistResponse {
  total: number;
  items: BoardChecklistItemResponse[];
}

// ========================================
// Schedule API
// ========================================

export const scheduleAPI = {
  getDailySchedule: async (
    boardId: string,
    date: string,
    assigneeIds?: string[]
  ) => {
    const query = new URLSearchParams();
    query.set('date', date);
    if (assigneeIds && assigneeIds.length > 0) {
      assigneeIds.forEach(id => query.append('assigneeIds', id));
    }
    return apiClient.get<DailyScheduleResponse>(
      `/boards/${boardId}/schedules?${query.toString()}`
    );
  },

  createBlock: async (
    boardId: string,
    data: {
      checklist_item_id?: string;
      assignee_id: string;
      scheduled_date: string;
      start_time: string;
      end_time: string;
    }
  ) => {
    return apiClient.post<ScheduleBlockDetailResponse>(
      `/boards/${boardId}/schedules`,
      data
    );
  },

  createWithChecklistItem: async (
    boardId: string,
    data: {
      assignee_id: string;
      scheduled_date: string;
      start_time: string;
      end_time: string;
      checklist_item: {
        task_id: string;
        title: string;
        start_date?: string;
        due_date?: string;
      };
    }
  ) => {
    return apiClient.post<ScheduleBlockDetailResponse>(
      `/boards/${boardId}/schedules/with-checklist-item`,
      data
    );
  },

  updateBlock: async (
    boardId: string,
    blockId: string,
    data: {
      start_time?: string;
      end_time?: string;
    }
  ) => {
    return apiClient.put<ScheduleBlockDetailResponse>(
      `/boards/${boardId}/schedules/${blockId}`,
      data
    );
  },

  deleteBlock: async (boardId: string, blockId: string) => {
    return apiClient.delete<{ message: string }>(
      `/boards/${boardId}/schedules/${blockId}`
    );
  },

  getSettings: async (boardId: string) => {
    return apiClient.get<ScheduleSettingsResponse>(
      `/boards/${boardId}/schedules/settings`
    );
  },

  updateSettings: async (
    boardId: string,
    data: {
      work_hours_per_day?: number;
      work_start_time?: string;
      schedule_display_mode?: 'TIME' | 'BLOCK';
    }
  ) => {
    return apiClient.put<ScheduleSettingsResponse>(
      `/boards/${boardId}/schedules/settings`,
      data
    );
  },

  getByChecklistItem: async (boardId: string, checklistItemId: string) => {
    return apiClient.get<ScheduleBlockDetailResponse[]>(
      `/boards/${boardId}/schedules/checklist-item/${checklistItemId}`
    );
  },
};

// ========================================
// Board Checklist API (for schedule)
// ========================================

export const boardChecklistAPI = {
  getItems: async (
    boardId: string,
    params?: {
      assignee_id?: string;
      is_scheduled?: boolean;
    }
  ) => {
    const query = new URLSearchParams();
    if (params?.assignee_id) query.set('assigneeId', params.assignee_id);
    if (params?.is_scheduled !== undefined) {
      query.set('isScheduled', params.is_scheduled.toString());
    }
    const queryString = query.toString();
    return apiClient.get<BoardChecklistResponse>(
      `/boards/${boardId}/checklist-items${queryString ? `?${queryString}` : ''}`
    );
  },
};

// ========================================
// Milestone API
// ========================================

// Milestone Allocation Response Types
export interface MilestoneAllocationResponse {
  id: string;
  milestone_id: string;
  member: {
    id: string;
    name: string;
    profile_image: string | null;
  };
  working_days: number;
  total_allocated_hours: number;
  actual_worked_hours?: number;
  difference?: number;
  status?: 'OVER' | 'UNDER' | 'NORMAL';
}

export const milestoneAPI = {
  getMilestones: async (boardId: string) => {
    return apiClient.get<{ milestones: MilestoneSimpleResponse[] }>(`/boards/${boardId}/milestones`);
  },

  getMilestone: async (boardId: string, milestoneId: string) => {
    return apiClient.get<MilestoneDetailResponse>(`/boards/${boardId}/milestones/${milestoneId}`);
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
  ) => {
    return apiClient.post<MilestoneDetailResponse>(`/boards/${boardId}/milestones`, {
      title: data.title,
      description: data.description,
      start_date: data.start_date,
      end_date: data.end_date,
      feature_ids: data.feature_ids,
    });
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
  ) => {
    return apiClient.put<MilestoneDetailResponse>(`/boards/${boardId}/milestones/${milestoneId}`, {
      title: data.title,
      description: data.description,
      start_date: data.start_date,
      end_date: data.end_date,
    });
  },

  deleteMilestone: async (boardId: string, milestoneId: string) => {
    return apiClient.delete<{ message: string }>(`/boards/${boardId}/milestones/${milestoneId}`);
  },

  addFeatures: async (boardId: string, milestoneId: string, featureIds: string[]) => {
    return apiClient.post<MilestoneDetailResponse>(`/boards/${boardId}/milestones/${milestoneId}/features`, {
      feature_ids: featureIds,
    });
  },

  removeFeature: async (boardId: string, milestoneId: string, featureId: string) => {
    return apiClient.delete<{ message: string }>(
      `/boards/${boardId}/milestones/${milestoneId}/features/${featureId}`
    );
  },

  // Milestone Allocation APIs
  getAllocations: async (boardId: string, milestoneId: string) => {
    return apiClient.get<{ allocations: MilestoneAllocationResponse[] }>(
      `/boards/${boardId}/milestones/${milestoneId}/allocations`
    );
  },

  createAllocation: async (
    boardId: string,
    milestoneId: string,
    data: {
      member_id: string;
      working_days: number;
      total_allocated_hours: number;
    }
  ) => {
    return apiClient.post<MilestoneAllocationResponse>(
      `/boards/${boardId}/milestones/${milestoneId}/allocations`,
      data
    );
  },

  updateAllocation: async (
    boardId: string,
    milestoneId: string,
    allocationId: string,
    data: {
      working_days?: number;
      total_allocated_hours?: number;
    }
  ) => {
    return apiClient.put<MilestoneAllocationResponse>(
      `/boards/${boardId}/milestones/${milestoneId}/allocations/${allocationId}`,
      data
    );
  },

  deleteAllocation: async (boardId: string, milestoneId: string, allocationId: string) => {
    return apiClient.delete<{ message: string }>(
      `/boards/${boardId}/milestones/${milestoneId}/allocations/${allocationId}`
    );
  },
};

// ========================================
// Test Data API (for development)
// ========================================

export interface TestDataResponse {
  board_id: string;
  board_name: string;
  member_count: number;
  feature_count: number;
  task_count: number;
  checklist_item_count: number;
  schedule_block_count: number;
  message: string;
}

export const testDataAPI = {
  createTestBoard: async () => {
    return apiClient.post<TestDataResponse>('/test/create-board');
  },
};

// ========================================
// Statistics API (Analytics & Productivity)
// ========================================

// 통계 응답 타입들
export interface StatisticsSummaryResponse {
  total_work_minutes: number;
  completed_work_minutes: number;
  incomplete_work_minutes: number;
  total_tasks: number;
  completed_tasks: number;
  incomplete_tasks: number;
  total_features: number;
  completed_features: number;
  average_feature_progress: number;
  focus_rate: number;
  period_start: string;
  period_end: string;
}

export interface MemberStatisticsResponse {
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

export interface FeatureStatisticsResponse {
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

export interface TagStatisticsResponse {
  tag: {
    id: string;
    name: string;
    color: string;
  };
  total_minutes: number;
  task_count: number;
}

export interface ImpactStatisticsResponse {
  total_impact_score: number;
  by_member: {
    member_id: string;
    member_name: string;
    profile_image: string | null;
    impact_score: number;
    weighted_minutes: number;
  }[];
  by_weight_level: {
    level: WeightLevelResponse;
    total_minutes: number;
    task_count: number;
  }[];
}

export interface DailyTrendResponse {
  date: string;
  total_minutes: number;
  completed_minutes: number;
  task_completed_count: number;
}

export interface BoardStatisticsResponse {
  summary: StatisticsSummaryResponse;
  by_member: MemberStatisticsResponse[];
  by_feature: FeatureStatisticsResponse[];
  by_tag: TagStatisticsResponse[];
  impact: ImpactStatisticsResponse;
  daily_trend: DailyTrendResponse[];
}

// Management Statistics Response Types
export interface ManagementStatisticsResponse {
  milestone_health: MilestoneHealthResponse[];
  team_productivity: MemberProductivityResponse[];
  delayed_items: DelayedItemsResponse;
  summary: ManagementSummaryResponse;
  settings: ManagementSettingsResponse;
}

export interface MilestoneHealthResponse {
  milestone: {
    id: string;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string;
  };
  progress_percentage: number;
  estimated_completion_date: string | null;
  status: 'ON_TRACK' | 'SLOW' | 'AT_RISK' | 'OVERDUE';
  days_remaining: number;
  days_overdue: number;
  velocity: {
    average_tasks_per_day: number;
    tasks_remaining: number;
    tasks_completed: number;
    tasks_total: number;
    required_velocity: number;
  };
  burndown: {
    date: string;
    ideal_remaining: number;
    actual_remaining: number;
  }[];
  feature_summary: {
    total_features: number;
    completed_features: number;
    at_risk_features: number;
  };
}

export interface MemberProductivityResponse {
  member: {
    id: string;
    name: string;
    profile_image: string | null;
    role?: string;
  };
  assigned_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  completion_rate: number;
  total_checklists: number;
  completed_checklists: number;
  checklist_completion_rate: number;
  status: 'NORMAL' | 'NEEDS_ATTENTION' | 'COMPLETED';
  in_progress_task_details: {
    task_id: string;
    task_title: string;
    feature_id: string;
    feature_title: string;
    feature_color: string;
    current_block: string;
    days_in_progress: number;
    start_date: string | null;
    due_date: string | null;
    checklist_total: number;
    checklist_completed: number;
  }[];
  stuck_checklists: {
    checklist_id: string;
    checklist_title: string;
    task_id: string;
    task_title: string;
    feature_title: string;
    days_stuck: number;
    created_at: string;
  }[];
  recent_completed_tasks: {
    task_id: string;
    task_title: string;
    feature_title: string;
    completed_at: string;
    days_to_complete: number;
  }[];
}

export interface DelayedItemsResponse {
  overdue_features: {
    feature_id: string;
    feature_title: string;
    feature_color: string;
    due_date: string;
    days_overdue: number;
    assignee: { id: string; name: string; profile_image: string | null } | null;
    progress_percentage: number;
    tasks_remaining: number;
  }[];
  stagnant_tasks: {
    task_id: string;
    task_title: string;
    feature_id: string;
    feature_title: string;
    feature_color: string;
    current_block: string;
    block_name: string;
    days_in_block: number;
    assignee: { id: string; name: string; profile_image: string | null } | null;
    due_date: string | null;
    is_overdue: boolean;
  }[];
  stuck_checklists: {
    checklist_id: string;
    checklist_title: string;
    task_id: string;
    task_title: string;
    feature_id: string;
    feature_title: string;
    feature_color: string;
    days_stuck: number;
    assignee: { id: string; name: string; profile_image: string | null } | null;
    due_date: string | null;
  }[];
  bottleneck_summary: {
    most_delayed_member: {
      member: { id: string; name: string; profile_image: string | null };
      delayed_item_count: number;
      overdue_tasks: number;
      stuck_checklists: number;
    } | null;
    most_problematic_block: {
      block_id: string;
      block_name: string;
      stuck_task_count: number;
      average_days_stuck: number;
    } | null;
    total_overdue_features: number;
    total_stagnant_tasks: number;
    total_stuck_checklists: number;
  };
}

export interface ManagementSummaryResponse {
  total_milestones: number;
  on_track_milestones: number;
  at_risk_milestones: number;
  overdue_milestones: number;
  total_members: number;
  members_on_track: number;
  members_needing_attention: number;
  total_delayed_items: number;
  overall_health_score: number;
}

export interface ManagementSettingsResponse {
  stagnant_task_days_threshold: number;
  stuck_checklist_days_threshold: number;
}

export interface PersonalStatisticsResponse {
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

// 가중치 레벨 타입
export interface WeightLevelResponse {
  id: string;
  name: string;
  weight: number;
  color: string;
  position: number;
  is_default: boolean;
}

export interface BoardWeightSettingsResponse {
  board_id: string;
  levels: WeightLevelResponse[];
  default_level_id: string;
}

export const statisticsAPI = {
  // 보드 전체 통계 조회
  getBoardStatistics: async (
    boardId: string,
    params?: {
      start_date?: string;
      end_date?: string;
      milestone_ids?: string[];
      feature_ids?: string[];
      member_ids?: string[];
      tag_ids?: string[];
    }
  ) => {
    const query = new URLSearchParams();
    if (params?.start_date) query.set('start_date', params.start_date);
    if (params?.end_date) query.set('end_date', params.end_date);
    if (params?.milestone_ids?.length) {
      params.milestone_ids.forEach(id => query.append('milestone_ids', id));
    }
    if (params?.feature_ids?.length) {
      params.feature_ids.forEach(id => query.append('feature_ids', id));
    }
    if (params?.member_ids?.length) {
      params.member_ids.forEach(id => query.append('member_ids', id));
    }
    if (params?.tag_ids?.length) {
      params.tag_ids.forEach(id => query.append('tag_ids', id));
    }
    const queryString = query.toString();
    return apiClient.get<BoardStatisticsResponse>(
      `/boards/${boardId}/statistics${queryString ? `?${queryString}` : ''}`
    );
  },

  // 개인 통계 조회 (본인 데이터만)
  getPersonalStatistics: async (
    boardId: string,
    params?: {
      start_date?: string;
      end_date?: string;
    }
  ) => {
    const query = new URLSearchParams();
    if (params?.start_date) query.set('start_date', params.start_date);
    if (params?.end_date) query.set('end_date', params.end_date);
    const queryString = query.toString();
    return apiClient.get<PersonalStatisticsResponse>(
      `/boards/${boardId}/statistics/personal${queryString ? `?${queryString}` : ''}`
    );
  },

  // 관리 대시보드 통계 조회
  getManagementStatistics: async (
    boardId: string,
    params?: {
      milestone_id?: string;
      stagnant_task_days?: number;
      stuck_checklist_days?: number;
    }
  ) => {
    const query = new URLSearchParams();
    if (params?.milestone_id) query.set('milestone_id', params.milestone_id);
    if (params?.stagnant_task_days !== undefined) {
      query.set('stagnant_task_days', params.stagnant_task_days.toString());
    }
    if (params?.stuck_checklist_days !== undefined) {
      query.set('stuck_checklist_days', params.stuck_checklist_days.toString());
    }
    const queryString = query.toString();
    return apiClient.get<ManagementStatisticsResponse>(
      `/boards/${boardId}/statistics/management${queryString ? `?${queryString}` : ''}`
    );
  },

  // 가중치 레벨 설정 조회
  getWeightLevels: async (boardId: string) => {
    return apiClient.get<BoardWeightSettingsResponse>(
      `/boards/${boardId}/weight-levels`
    );
  },

  // 가중치 레벨 설정 생성/수정
  updateWeightLevels: async (
    boardId: string,
    data: {
      levels: {
        id?: string;
        name: string;
        weight: number;
        color: string;
        position: number;
      }[];
      default_level_id?: string;
    }
  ) => {
    return apiClient.put<BoardWeightSettingsResponse>(
      `/boards/${boardId}/weight-levels`,
      data
    );
  },

  // Task 가중치 설정
  setTaskWeight: async (
    boardId: string,
    taskId: string,
    weightLevelId: string
  ) => {
    return apiClient.patch<{ task_id: string; weight_level_id: string }>(
      `/boards/${boardId}/tasks/${taskId}/weight`,
      { weight_level_id: weightLevelId }
    );
  },

  // Task 가중치 조회
  getTaskWeight: async (boardId: string, taskId: string) => {
    return apiClient.get<{ task_id: string; weight_level: WeightLevelResponse | null }>(
      `/boards/${boardId}/tasks/${taskId}/weight`
    );
  },
};
