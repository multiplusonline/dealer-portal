"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client"
import { MessageModel } from "@/models/messageModel"
import type { Message } from "@/lib/types"

export function useRealtimeMessages(userId: string, otherUserId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMessages = useCallback(async () => {
    if (!userId || !otherUserId) return

    try {
      setError(null)
      const data = await MessageModel.getConversation(userId, otherUserId)
      setMessages(data)
    } catch (error: any) {
      console.error("Failed to load messages:", error)
      setError(error.message || "Failed to load messages")
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [userId, otherUserId])

  useEffect(() => {
    loadMessages()

    if (!isSupabaseConfigured()) {
      return
    }

    // Set up real-time subscription
    const channel = supabase
      .channel(`messages-${userId}-${otherUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `or(and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId}))`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => {
              const newMessage = payload.new as Message
              // Avoid duplicates
              if (prev.some((msg) => msg.id === newMessage.id)) {
                return prev
              }
              return [...prev, newMessage]
            })
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) => prev.map((msg) => (msg.id === payload.new.id ? (payload.new as Message) : msg)))
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("Real-time subscription failed")
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, otherUserId, loadMessages])

  const sendMessage = async (message: string) => {
    if (!message.trim()) return

    try {
      const newMessage = await MessageModel.send({
        sender_id: userId,
        receiver_id: otherUserId,
        message: message.trim(),
      })

      // Add message immediately for better UX
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((msg) => msg.id === newMessage.id)) {
          return prev
        }
        return [...prev, newMessage]
      })

      return newMessage
    } catch (error: any) {
      console.error("Failed to send message:", error)
      throw error
    }
  }

  const markAsRead = async (messageIds: string[]) => {
    if (messageIds.length === 0) return

    try {
      await MessageModel.markAsRead(messageIds)
      // Update local state immediately
      setMessages((prev) => prev.map((msg) => (messageIds.includes(msg.id) ? { ...msg, read: true } : msg)))
    } catch (error: any) {
      console.error("Failed to mark messages as read:", error)
    }
  }

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    refreshMessages: loadMessages,
  }
}
