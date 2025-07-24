"use client"

import { useState, useEffect } from "react"
import { ConversationList } from "@/components/ConversationList"
import { ChatWindow } from "@/components/ChatWindow"
import { UserSwitcher } from "@/components/UserSwitcher"
import { ConfigurationStatus } from "@/components/ConfigurationStatus"
import { ChatModel } from "@/models/chatModel"
import { isSupabaseConfigured } from "@/lib/supabase/client"
import type { Dealer } from "@/lib/types"
import { MessageCircle, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ChatPage() {
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null)
  const [currentUserId, setCurrentUserId] = useState("dealer-jan-001") // Default test user

  useEffect(() => {
    if (isSupabaseConfigured()) {
      // Log that user started a chat session
      ChatModel.logChatAction(currentUserId, "conversation_started", {
        timestamp: new Date().toISOString(),
      })
    }
  }, [currentUserId])

  const handleSelectDealer = (dealer: Dealer) => {
    setSelectedDealer(dealer)
  }

  const handleUserChange = (userId: string) => {
    setCurrentUserId(userId)
    setSelectedDealer(null) // Reset selected dealer when switching users
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Database niet geconfigureerd:</strong> Chat functionaliteit vereist een Supabase database.
            <br />
            <span className="text-sm">
              Configureer je Supabase environment variables en voer het database setup script uit.
            </span>
          </AlertDescription>
        </Alert>

        <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chat niet beschikbaar</h3>
            <p className="text-gray-500 max-w-sm">
              Configureer eerst je Supabase database om de chat functionaliteit te gebruiken.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ConfigurationStatus />

      <UserSwitcher currentUserId={currentUserId} onUserChange={handleUserChange} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
        <div className="lg:col-span-4">
          <ConversationList
            currentUserId={currentUserId}
            selectedDealer={selectedDealer}
            onSelectDealer={handleSelectDealer}
          />
        </div>

        <div className="lg:col-span-8">
          {selectedDealer ? (
            <ChatWindow
              currentUserId={currentUserId}
              otherUserId={selectedDealer.id}
              otherUserName={selectedDealer.name}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecteer een gesprek</h3>
                <p className="text-gray-500 max-w-sm">
                  Kies een dealer uit de lijst om een gesprek te starten of een bestaand gesprek voort te zetten.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
