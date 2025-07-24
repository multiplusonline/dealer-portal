import { supabase, isSupabaseConfigured, isDatabaseNotSetup } from "@/lib/supabase/client"
import type { Dealer } from "@/lib/types"

export class DealerModel {
  static async getAll(): Promise<Dealer[]> {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase not configured")
      return []
    }

    try {
      const { data, error } = await supabase.from("dealers").select("*").order("created_at", { ascending: false })

      if (error) {
        if (isDatabaseNotSetup(error)) {
          console.warn("Database tables not setup")
          return []
        }
        throw error
      }

      return data || []
    } catch (error: any) {
      console.error("Failed to fetch dealers:", error.message)
      return []
    }
  }

  static async getById(id: string): Promise<Dealer | null> {
    if (!isSupabaseConfigured()) {
      return null
    }

    try {
      const { data, error } = await supabase.from("dealers").select("*").eq("id", id).single()

      if (error) {
        if (error.code === "PGRST116") {
          return null
        }
        console.warn("Failed to fetch dealer:", error.message)
        return null
      }

      return data
    } catch (error: any) {
      console.warn("Failed to fetch dealer:", error.message)
      return null
    }
  }

  static async updateLastLogin(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      return
    }

    try {
      const { error } = await supabase.from("dealers").update({ last_login: new Date().toISOString() }).eq("id", id)

      if (error) {
        console.warn("Failed to update last login:", error.message)
      }
    } catch (error: any) {
      console.warn("Failed to update last login:", error.message)
    }
  }

  static async getOnlineDealers(): Promise<Dealer[]> {
    if (!isSupabaseConfigured()) {
      return []
    }

    try {
      // Consider users online if they were active in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from("dealers")
        .select("*")
        .eq("status", "active")
        .gte("last_login", fiveMinutesAgo)
        .order("last_login", { ascending: false })

      if (error) {
        console.warn("Failed to fetch online dealers:", error.message)
        return []
      }

      return data || []
    } catch (error: any) {
      console.warn("Failed to fetch online dealers:", error.message)
      return []
    }
  }

  static isOnline(dealer: Dealer): boolean {
    if (!dealer.last_login) return false
    const lastLoginTime = new Date(dealer.last_login).getTime()
    const now = Date.now()
    return now - lastLoginTime < 5 * 60 * 1000 // 5 minutes
  }

  static async updateProfilePicture(id: string, profilePictureUrl: string): Promise<Dealer> {
    if (!isSupabaseConfigured()) {
      throw new Error("Database not configured")
    }

    try {
      const { data, error } = await supabase
        .from("dealers")
        .update({ profile_picture: profilePictureUrl })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error("Failed to update profile picture:", error.message)
      throw error
    }
  }

  static async create(dealer: Omit<Dealer, "id" | "created_at">): Promise<Dealer> {
    if (!isSupabaseConfigured()) {
      throw new Error("Database not configured")
    }

    try {
      const { data, error } = await supabase.from("dealers").insert(dealer).select().single()

      if (error) {
        if (isDatabaseNotSetup(error)) {
          throw new Error("Database tables not setup. Please run the database setup script.")
        }
        throw error
      }

      return data
    } catch (error: any) {
      console.error("Failed to create dealer:", error.message)
      throw error
    }
  }

  static async update(id: string, updates: Partial<Dealer>): Promise<Dealer> {
    if (!isSupabaseConfigured()) {
      throw new Error("Database not configured")
    }

    try {
      const { data, error } = await supabase.from("dealers").update(updates).eq("id", id).select().single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error("Failed to update dealer:", error.message)
      throw error
    }
  }

  static async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error("Database not configured")
    }

    try {
      const { error } = await supabase.from("dealers").delete().eq("id", id)

      if (error) throw error
    } catch (error: any) {
      console.error("Failed to delete dealer:", error.message)
      throw error
    }
  }
}
