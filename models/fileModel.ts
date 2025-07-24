import { supabase, isSupabaseConfigured, isDatabaseNotSetup } from "@/lib/supabase/client"
import type { FileUpload } from "@/lib/types"

// Mock data for when Supabase isn't configured
const mockFiles: FileUpload[] = [
  {
    id: "1",
    user_id: "current-user-id",
    filename: "product-catalog.pdf",
    folder: "Marketing Materials",
    status: "approved",
    url: "/placeholder.svg?height=200&width=200&text=PDF",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "2",
    user_id: "current-user-id",
    filename: "price-list-2024.xlsx",
    folder: "Price Lists",
    status: "pending",
    url: "/placeholder.svg?height=200&width=200&text=Excel",
    created_at: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: "3",
    user_id: "other-user-id",
    filename: "technical-specs.pdf",
    folder: "Documentation",
    status: "approved",
    url: "/placeholder.svg?height=200&width=200&text=PDF",
    created_at: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    id: "4",
    user_id: "current-user-id",
    filename: "installation-guide.pdf",
    folder: "Documentation",
    status: "rejected",
    url: "/placeholder.svg?height=200&width=200&text=PDF",
    created_at: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: "5",
    user_id: "third-user-id",
    filename: "warranty-info.pdf",
    folder: "Legal",
    status: "pending",
    url: "/placeholder.svg?height=200&width=200&text=PDF",
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
]

export class FileModel {
  static async getAll(): Promise<FileUpload[]> {
    // Always return mock data if Supabase isn't configured
    if (!isSupabaseConfigured()) {
      console.warn("Supabase not configured, using mock data")
      return [...mockFiles]
    }

    try {
      const { data, error } = await supabase.from("files").select("*").order("created_at", { ascending: false })

      if (error) {
        console.warn("Database error, falling back to mock data:", error.message)
        return [...mockFiles]
      }

      return data || []
    } catch (error: any) {
      console.warn("Failed to fetch files, using mock data:", error.message)
      return [...mockFiles]
    }
  }

  static async getApproved(): Promise<FileUpload[]> {
    if (!isSupabaseConfigured()) {
      return mockFiles.filter((f) => f.status === "approved")
    }

    try {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })

      if (error) {
        console.warn("Database error, falling back to mock data:", error.message)
        return mockFiles.filter((f) => f.status === "approved")
      }

      return data || []
    } catch (error: any) {
      console.warn("Failed to fetch approved files, using mock data:", error.message)
      return mockFiles.filter((f) => f.status === "approved")
    }
  }

  static async getByUserId(userId: string): Promise<FileUpload[]> {
    if (!isSupabaseConfigured()) {
      return mockFiles.filter((f) => f.user_id === userId)
    }

    try {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.warn("Database error, falling back to mock data:", error.message)
        return mockFiles.filter((f) => f.user_id === userId)
      }

      return data || []
    } catch (error: any) {
      console.warn("Failed to fetch user files, using mock data:", error.message)
      return mockFiles.filter((f) => f.user_id === userId)
    }
  }

  static async create(file: Omit<FileUpload, "id" | "created_at">): Promise<FileUpload> {
    if (!isSupabaseConfigured()) {
      const newFile: FileUpload = {
        ...file,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      }
      mockFiles.unshift(newFile)
      return newFile
    }

    try {
      const { data, error } = await supabase.from("files").insert(file).select().single()

      if (error) {
        if (isDatabaseNotSetup(error)) {
          console.warn("Database not setup, using mock data")
          const newFile: FileUpload = {
            ...file,
            id: Date.now().toString(),
            created_at: new Date().toISOString(),
          }
          mockFiles.unshift(newFile)
          return newFile
        }
        throw error
      }

      return data
    } catch (error: any) {
      console.warn("Failed to create file, using mock fallback:", error.message)
      const newFile: FileUpload = {
        ...file,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      }
      mockFiles.unshift(newFile)
      return newFile
    }
  }

  static async updateStatus(id: string, status: FileUpload["status"]): Promise<FileUpload> {
    if (!isSupabaseConfigured()) {
      const fileIndex = mockFiles.findIndex((f) => f.id === id)
      if (fileIndex !== -1) {
        mockFiles[fileIndex] = { ...mockFiles[fileIndex], status }
        return mockFiles[fileIndex]
      }
      throw new Error("File not found")
    }

    try {
      const { data, error } = await supabase.from("files").update({ status }).eq("id", id).select().single()

      if (error) {
        if (isDatabaseNotSetup(error)) {
          const fileIndex = mockFiles.findIndex((f) => f.id === id)
          if (fileIndex !== -1) {
            mockFiles[fileIndex] = { ...mockFiles[fileIndex], status }
            return mockFiles[fileIndex]
          }
        }
        throw error
      }

      return data
    } catch (error: any) {
      console.warn("Failed to update file status, using mock fallback:", error.message)
      const fileIndex = mockFiles.findIndex((f) => f.id === id)
      if (fileIndex !== -1) {
        mockFiles[fileIndex] = { ...mockFiles[fileIndex], status }
        return mockFiles[fileIndex]
      }
      throw new Error("File not found")
    }
  }

  static async uploadFile(file: File, folder: string, userId: string): Promise<string> {
    if (!isSupabaseConfigured()) {
      // Return a placeholder URL for demo purposes
      return `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(file.name)}`
    }

    try {
      const fileName = `${Date.now()}-${file.name}`
      const filePath = `${folder}/${fileName}`

      const { error: uploadError } = await supabase.storage.from("uploads").upload(filePath, file)

      if (uploadError) {
        console.warn("Storage upload failed, using placeholder:", uploadError.message)
        return `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(file.name)}`
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("uploads").getPublicUrl(filePath)

      return publicUrl
    } catch (error: any) {
      console.warn("Failed to upload file, using placeholder:", error.message)
      return `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(file.name)}`
    }
  }
}
