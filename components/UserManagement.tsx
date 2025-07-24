"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { UserManagementModel, type CreateDealerData, type UpdateDealerData } from "@/models/userManagementModel"
import { Avatar } from "./Avatar"
import type { Dealer, DealerStats } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Users, UserPlus, Activity, RefreshCw } from "lucide-react"

export function UserManagement() {
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [stats, setStats] = useState<DealerStats>({ total: 0, active: 0, inactive: 0, newThisWeek: 0, onlineNow: 0 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [includeInactive, setIncludeInactive] = useState(false)

  useEffect(() => {
    loadData()
  }, [includeInactive])

  const loadData = async () => {
    setLoading(true)
    try {
      const [dealersData, statsData] = await Promise.all([
        UserManagementModel.getAllDealers(includeInactive),
        UserManagementModel.getDealerStats(),
      ])
      setDealers(dealersData)
      setStats(statsData)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadData()
      return
    }

    try {
      const results = await UserManagementModel.searchDealers(searchQuery)
      setDealers(results)
    } catch (error) {
      console.error("Search failed:", error)
    }
  }

  const handleToggleStatus = async (dealer: Dealer) => {
    try {
      await UserManagementModel.toggleDealerStatus(dealer.id)
      loadData()
    } catch (error) {
      console.error("Failed to toggle status:", error)
    }
  }

  const handleDeleteDealer = async (dealer: Dealer) => {
    if (!confirm(`Are you sure you want to delete ${dealer.name}? This action cannot be undone.`)) {
      return
    }

    try {
      await UserManagementModel.deleteDealer(dealer.id)
      loadData()
    } catch (error) {
      console.error("Failed to delete dealer:", error)
    }
  }

  const filteredDealers = dealers.filter(
    (dealer) =>
      dealer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dealer.company && dealer.company.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isOnline = (dealer: Dealer) => {
    if (!dealer.last_login) return false
    const lastLoginTime = new Date(dealer.last_login).getTime()
    const now = Date.now()
    return now - lastLoginTime < 5 * 60 * 1000 // 5 minutes
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-600">Totaal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-gray-600">Actief</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserX className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.inactive}</p>
                <p className="text-sm text-gray-600">Inactief</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.newThisWeek}</p>
                <p className="text-sm text-gray-600">Deze week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.onlineNow}</p>
                <p className="text-sm text-gray-600">Online nu</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Dealer Beheer</span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setIncludeInactive(!includeInactive)}>
                {includeInactive ? "Alleen actieve" : "Inclusief inactieve"}
              </Button>
              <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <CreateDealerDialog onSuccess={loadData} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex-1 flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Zoek dealers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} variant="outline">
                Zoeken
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Dealers laden...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dealer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Bedrijf</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Laatste activiteit</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDealers.map((dealer) => (
                  <TableRow key={dealer.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar src={dealer.profile_picture} alt={dealer.name} size="md" />
                          {isOnline(dealer) && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{dealer.name}</p>
                          <p className="text-sm text-gray-500">{dealer.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{dealer.email}</p>
                        {dealer.phone && <p className="text-sm text-gray-500">{dealer.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{dealer.company || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={dealer.role === "admin" ? "default" : "secondary"}>
                        {dealer.role || "dealer"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant={dealer.is_active ? "default" : "secondary"}>
                          {dealer.is_active ? "Actief" : "Inactief"}
                        </Badge>
                        {isOnline(dealer) && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Online
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{dealer.last_login ? formatDate(dealer.last_login) : "Nooit"}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDealer(dealer)
                            setShowEditDialog(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(dealer)}
                          className={dealer.is_active ? "text-red-600" : "text-green-600"}
                        >
                          {dealer.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDealer(dealer)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {selectedDealer && (
        <EditDealerDialog
          dealer={selectedDealer}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={() => {
            loadData()
            setShowEditDialog(false)
            setSelectedDealer(null)
          }}
        />
      )}
    </div>
  )
}

function CreateDealerDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateDealerData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "dealer",
    profile_picture: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Client-side validation
      if (!formData.name.trim()) {
        throw new Error("Name is required")
      }
      if (!formData.email.trim()) {
        throw new Error("Email is required")
      }

      console.log("Creating dealer with data:", formData)

      await UserManagementModel.createDealer(formData)

      // Reset form and close dialog
      setOpen(false)
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        role: "dealer",
        profile_picture: "",
        notes: "",
      })
      setError(null)
      onSuccess()
    } catch (error: any) {
      console.error("Create dealer error:", error)
      setError(error.message || "Failed to create dealer")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Dealer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nieuwe Dealer Toevoegen</DialogTitle>
        </DialogHeader>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Naam *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefoon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="company">Bedrijf</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="role">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={(value: any) => setFormData({ ...formData, role: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dealer">Dealer</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Notities</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              disabled={loading}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Annuleren
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Bezig..." : "Toevoegen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditDealerDialog({
  dealer,
  open,
  onOpenChange,
  onSuccess,
}: {
  dealer: Dealer
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<UpdateDealerData>({
    name: dealer.name,
    email: dealer.email,
    phone: dealer.phone || "",
    company: dealer.company || "",
    role: dealer.role || "dealer",
    notes: dealer.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Client-side validation
      if (!formData.name?.trim()) {
        throw new Error("Name is required")
      }
      if (!formData.email?.trim()) {
        throw new Error("Email is required")
      }

      await UserManagementModel.updateDealer(dealer.id, formData)
      setError(null)
      onSuccess()
    } catch (error: any) {
      console.error("Update dealer error:", error)
      setError(error.message || "Failed to update dealer")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Dealer Bewerken</DialogTitle>
        </DialogHeader>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Naam *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="edit-email">Email *</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="edit-phone">Telefoon</Label>
            <Input
              id="edit-phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="edit-company">Bedrijf</Label>
            <Input
              id="edit-company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="edit-role">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={(value: any) => setFormData({ ...formData, role: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dealer">Dealer</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-notes">Notities</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              disabled={loading}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuleren
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Bezig..." : "Opslaan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
