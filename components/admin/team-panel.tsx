'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  ShieldCheck,
  UserPlus,
  Mail,
  Trash2,
  Eye,
  Users,
  Search,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface BuildingUser {
  id: string
  name: string
  email: string
  role: 'vigilante' | 'usuario' | 'admin' | 'super_admin'
  buildingId?: string
}

interface TeamPanelProps {
  buildingId: string
  buildingName?: string
}

export function TeamPanel({ buildingId, buildingName }: TeamPanelProps) {
  const [users, setUsers] = useState<BuildingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'vigilante' | 'usuario'>('all')
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'vigilante' as 'vigilante' | 'usuario',
  })

  const fetchUsers = useCallback(async () => {
    if (!buildingId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/users?buildingId=${encodeURIComponent(buildingId)}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setUsers(data.filter((u: BuildingUser) => u.role === 'vigilante' || u.role === 'usuario'))
        }
      }
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [buildingId])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !buildingId) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          role: form.role,
          building_id: buildingId,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'No se pudo enviar la invitación.')
        return
      }
      toast.success('Invitación enviada', {
        description: `${form.email.trim()} recibió su enlace de acceso como ${form.role === 'vigilante' ? 'Vigilante' : 'Residente'}.`,
      })
      setForm({ name: '', email: '', role: 'vigilante' })
      setShowInviteDialog(false)
      await fetchUsers()
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (userId: string, name: string) => {
    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'No se pudo eliminar el acceso.')
        return
      }
      toast.success(`Acceso revocado para ${name}`)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch {
      toast.error('Error de conexión al revocar acceso.')
    }
  }

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const vigilanteCount = users.filter((u) => u.role === 'vigilante').length
  const usuarioCount = users.filter((u) => u.role === 'usuario').length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vigilantes Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{vigilanteCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Con acceso a portería web/PWA</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Residentes con Cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{usuarioCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Con acceso a Web, PWA y App Móvil</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Edificio Activo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base font-semibold text-foreground truncate">{buildingName || 'Edificio actual'}</div>
            <p className="text-xs text-success mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Aislamiento multi-tenant activo
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-5 w-5 text-brand" />
              Equipo y Accesos del Edificio
            </CardTitle>
            <CardDescription>
              Crea cuentas reales con inicio de sesión para vigilantes de portería y residentes.
            </CardDescription>
          </div>
          <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invitar Vigilante / Usuario
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o correo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="vigilante">Vigilantes</SelectItem>
                <SelectItem value="usuario">Residentes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Cargando accesos…</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">No hay cuentas registradas</p>
              <p className="text-xs text-muted-foreground mt-1">
                Invita a tus vigilantes o residentes para que puedan iniciar sesión.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-foreground">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {u.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      {u.role === 'vigilante' ? (
                        <Badge className="bg-success/10 text-success border-success/20">
                          <Eye className="mr-1 h-3 w-3" /> Vigilante
                        </Badge>
                      ) : (
                        <Badge className="bg-info/10 text-info border-info/20">
                          <Users className="mr-1 h-3 w-3" /> Residente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(u.id, u.name)}
                        aria-label={`Revocar acceso de ${u.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Invitar Vigilante o Residente</DialogTitle>
            <DialogDescription>
              Se enviará un enlace seguro por correo para que el usuario configure su contraseña e ingrese.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            {error && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Rol</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((p) => ({ ...p, role: v as 'vigilante' | 'usuario' }))}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vigilante">Vigilante (Portería)</SelectItem>
                  <SelectItem value="usuario">Residente (Web / PWA / App)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-name">Nombre completo *</Label>
              <Input
                id="invite-name"
                placeholder="Ej: Carlos Méndez"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Correo electrónico *</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || !form.name.trim() || !form.email.trim()}>
                {saving ? 'Enviando…' : 'Enviar invitación'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
