"use client"

import { useState, useEffect } from "react"
import { UserManagementModel } from "@/models/userManagementModel"
import { Avatar } from "./Avatar"
import type { Dealer } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, RefreshCw } from "lucide-react"

interface UserSwitcherProps {
  currentUserId: string
  onUserChange: (userId: string) => void
}

export function UserSwitcher({ currentUserId, onUserChange }: UserSwitcherProps) {
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<Dealer | null>(null)

  useEffect(() => {
    loadDealers()
  }, [])

  useEffect(() => {
    const user = dealers.find((d) => d.id === currentUserId)
    setCurrentUser(user || null)
  }, [currentUserId, dealers])

  const loadDealers = async () => {
    setLoading(true)
    try {
      const data = await UserManagementModel.getAllDealers(false)
      setDealers(data)

      // If no current user is selected and we have dealers, select the first one
      if (!currentUserId && data.length > 0) {
        onUserChange(data[0].id)
      }
    } catch (error) {
      console.error("Failed to load dealers:", error)
    } finally {
      setLoading(false)
    }
  }

  const isOnline = (dealer: Dealer) => {
    if (!dealer.last_login) return false
    const lastLoginTime = new Date(dealer.last_login).getTime()
    const now = Date.now()
    return now - lastLoginTime < 5 * 60 * 1000 // 5 minutes
  }

  if (loading) {
    return (
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Users className="h-5 w-5" />
            Test User Switcher
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span>Gebruikers laden...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (dealers.length === 0) {
    return (
      <Card className="mb-6 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Users className="h-5 w-5" />
            Geen Gebruikers Gevonden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700">
            Er zijn nog geen dealers in de database. Voer eerst het database setup script uit.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-blue-800">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Test User Switcher
          </span>
          <Button variant="outline" size="sm" onClick={loadDealers} disabled={loading} className="bg-transparent">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {currentUser && (
              <>
                <div className="relative">
                  <Avatar src={currentUser.profile_picture} alt={currentUser.name} size="md" />
                  {isOnline(currentUser) && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-blue-900">{currentUser.name}</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-blue-700">{currentUser.email}</p>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      {currentUser.role || "dealer"}
                    </Badge>
                    {isOnline(currentUser) && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Online
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Select value={currentUserId} onValueChange={onUserChange}>
              <SelectTrigger className="w-64 bg-white">
                <SelectValue placeholder="Selecteer test gebruiker..." />
              </SelectTrigger>
              <SelectContent>
                {dealers.map((dealer) => (
                  <SelectItem key={dealer.id} value={dealer.id}>
                    <div className="flex items-center space-x-2">
                      <Avatar src={dealer.profile_picture} alt={dealer.name} size="sm" />
                      <div>
                        <p className="font-medium">{dealer.name}</p>
                        <p className="text-xs text-gray-500">{dealer.email}</p>
                      </div>
                      {isOnline(dealer) && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 text-sm text-blue-700">
          <p>
            <strong>Voor testing:</strong> Wissel tussen verschillende gebruikers om chat functionaliteit te testen.
            Groene indicator toont online status.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
