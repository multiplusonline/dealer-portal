"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { FileModel } from "@/models/fileModel"
import type { FileUpload } from "@/lib/types"
import { StatusBadge } from "./StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, RefreshCw } from "lucide-react"

interface DownloadTableProps {
  showAll?: boolean
  userId?: string
}

export function DownloadTable({ showAll = false, userId }: DownloadTableProps) {
  const { t } = useTranslation()
  const [files, setFiles] = useState<FileUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFiles()
  }, [showAll, userId])

  const loadFiles = async () => {
    setLoading(true)
    setError(null)

    try {
      let data: FileUpload[]
      if (showAll) {
        data = await FileModel.getAll()
      } else if (userId) {
        data = await FileModel.getByUserId(userId)
      } else {
        data = await FileModel.getApproved()
      }
      setFiles(data)
    } catch (error: any) {
      console.error("Failed to load files:", error)
      setError("Er is een fout opgetreden bij het laden van bestanden")
      setFiles([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (file: FileUpload) => {
    window.open(file.url, "_blank")
    // Log download here
  }

  const handleStatusChange = async (fileId: string, status: FileUpload["status"]) => {
    try {
      await FileModel.updateStatus(fileId, status)
      await loadFiles() // Reload the files
    } catch (error: any) {
      console.error("Failed to update status:", error)
      setError("Er is een fout opgetreden bij het bijwerken van de status")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("downloads.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Bestanden laden...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {t("downloads.title")}
          <Button variant="outline" size="sm" onClick={loadFiles}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Vernieuwen
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
        )}

        {files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Geen bestanden gevonden</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bestand</TableHead>
                <TableHead>Map</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">{file.filename}</TableCell>
                  <TableCell>{file.folder}</TableCell>
                  <TableCell>
                    <StatusBadge status={file.status} />
                  </TableCell>
                  <TableCell>{new Date(file.created_at).toLocaleDateString("nl-NL")}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {(file.status === "approved" || showAll) && (
                        <Button variant="outline" size="sm" onClick={() => handleDownload(file)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {showAll && file.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(file.id, "approved")}
                            className="text-green-600 hover:text-green-700"
                          >
                            Goedkeuren
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(file.id, "rejected")}
                            className="text-red-600 hover:text-red-700"
                          >
                            Afwijzen
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
