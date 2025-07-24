"use client"

import { useTranslation } from "react-i18next"
import { UploadForm } from "@/components/UploadForm"
import { DownloadTable } from "@/components/DownloadTable"
import { ConfigurationStatus } from "@/components/ConfigurationStatus"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  const { t } = useTranslation()

  // Mock user ID - in real app this would come from auth
  const userId = "current-user-id"

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <ConfigurationStatus />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <UploadForm userId={userId} />

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

      <DownloadTable userId={userId} />
    </div>
  )
}
