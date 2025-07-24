"use client"

import { useState, useEffect } from "react"
import { ConversationList } from "@/components/ConversationList"
import { ChatWindow } from "@/components/ChatWindow"
import { UserSwitcher } from "@/components/UserSwitcher"
import { DatabaseSetupInstructions } from "@/components/DatabaseSetupInstructions"
import { UserManagementModel } from "@/models/userManagementModel"
import { ChatModel } from "@/models/chatModel"
import { isSupabaseConfigured } from "@/lib/supabase/client"
import type { Dealer } from "@/lib/types"
import { MessageCircle } from "lucide-react"

export default function ChatPage() {
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInitialUser()
  }, [])

  useEffect(() => {
    if (isSupabaseConfigured() && currentUserId) {
      // Log that user started a chat session
      ChatModel.logChatAction(currentUserId, "conversation_started", {
        timestamp: new Date().toISOString(),
      })
    }
  }, [currentUserId])

  const loadInitialUser = async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    try {
      // Get the first available dealer as the current user
      const dealers = await UserManagementModel.getAllDealers(false)
      if (dealers.length > 0) {
        // Try to find a user with "current" in email, otherwise use first dealer
        const currentUser = dealers.find((d) => d.email.includes("current")) || dealers[0]
        setCurrentUserId(currentUser.id)
      }
    } catch (error) {
      console.error("Failed to load initial user:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectDealer = (dealer: Dealer) => {
    setSelectedDealer(dealer)
  }

  const handleUserChange = (userId: string) => {
    setCurrentUserId(userId)
    setSelectedDealer(null) // Reset selected dealer when switching users
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-[600px] flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chat laden...</h3>
            <p className="text-gray-500">Even geduld terwijl we de gebruikers ophalen.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DatabaseSetupInstructions />

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

  if (!currentUserId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DatabaseSetupInstructions />

        <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Geen gebruikers gevonden</h3>
            <p className="text-gray-500 max-w-sm">
              Voer eerst het database setup script uit om test gebruikers aan te maken.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DatabaseSetupInstructions />

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
