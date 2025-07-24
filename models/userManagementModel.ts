import { supabase, isSupabaseConfigured, isDatabaseNotSetup } from "@/lib/supabase/client"
import type { Dealer, UserSession, UserPreferences } from "@/lib/types"

export interface CreateDealerData {
  name: string
  email: string
  phone?: string
  company?: string
  role?: "admin" | "dealer" | "manager"
  profile_picture?: string
  notes?: string
}

export interface UpdateDealerData extends Partial<CreateDealerData> {
  status?: "active" | "inactive"
  is_active?: boolean
}

export class UserManagementModel {
  static async createDealer(dealerData: CreateDealerData): Promise<Dealer> {
    if (!isSupabaseConfigured()) {
      throw new Error("Database not configured. Please set up your Supabase environment variables.")
    }

    try {
      // Validate required fields
      if (!dealerData.name?.trim()) {
        throw new Error("Name is required")
      }
      if (!dealerData.email?.trim()) {
        throw new Error("Email is required")
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(dealerData.email)) {
        throw new Error("Please enter a valid email address")
      }

      // Check if email already exists
      const { data: existingDealer, error: checkError } = await supabase
        .from("dealers")
        .select("id")
        .eq("email", dealerData.email.toLowerCase())
        .maybeSingle()

      if (checkError && !isDatabaseNotSetup(checkError)) {
        console.error("Error checking existing dealer:", checkError)
        throw new Error("Failed to validate email address")
      }

      if (existingDealer) {
        throw new Error("A dealer with this email address already exists")
      }

      // Prepare data for insertion
      const insertData = {
        name: dealerData.name.trim(),
        email: dealerData.email.toLowerCase().trim(),
        phone: dealerData.phone?.trim() || null,
        company: dealerData.company?.trim() || null,
        role: dealerData.role || "dealer",
        profile_picture: dealerData.profile_picture?.trim() || null,
        notes: dealerData.notes?.trim() || null,
        status: "active" as const,
        is_active: true,
        registration_date: new Date().toISOString(),
      }

      console.log("Inserting dealer data:", insertData)

      const { data, error } = await supabase.from("dealers").insert(insertData).select().single()

      if (error) {
        console.error("Supabase error:", error)

        if (isDatabaseNotSetup(error)) {
          throw new Error("Database tables not setup. Please run the database setup script first.")
        }

        if (error.code === "23505") {
          throw new Error("A dealer with this email address already exists")
        }

        if (error.code === "23502") {
          throw new Error("Missing required field. Please check all required fields are filled.")
        }

        throw new Error(`Database error: ${error.message}`)
      }

      if (!data) {
        throw new Error("Failed to create dealer - no data returned")
      }

      // Create default user preferences
      try {
        await this.createDefaultPreferences(data.id)
      } catch (prefError) {
        console.warn("Failed to create default preferences:", prefError)
        // Don't fail the whole operation for preferences
      }

      return data
    } catch (error: any) {
      console.error("Failed to create dealer:", error)

      // Re-throw with a clear message
      if (error.message) {
        throw new Error(error.message)
      } else {
        throw new Error("An unexpected error occurred while creating the dealer")
      }
    }
  }

