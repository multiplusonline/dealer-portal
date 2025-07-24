"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { UploadForm } from "@/components/UploadForm"
import { DownloadTable } from "@/components/DownloadTable"
import { DatabaseSetupInstructions } from "@/components/DatabaseSetupInstructions"
import { UserManagementModel } from "@/models/userManagementModel"
import { isSupabaseConfigured } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  const { t } = useTranslation()
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInitialUser()
  }, [])

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center py-8">
          <p>Dashboard laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <DatabaseSetupInstructions />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {currentUserId && <UploadForm userId={currentUserId} />}

        <Card>
          <CardHeader>
            <CardTitle>Snelle Acties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Welkom bij het dealer portaal!</p>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>Upload bestanden naar projectmappen</li>
                <li>Download goedgekeurde bestanden</li>
                <li>Chat met andere dealers</li>
                <li>Bekijk je upload geschiedenis</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {currentUserId && <DownloadTable userId={currentUserId} />}
    </div>
  )
}
