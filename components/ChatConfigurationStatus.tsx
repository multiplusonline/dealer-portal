"use client"

import { isSupabaseConfigured } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Database, Wifi, WifiOff } from "lucide-react"

interface ChatConfigurationStatusProps {
  isRealtime?: boolean
}

export function ChatConfigurationStatus({ isRealtime }: ChatConfigurationStatusProps) {
  if (!isSupabaseConfigured()) {
    return (
      <Alert className="mb-6 border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>Demo Mode:</strong> Chat werkt met mock data. Berichten worden lokaal opgeslagen.
          <br />
          <span className="text-sm">
            Configureer Supabase om berichten op te slaan en real-time functionaliteit te gebruiken.
          </span>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <Database className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800 flex items-center justify-between">
        <div>
          <strong>Database Status:</strong> Supabase is geconfigureerd.
          <br />
          <span className="text-sm">
            {isRealtime ? (
              <span className="flex items-center gap-1">
                <Wifi className="h-3 w-3 text-green-600" />
                Real-time berichten actief
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <WifiOff className="h-3 w-3 text-gray-600" />
                Polling mode - berichten worden elke 3 seconden ververst
              </span>
            )}
          </span>
        </div>
      </AlertDescription>
    </Alert>
  )
}
