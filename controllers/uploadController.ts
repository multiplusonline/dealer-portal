import { FileModel } from "@/models/fileModel"
import type { FileUpload } from "@/lib/types"

export class UploadController {
  static async handleUpload(files: File[], folder: string, userId: string): Promise<FileUpload[]> {
    const uploadedFiles: FileUpload[] = []

    for (const file of files) {
      try {
        const url = await FileModel.uploadFile(file, folder, userId)

        const fileRecord = await FileModel.create({
          user_id: userId,
          filename: file.name,
          folder,
          status: "pending",
          url,
        })

        uploadedFiles.push(fileRecord)

        // Log upload
        await this.logUpload(userId, file.name, folder)
      } catch (error) {
        console.error("Upload failed for file:", file.name, error)
      }
    }

    return uploadedFiles
  }

  private static async logUpload(userId: string, filename: string, folder: string) {
    // Implementation for upload logging
    console.log(`Upload logged: ${userId} uploaded ${filename} to ${folder}`)
  }
}
