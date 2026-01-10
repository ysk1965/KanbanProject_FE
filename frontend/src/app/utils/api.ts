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

    // 인증 토큰 추가
    if (!skipAuth) {
      const token = getAccessToken();
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

      // 204 No Content 처리
      if (response.status === 204) {
        console.log(`✅ [API Response] ${options?.method || 'GET'} ${url}`, { status: 204, data: null });
        return {} as T;
      }

      const data = await response.json();

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
    if (!refreshToken) return false;

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

    clearTokens();
    return false;
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

export interface BoardListItem {
  id: string;
  name: string;
  description: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  is_starred: boolean;
  member_count: number;
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
  assignee: AssigneeResponse | null;
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
  due_date: string | null;
  position: number;
  created_at: string;
  completed_at: string | null;
}

export interface ChecklistResponse {
  total: number;
  completed: number;
  items: ChecklistItemResponse[];
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
  getFeatures: async (boardId: string) => {
    return apiClient.get<{ features: FeatureResponse[] }>(`/boards/${boardId}/features`);
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
  getTasks: async (boardId: string, params?: { block_id?: string; feature_id?: string }) => {
    const query = new URLSearchParams();
    if (params?.block_id) query.set('block_id', params.block_id);
    if (params?.feature_id) query.set('feature_id', params.feature_id);
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
      assignee_id?: string;
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
      assignee_id?: string | null;
      due_date?: string | null;
      estimated_minutes?: number | null;
    }
  ) => {
    return apiClient.put<TaskResponse>(`/boards/${boardId}/tasks/${taskId}`, data);
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
    data: { title: string; assignee_id?: string; due_date?: string }
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
    data: { title?: string; assignee_id?: string | null; due_date?: string | null }
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
