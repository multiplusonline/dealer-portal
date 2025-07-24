"use client"

import { isSupabaseConfigured } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Database } from "lucide-react"

export function ConfigurationStatus() {
  if (isSupabaseConfigured()) {
    return (
      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <Database className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Database Status:</strong> Supabase is geconfigureerd maar tabellen bestaan mogelijk nog niet.
          <br />
          <span className="text-sm">
            Als je database errors ziet, voer dan het SQL schema uit in je Supabase project.
          </span>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="mb-6 border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <strong>Demo Mode:</strong> Supabase is niet geconfigureerd. De applicatie gebruikt mock data voor demonstratie
        doeleinden.
        <br />
        <span className="text-sm">
          Configureer je Supabase environment variables om de volledige functionaliteit te gebruiken.
        </span>
      </AlertDescription>
    </Alert>
  )
}
