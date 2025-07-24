"use client"

import { isSupabaseConfigured } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle } from "lucide-react"

export function ConfigurationStatus() {
  if (!isSupabaseConfigured()) {
    return (
      <Alert className="mb-6 border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>Demo Mode:</strong> Supabase is niet geconfigureerd. De applicatie gebruikt mock data voor
          demonstratie doeleinden.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="mb-6 border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        <strong>Database Status:</strong> Supabase is succesvol geconfigureerd en verbonden.
      </AlertDescription>
    </Alert>
  )
}