  static async updateDealer(id: string, updates: UpdateDealerData): Promise<Dealer> {
    if (!isSupabaseConfigured()) {
      throw new Error("Database not configured")
    }

    try {
      // Validate required fields if they're being updated
      if (updates.name !== undefined && !updates.name?.trim()) {
        throw new Error("Name cannot be empty")
      }
      if (updates.email !== undefined && !updates.email?.trim()) {
        throw new Error("Email cannot be empty")
      }

      // Validate email format if email is being updated
      if (updates.email && updates.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(updates.email)) {
          throw new Error("Please enter a valid email address")
        }
      }

      // Prepare update data
      const updateData: any = {}
      if (updates.name !== undefined) updateData.name = updates.name.trim()
      if (updates.email !== undefined) updateData.email = updates.email.toLowerCase().trim()
      if (updates.phone !== undefined) updateData.phone = updates.phone?.trim() || null
      if (updates.company !== undefined) updateData.company = updates.company?.trim() || null
      if (updates.role !== undefined) updateData.role = updates.role
      if (updates.profile_picture !== undefined) updateData.profile_picture = updates.profile_picture?.trim() || null
      if (updates.notes !== undefined) updateData.notes = updates.notes?.trim() || null
      if (updates.status !== undefined) updateData.status = updates.status
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active

      const { data, error } = await supabase.from("dealers").update(updateData).eq("id", id).select().single()

      if (error) {
        console.error("Update error:", error)

        if (error.code === "PGRST116") {
          throw new Error("Dealer not found")
        }

        if (error.code === "23505") {
          throw new Error("A dealer with this email address already exists")
        }

        throw new Error(`Failed to update dealer: ${error.message}`)
      }

      if (!data) {
        throw new Error("Failed to update dealer - no data returned")
      }

      return data
    } catch (error: any) {
      console.error("Failed to update dealer:", error)
      throw new Error(error.message || "An unexpected error occurred while updating the dealer")
    }
  }

  static async deleteDealer(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error("Database not configured")
    }

    try {
      const { error } = await supabase.from("dealers").delete().eq("id", id)

      if (error) {
        console.error("Delete error:", error)
        throw new Error(`Failed to delete dealer: ${error.message}`)
      }
    } catch (error: any) {
      console.error("Failed to delete dealer:", error)
      throw new Error(error.message || "An unexpected error occurred while deleting the dealer")
    }
  }

  static async getAllDealers(includeInactive = false): Promise<Dealer[]> {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase not configured, returning empty array")
      return []
    }

    try {
      let query = supabase.from("dealers").select("*").order("registration_date", { ascending: false })

      if (!includeInactive) {
        query = query.eq("is_active", true)
      }

      const { data, error } = await query

      if (error) {
        if (isDatabaseNotSetup(error)) {
          console.warn("Database tables not setup, returning empty array")
          return []
        }
        console.error("Failed to fetch dealers:", error)
        return []
      }

      return data || []
    } catch (error: any) {
      console.error("Failed to fetch dealers:", error)
      return []
    }
  }

  static async getDealerById(id: string): Promise<Dealer | null> {
    if (!isSupabaseConfigured()) {
      return null
    }

    try {
      const { data, error } = await supabase.from("dealers").select("*").eq("id", id).single()

      if (error) {
        if (error.code === "PGRST116") {
          return null
        }
        console.warn("Failed to fetch dealer:", error)
        return null
      }

      return data
    } catch (error: any) {
      console.warn("Failed to fetch dealer:", error)
      return null
    }
  }

  static async searchDealers(query: string): Promise<Dealer[]> {
    if (!isSupabaseConfigured() || !query.trim()) {
      return []
    }

    try {
      const searchTerm = query.trim()
      const { data, error } = await supabase
        .from("dealers")
        .select("*")
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`)
        .eq("is_active", true)
        .limit(20)

      if (error) {
        console.error("Search error:", error)
        return []
      }

      return data || []
    } catch (error: any) {
      console.error("Failed to search dealers:", error)
      return []
    }
  }

  static async toggleDealerStatus(id: string): Promise<Dealer> {
    if (!isSupabaseConfigured()) {
      throw new Error("Database not configured")
    }

    try {
      // First get current status
      const { data: currentDealer, error: fetchError } = await supabase
        .from("dealers")
        .select("is_active, status")
        .eq("id", id)
        .single()

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          throw new Error("Dealer not found")
        }
        throw new Error(`Failed to fetch dealer status: ${fetchError.message}`)
      }

      const newStatus = !currentDealer.is_active
      const newStatusText = newStatus ? "active" : "inactive"

      const { data, error } = await supabase
        .from("dealers")
        .update({
          is_active: newStatus,
          status: newStatusText,
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update dealer status: ${error.message}`)
      }

      return data
    } catch (error: any) {
      console.error("Failed to toggle dealer status:", error)
      throw new Error(error.message || "An unexpected error occurred while updating dealer status")
    }
  }

  static async createDefaultPreferences(userId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      return
    }

    try {
      const { error } = await supabase.from("user_preferences").insert({
        user_id: userId,
        language: "nl",
        theme: "light",
        notifications_enabled: true,
        email_notifications: true,
        chat_notifications: true,
      })

      if (error && error.code !== "23505") {
        // Ignore duplicate key error (23505)
        console.warn("Failed to create default preferences:", error.message)
      }
    } catch (error: any) {
      console.warn("Failed to create default preferences:", error)
    }
  }

  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    if (!isSupabaseConfigured()) {
      return null
    }

    try {
      const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single()

      if (error) {
        if (error.code === "PGRST116") {
          // Create default preferences if they don't exist
          await this.createDefaultPreferences(userId)
          return {
            id: "",
            user_id: userId,
            language: "nl",
            theme: "light",
            notifications_enabled: true,
            email_notifications: true,
            chat_notifications: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
        throw error
      }

      return data
    } catch (error: any) {
      console.error("Failed to fetch user preferences:", error)
      return null
    }
  }

  static async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    if (!isSupabaseConfigured()) {
      throw new Error("Database not configured")
    }

    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update preferences: ${error.message}`)
      }

      return data
    } catch (error: any) {
      console.error("Failed to update user preferences:", error)
      throw new Error(error.message || "Failed to update user preferences")
    }
  }

  static async getActiveSessions(): Promise<UserSession[]> {
    if (!isSupabaseConfigured()) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from("user_sessions")
        .select(`
          *,
          dealers:user_id (
            name,
            email,
            profile_picture
          )
        `)
        .eq("is_active", true)
        .order("session_start", { ascending: false })

      if (error) {
        console.error("Failed to fetch active sessions:", error)
        return []
      }

      return data || []
    } catch (error: any) {
      console.error("Failed to fetch active sessions:", error)
      return []
    }
  }

  static async createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<UserSession> {
    if (!isSupabaseConfigured()) {
      throw new Error("Database not configured")
    }

    try {
      // End any existing active sessions for this user
      await supabase
        .from("user_sessions")
        .update({
          is_active: false,
          session_end: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("is_active", true)

      // Create new session
      const { data, error } = await supabase
        .from("user_sessions")
        .insert({
          user_id: userId,
          ip_address: ipAddress,
          user_agent: userAgent,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create session: ${error.message}`)
      }

      return data
    } catch (error: any) {
      console.error("Failed to create session:", error)
      throw new Error(error.message || "Failed to create session")
    }
  }

  static async endSession(sessionId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      return
    }

    try {
      const { error } = await supabase
        .from("user_sessions")
        .update({
          is_active: false,
          session_end: new Date().toISOString(),
        })
        .eq("id", sessionId)

      if (error) {
        console.warn("Failed to end session:", error.message)
      }
    } catch (error: any) {
      console.warn("Failed to end session:", error)
    }
  }

  static async getDealerStats(): Promise<{
    total: number
    active: number
    inactive: number
    newThisWeek: number
    onlineNow: number
  }> {
    if (!isSupabaseConfigured()) {
      return { total: 0, active: 0, inactive: 0, newThisWeek: 0, onlineNow: 0 }
    }

    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

      const [totalResult, activeResult, inactiveResult, newResult, onlineResult] = await Promise.all([
        supabase.from("dealers").select("id", { count: "exact", head: true }),
        supabase.from("dealers").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("dealers").select("id", { count: "exact", head: true }).eq("is_active", false),
        supabase.from("dealers").select("id", { count: "exact", head: true }).gte("registration_date", oneWeekAgo),
        supabase.from("dealers").select("id", { count: "exact", head: true }).gte("last_login", fiveMinutesAgo),
      ])

      return {
        total: totalResult.count || 0,
        active: activeResult.count || 0,
        inactive: inactiveResult.count || 0,
        newThisWeek: newResult.count || 0,
        onlineNow: onlineResult.count || 0,
      }
    } catch (error: any) {
      console.error("Failed to fetch dealer stats:", error)
      return { total: 0, active: 0, inactive: 0, newThisWeek: 0, onlineNow: 0 }
    }
  }
}
