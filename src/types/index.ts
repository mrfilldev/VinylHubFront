// User
export interface User {
  id: string
  email: string
  username: string
  bio?: string | null
  language?: string | null
  avatar_url?: string | null
  created_at: string
}

// Auth
export interface LoginBody {
  login: string
  password: string
}

export interface RegisterBody {
  email: string
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: 'bearer'
}

// Vinyl
export interface Vinyl {
  id: string
  user_id: string
  artist: string
  title: string
  label?: string | null
  year?: number | null
  genre?: string | null
  condition?: string | null
  cover_image_url?: string | null
  privacy_level?: string | null
  notes?: string | null
  created_at: string
}

export interface VinylCreate {
  artist: string
  title: string
  label?: string
  year?: number
  genre?: string
  condition?: string
  cover_image_url?: string
  privacy_level?: string
  notes?: string
}

// Friends
export interface FriendItem {
  id: string
  username: string
  email: string
}

export interface IncomingInvitation {
  id: string
  from_user_id: string
  from_username: string
  created_at: string
}

export interface OutgoingInvitation {
  id: string
  to_user_id: string
  to_username: string
  created_at: string
}

export interface FriendsResponse {
  friends: FriendItem[]
  incoming_invitations: IncomingInvitation[]
  outgoing_invitations: OutgoingInvitation[]
}

// Dashboard
export interface DashboardStats {
  records_count: number
  friends_count: number
  exchanges_count: number
}

// User update
export interface UserUpdateBody {
  username?: string
  bio?: string
  language?: string
}
