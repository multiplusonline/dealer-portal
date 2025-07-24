"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X } from "lucide-react"
import { UploadController } from "@/controllers/uploadController"

interface UploadFormProps {
  userId: string
  onUploadComplete?: () => void
}

export function UploadForm({ userId, onUploadComplete }: UploadFormProps) {
  const { t } = useTranslation()
  const [files, setFiles] = useState<File[]>([])
  const [folder, setFolder] = useState("")
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
  })

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (!folder.trim() || files.length === 0) return

    setUploading(true)
    try {
      await UploadController.handleUpload(files, folder.trim(), userId)
      setFiles([])
      setFolder("")
      onUploadComplete?.()
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("upload.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="folder">{t("upload.folderName")}</Label>
          <Input id="folder" value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="Project naam..." />
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-gray-300"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">{t("upload.dragDrop")}</p>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <Label>Geselecteerde bestanden:</Label>
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">{file.name}</span>
                <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button onClick={handleUpload} disabled={!folder.trim() || files.length === 0 || uploading} className="w-full">
          {uploading ? "Uploading..." : t("upload.submit")}
        </Button>
      </CardContent>
    </Card>
  )
}
