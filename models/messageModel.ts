import { supabase, isSupabaseConfigured, isDatabaseNotSetup } from "@/lib/supabase/client"
import type { Message } from "@/lib/types"

export class MessageModel {
  static async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase not configured")
      return []
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`,
        )
        .order("timestamp", { ascending: true })

      if (error) {
        if (isDatabaseNotSetup(error)) {
          console.warn("Database tables not setup")
          return []
        }
        throw error
      }

      return data || []
    } catch (error: any) {
      console.error("Failed to fetch messages:", error.message)
      return []
    }
  }

  static async send(message: Omit<Message, "id" | "timestamp" | "read">): Promise<Message> {
    if (!isSupabaseConfigured()) {
      throw new Error("Database not configured")
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: message.sender_id,
          receiver_id: message.receiver_id,
          message: message.message,
        })
        .select()
        .single()

      if (error) {
        if (isDatabaseNotSetup(error)) {
          throw new Error("Database tables not setup. Please run the database setup script.")
        }
        throw error
      }

      return data
    } catch (error: any) {
      console.error("Failed to send message:", error.message)
      throw error
    }
  }

  static async markAsRead(messageIds: string[]): Promise<void> {
    if (!isSupabaseConfigured() || messageIds.length === 0) {
      return
    }

    try {
      const { error } = await supabase.from("messages").update({ read: true }).in("id", messageIds)

      if (error) {
        console.warn("Failed to mark messages as read:", error.message)
      }
    } catch (error: any) {
      console.warn("Failed to mark messages as read:", error.message)
    }
  }

  static async markConversationAsRead(userId: string, otherUserId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      return
    }

    try {
      const { error } = await supabase
        .from("messages")
        .update({ read: true })
        .eq("sender_id", otherUserId)
        .eq("receiver_id", userId)
        .eq("read", false)

      if (error) {
        console.warn("Failed to mark conversation as read:", error.message)
      }
    } catch (error: any) {
      console.warn("Failed to mark conversation as read:", error.message)
    }
  }

  static async getUnreadCount(userId: string, otherUserId: string): Promise<number> {
    if (!isSupabaseConfigured()) {
      return 0
    }

    try {
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("sender_id", otherUserId)
        .eq("receiver_id", userId)
        .eq("read", false)

      if (error) {
        console.warn("Failed to get unread count:", error.message)
        return 0
      }

      return count || 0
    } catch (error: any) {
      console.warn("Failed to get unread count:", error.message)
      return 0
    }
  }

  static async getLastMessage(userId1: string, userId2: string): Promise<Message | null> {
    if (!isSupabaseConfigured()) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`,
        )
        .order("timestamp", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.warn("Failed to get last message:", error.message)
        return null
      }

      return data
    } catch (error: any) {
      console.warn("Failed to get last message:", error.message)
      return null
    }
  }
}
