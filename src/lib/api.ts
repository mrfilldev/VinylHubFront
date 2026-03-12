import type {
  User,
  UserUpdateBody,
  Vinyl,
  VinylCreate,
  TokenResponse,
  FriendsResponse,
  DashboardStats,
} from '@/types'

const BASE_URL = 'https://mrfilldev-vinylhubback-5532.twc1.net'

const TOKEN_KEY = 'vinylhub_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getStaticUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const base = BASE_URL.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, ...init } = options
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  }
  if (!skipAuth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  if (init.body instanceof FormData) {
    delete (headers as Record<string, string>)['Content-Type']
  }
  let res: Response
  try {
    res = await fetch(url, { ...init, headers })
  } catch (err) {
    const msg =
      err instanceof TypeError && err.message === 'Failed to fetch'
        ? 'Не удалось подключиться к серверу. Проверьте: 1) доступность API по адресу ' +
          BASE_URL +
          ' 2) настройки CORS на бэкенде (должен быть разрешён origin вашего фронтенда, например http://localhost:5173).'
        : err instanceof Error
          ? err.message
          : 'Ошибка сети'
    throw new Error(msg)
  }
  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const message = Array.isArray(data.detail)
      ? data.detail.map((d: { msg?: string }) => d.msg).join(', ')
      : typeof data.detail === 'string'
        ? data.detail
        : 'Ошибка запроса'
    throw new ApiError(res.status, message || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// Auth
export const api = {
  auth: {
    register: (body: { email: string; username: string; password: string }) =>
      request<User>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
        skipAuth: true,
      }),
    login: (body: { login: string; password: string }) =>
      request<TokenResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
        skipAuth: true,
      }),
  },

  users: {
    me: () => request<User>('/api/v1/users/me'),
    updateMe: (body: UserUpdateBody) =>
      request<User>('/api/v1/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
    uploadAvatar: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return request<{ url: string }>('/api/v1/users/me/avatar', {
        method: 'POST',
        body: fd,
      })
    },
    search: (q: string) =>
      request<User[]>(`/api/v1/users/search?q=${encodeURIComponent(q)}`),
  },

  friends: {
    list: () => request<FriendsResponse>('/api/v1/friends'),
    invite: (userId: string) =>
      request<{ status: string }>(`/api/v1/friends/invite/${userId}`, { method: 'POST' }),
    acceptInvitation: (id: string) =>
      request<{ status: string }>(`/api/v1/friends/invitations/${id}/accept`, {
        method: 'POST',
      }),
    rejectInvitation: (id: string) =>
      request<{ status: string }>(`/api/v1/friends/invitations/${id}/reject`, {
        method: 'POST',
      }),
    remove: (userId: string) =>
      request<{ status: string }>(`/api/v1/friends/${userId}`, { method: 'DELETE' }),
  },

  vinyl: {
    list: (params?: { skip?: number; limit?: number; artist?: string; title?: string }) => {
      const sp = new URLSearchParams()
      if (params) {
        if (params.skip != null) sp.set('skip', String(params.skip))
        if (params.limit != null) sp.set('limit', String(params.limit))
        if (params.artist) sp.set('artist', params.artist)
        if (params.title) sp.set('title', params.title)
      }
      const q = sp.toString()
      return request<Vinyl[]>(`/api/v1/vinyl${q ? `?${q}` : ''}`)
    },
    get: (id: string) => request<Vinyl>(`/api/v1/vinyl/${id}`),
    create: (body: VinylCreate) =>
      request<Vinyl>('/api/v1/vinyl', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<VinylCreate>) =>
      request<Vinyl>(`/api/v1/vinyl/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<void>(`/api/v1/vinyl/${id}`, { method: 'DELETE' }),
    uploadCover: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return request<{ url: string }>('/api/v1/vinyl/upload-cover', {
        method: 'POST',
        body: fd,
      })
    },
    aiDetect: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return request<{
        cover_image_url: string
        artist?: string
        title?: string
        year?: number
        label?: string
        genre?: string
        condition?: string
        notes?: string
      }>('/api/v1/vinyl/ai-detect', {
        method: 'POST',
        body: fd,
      })
    },
  },

  userVinyl: (userId: string) =>
    request<Vinyl[]>(`/api/v1/users/${userId}/vinyl`),
  userVinylRecord: (userId: string, recordId: string) =>
    request<Vinyl>(`/api/v1/users/${userId}/vinyl/${recordId}`),

  dashboard: () => request<DashboardStats>('/api/v1/dashboard'),

  metadata: {
    conditions: () => request<string[]>('/api/v1/metadata/conditions'),
    privacyLevels: () => request<string[]>('/api/v1/metadata/privacy-levels'),
  },
}
