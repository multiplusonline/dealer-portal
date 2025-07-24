"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ChatModel } from "@/models/chatModel"
import { DealerModel } from "@/models/dealerModel"
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages"
import { useOnlineStatus } from "@/hooks/useOnlineStatus"
import { Avatar } from "./Avatar"
import type { Dealer } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Send, Loader2, AlertCircle } from "lucide-react"

interface ChatWindowProps {
  currentUserId: string
  otherUserId: string
  otherUserName: string
}

export function ChatWindow({ currentUserId, otherUserId, otherUserName }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [otherUser, setOtherUser] = useState<Dealer | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, loading, error, sendMessage, markAsRead } = useRealtimeMessages(currentUserId, otherUserId)
  const { isOnline } = useOnlineStatus(currentUserId)

  useEffect(() => {
    loadOtherUser()
    markConversationAsRead()
  }, [otherUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Mark unread messages as read when they come into view
    const unreadMessages = messages.filter((m) => m.receiver_id === currentUserId && !m.read)
    if (unreadMessages.length > 0) {
      markAsRead(unreadMessages.map((m) => m.id))
    }
  }, [messages, currentUserId, markAsRead])

  const loadOtherUser = async () => {
    try {
      const user = await DealerModel.getById(otherUserId)
      setOtherUser(user)
    } catch (error) {
      console.error("Failed to load other user:", error)
    }
  }

  const markConversationAsRead = async () => {
    try {
      await ChatModel.markConversationAsRead(currentUserId, otherUserId)
    } catch (error) {
      console.error("Failed to mark conversation as read:", error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      await sendMessage(newMessage.trim())
      setNewMessage("")

      // Log chat action
      await ChatModel.logChatAction(currentUserId, "message_sent", {
        receiver_id: otherUserId,
        message_length: newMessage.trim().length,
      })
    } catch (error: any) {
      console.error("Failed to send message:", error)
      // Show error to user
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (error) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <CardContent className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Fout bij laden van berichten</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <p className="text-sm text-gray-400">Controleer je database configuratie</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b bg-gray-50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar src={otherUser?.profile_picture} alt={otherUserName} size="lg" />
              {isOnline(otherUserId) && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{otherUserName}</h3>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-500">
                  {isOnline(otherUserId) ? (
                    <span className="flex items-center text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                      Online
                    </span>
                  ) : otherUser?.last_login ? (
                    `Laatst gezien: ${new Date(otherUser.last_login).toLocaleDateString("nl-NL")}`
                  ) : (
                    "Offline"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Berichten laden...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nog geen berichten in dit gesprek</p>
              <p className="text-sm text-gray-400 mt-1">Stuur een bericht om het gesprek te starten</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isCurrentUser = message.sender_id === currentUserId
              const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} ${showAvatar ? "mt-4" : "mt-1"}`}
                >
                  <div
                    className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                      isCurrentUser ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    {showAvatar && !isCurrentUser && (
                      <Avatar src={otherUser?.profile_picture} alt={otherUserName} size="sm" />
                    )}
                    {!showAvatar && !isCurrentUser && <div className="w-8" />}

                    <div
                      className={`px-4 py-2 rounded-lg ${
                        isCurrentUser
                          ? "bg-blue-500 text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-900 rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      <div
                        className={`text-xs mt-1 flex items-center justify-end ${isCurrentUser ? "text-blue-100" : "text-gray-500"}`}
                      >
                        <span className="mr-1">{formatMessageTime(message.timestamp)}</span>
                        {isCurrentUser && <span className="text-xs">{message.read ? "✓✓" : "✓"}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4 bg-white">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type een bericht..."
              disabled={sending || !!error}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!newMessage.trim() || sending || !!error}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
