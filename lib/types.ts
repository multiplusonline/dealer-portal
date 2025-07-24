export interface Dealer {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  role?: "admin" | "dealer" | "manager"
  profile_picture?: string
  status: "active" | "inactive"
  is_active?: boolean
  created_at: string
  registration_date?: string
  last_login?: string
  last_activity?: string
  notes?: string
}

export interface FileUpload {
  id: string
  user_id: string
  filename: string
  folder: string
  status: "pending" | "approved" | "rejected"
  url: string
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  timestamp: string
  read: boolean
}

export interface LoginLog {
  id: string
  user_id: string
  timestamp: string
  ip_address: string
}

export interface DownloadLog {
  id: string
  user_id: string
  file_id: string
  timestamp: string
}

export interface UploadLog {
  id: string
  user_id: string
  filename: string
  folder: string
  timestamp: string
}

export interface ChatLog {
  id: string
  user_id: string
  action: "message_sent" | "message_read" | "conversation_started"
  details: Record<string, any>
  timestamp: string
}

export interface ConversationSummary {
  dealer: Dealer
  lastMessage?: Message
  unreadCount: number
}

export interface UserSession {
  id: string
  user_id: string
  session_start: string
  session_end?: string
  ip_address?: string
  user_agent?: string
  is_active: boolean
  dealers?: {
    name: string
    email: string
    profile_picture?: string
  }
}

export interface UserPreferences {
  id: string
  user_id: string
  language: string
  theme: string
  notifications_enabled: boolean
  email_notifications: boolean
  chat_notifications: boolean
  created_at: string
  updated_at: string
}

export interface DealerStats {
  total: number
  active: number
  inactive: number
  newThisWeek: number
  onlineNow: number
}
