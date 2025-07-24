import { supabase, isSupabaseConfigured } from "@/lib/supabase/client"
import { DealerModel } from "./dealerModel"
import { MessageModel } from "./messageModel"
import type { ConversationSummary } from "@/lib/types"

export class ChatModel {
  static async getConversationSummaries(userId: string): Promise<ConversationSummary[]> {
    if (!isSupabaseConfigured()) {
      return []
    }

    try {
      // Get all active dealers except current user
      const dealers = await DealerModel.getAll()
      const otherDealers = dealers.filter((d) => d.id !== userId && d.status === "active")

      if (otherDealers.length === 0) {
        return []
      }

      const summaries: ConversationSummary[] = []

      // Use Promise.all for better performance
      const summaryPromises = otherDealers.map(async (dealer) => {
        const [lastMessage, unreadCount] = await Promise.all([
          MessageModel.getLastMessage(userId, dealer.id),
          MessageModel.getUnreadCount(userId, dealer.id),
        ])

        return {
          dealer,
          lastMessage: lastMessage || undefined,
          unreadCount,
        }
      })

      const results = await Promise.all(summaryPromises)
      summaries.push(...results)

      // Sort by last message timestamp (most recent first)
      return summaries.sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0
        const bTime = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0
        return bTime - aTime
      })
    } catch (error) {
      console.error("Failed to get conversation summaries:", error)
      return []
    }
  }

  static async markConversationAsRead(userId: string, otherUserId: string): Promise<void> {
    try {
      await MessageModel.markConversationAsRead(userId, otherUserId)
    } catch (error) {
      console.error("Failed to mark conversation as read:", error)
    }
  }

  static async logChatAction(userId: string, action: string, details: Record<string, any>): Promise<void> {
    if (!isSupabaseConfigured()) {
      return
    }

    try {
      const { error } = await supabase.from("chat_logs").insert({
        user_id: userId,
        action,
        details,
      })

      if (error) {
        console.warn("Failed to log chat action:", error.message)
      }
    } catch (error) {
      console.warn("Failed to log chat action:", error)
    }
  }
}
