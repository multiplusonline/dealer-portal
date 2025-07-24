"use client"

import { useState, useEffect } from "react"
import { ChatModel } from "@/models/chatModel"
import { useOnlineStatus } from "@/hooks/useOnlineStatus"
import { Avatar } from "./Avatar"
import type { ConversationSummary, Dealer } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, MessageCircle, Clock } from "lucide-react"

interface ConversationListProps {
  currentUserId: string
  selectedDealer: Dealer | null
  onSelectDealer: (dealer: Dealer) => void
}

export function ConversationList({ currentUserId, selectedDealer, onSelectDealer }: ConversationListProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isOnline } = useOnlineStatus(currentUserId)

  useEffect(() => {
    loadConversations()
  }, [currentUserId])

  const loadConversations = async () => {
    if (!currentUserId) return

    setLoading(true)
    setError(null)

    try {
      const data = await ChatModel.getConversationSummaries(currentUserId)
      setConversations(data)
    } catch (error: any) {
      console.error("Failed to load conversations:", error)
      setError("Failed to load conversations")
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return diffInMinutes < 1 ? "Nu" : `${diffInMinutes}m geleden`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}u geleden`
    } else {
      return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })
    }
  }

  const truncateMessage = (message: string, maxLength = 50) => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Gesprekken
          </span>
          <Button variant="outline" size="sm" onClick={loadConversations} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <div className="p-4 text-center text-red-600 bg-red-50 border-b">
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={loadConversations} className="mt-2 bg-transparent">
              Probeer opnieuw
            </Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 px-4">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>Geen gesprekken gevonden</p>
            <p className="text-sm text-gray-400 mt-1">
              {error ? "Controleer je database configuratie" : "Start een gesprek met een dealer"}
            </p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            {conversations.map((conversation) => (
              <Button
                key={conversation.dealer.id}
                variant="ghost"
                className={`w-full justify-start p-4 h-auto rounded-none border-b border-gray-100 hover:bg-gray-50 ${
                  selectedDealer?.id === conversation.dealer.id ? "bg-blue-50 border-blue-200" : ""
                }`}
                onClick={() => onSelectDealer(conversation.dealer)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="relative">
                    <Avatar src={conversation.dealer.profile_picture} alt={conversation.dealer.name} size="md" />
                    {isOnline(conversation.dealer.id) && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 truncate">{conversation.dealer.name}</p>
                        {isOnline(conversation.dealer.id) && (
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="bg-blue-500 text-white text-xs px-2 py-1">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatLastMessageTime(conversation.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                    </div>

                    {conversation.lastMessage && (
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {conversation.lastMessage.sender_id === currentUserId ? "Jij: " : ""}
                        {truncateMessage(conversation.lastMessage.message)}
                      </p>
                    )}

                    {!conversation.lastMessage && (
                      <p className="text-sm text-gray-400 italic mt-1">Nog geen berichten</p>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
