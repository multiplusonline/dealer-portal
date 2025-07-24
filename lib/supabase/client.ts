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
  const errorCode = error.code || error.error_code

  return (
    // Table/relation doesn't exist
    (errorMessage.includes("relation") && errorMessage.includes("does not exist")) ||
    (errorMessage.includes("table") && errorMessage.includes("does not exist")) ||
    errorCode === "42P01" || // undefined_table
    // Permission issues
    errorMessage.includes("permission denied") ||
    errorCode === "42501" || // insufficient_privilege
    // Authentication issues
    errorMessage.includes("JWT") ||
    errorMessage.includes("Invalid API key") ||
    errorCode === "PGRST301" || // jwt_malformed
    // RLS issues
    errorMessage.includes("row-level security") ||
    errorMessage.includes("policy") ||
    // Connection issues
    errorMessage.includes("connection") ||
    errorMessage.includes("timeout")
  )
}
