"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { UploadForm } from "@/components/UploadForm"
import { DownloadTable } from "@/components/DownloadTable"
import { ConfigurationStatus } from "@/components/ConfigurationStatus"
import { UserManagementModel } from "@/models/userManagementModel"
import { isSupabaseConfigured } from "@/lib/supabase/client"

export default function UploadsPage() {
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
      const dealers = await UserManagementModel.getAllDealers(false)
      if (dealers.length > 0) {
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <p>Uploads pagina laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold">Uploads</h1>

      <ConfigurationStatus />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {currentUserId && <UploadForm userId={currentUserId} />}
      </div>

      {currentUserId && <DownloadTable userId={currentUserId} />}
    </div>
  )
}
