"use client"

import { UserManagement } from "@/components/UserManagement"
import { DownloadTable } from "@/components/DownloadTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Files, Activity } from "lucide-react"

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Gebruikers Beheer
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <Files className="h-4 w-4" />
            Bestanden Beheren
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Logs & Activiteit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="files">
          <DownloadTable showAll={true} />
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>System Logs & Activiteit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Hier komen de system logs, chat activiteit, login logs, en andere monitoring informatie.
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Beschikbare logs:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Login/logout activiteit</li>
                  <li>Chat berichten en gesprekken</li>
                  <li>Bestand uploads en downloads</li>
                  <li>Gebruiker registraties en wijzigingen</li>
                  <li>System errors en warnings</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
