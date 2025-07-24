import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "placeholder-key"
  )
}

// Check if a database error indicates missing tables
export const isDatabaseNotSetup = (error: any): boolean => {
  if (!error) return false

  const errorMessage = error.message || error.toString()
  return (
    (errorMessage.includes("relation") && errorMessage.includes("does not exist")) ||
    (errorMessage.includes("table") && errorMessage.includes("does not exist")) ||
    errorMessage.includes("permission denied") ||
    errorMessage.includes("JWT") ||
    errorMessage.includes("Invalid API key")
  )
}
