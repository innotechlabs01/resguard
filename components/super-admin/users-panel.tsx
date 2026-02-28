'use client'

import { useState } from 'react'
import {
  Search,
  Plus,
  User,
  Mail,
  Building2,
  Shield,
  Eye,
  MoreHorizontal,
  Filter,
  CheckCircle,
  XCircle,
  Phone,
  CalendarDays,
  Edit,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { User as UserType } from '@/lib/types'
import { mockUsers, mockBuildingStats } from '@/lib/mock-data'

const roleConfig: Record<string, { label: string; className: string; icon: typeof Shield }> = {
  admin: { label: 'Administrador', className: 'bg-info/10 text-info border-info/20', icon: Shield },
  vigilante: { label: 'Vigilante', className: 'bg-success/10 text-success border-success/20', icon: Eye },
}

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-destructive/10 text-destructive border-destructive/20',
}

export function UsersPanel() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'vigilante'>('all')
  const [buildingFilter, setBuildingFilter] = useState('all')
  const [users, setUsers] = useState<UserType[]>(
    mockUsers.filter((u) => u.role === 'admin' || u.role === 'vigilante')
  )
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [editData, setEditData] = useState<{ name: string; email: string; buildingId: string; role: 'admin' | 'vigilante' }>({ name: '', email: '', buildingId: '', role: 'admin' })
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'admin' as 'admin' | 'vigilante',
    buildingId: '',
    documentId: '',
  })

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesBuilding = buildingFilter === 'all' || u.buildingId === buildingFilter
    return matchesSearch && matchesRole && matchesBuilding
  })

  const getBuildingName = (buildingId?: string) => {
    if (!buildingId) return 'Global'
    const building = mockBuildingStats.find((b) => b.id === buildingId)
    return building?.name || 'Desconocido'
  }

  const getBuildingStatus = (buildingId?: string) => {
    if (!buildingId) return null
    return mockBuildingStats.find((b) => b.id === buildingId)
  }

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email || !newUser.buildingId) return
    const created: UserType = {
      id: `user-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      buildingId: newUser.buildingId,
    }
    setUsers((prev) => [...prev, created])
    setNewUser({ name: '', email: '', phone: '', role: 'admin', buildingId: '', documentId: '' })
    setShowCreateDialog(false)
  }

  const handleDeactivate = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  const handleOpenEdit = (u: UserType) => {
    setSelectedUser(u)
    setEditData({ name: u.name, email: u.email, buildingId: u.buildingId || '', role: u.role as 'admin' | 'vigilante' })
    setEditMode(true)
    setShowDetailDialog(true)
  }

  const handleSaveEdit = () => {
    if (!selectedUser) return
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? { ...u, name: editData.name, email: editData.email, buildingId: editData.buildingId, role: editData.role }
          : u
      )
    )
    setShowDetailDialog(false)
    setEditMode(false)
  }

  const adminCount = users.filter((u) => u.role === 'admin').length
  const vigilanteCount = users.filter((u) => u.role === 'vigilante').length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{users.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Administradores y vigilantes</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Administradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{adminCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {mockBuildingStats.length - adminCount} edificios sin admin
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vigilantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{vigilanteCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Seguridad activa</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Edificios Cubiertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {new Set(users.map((u) => u.buildingId).filter(Boolean)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">de {mockBuildingStats.length} edificios</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-input border-border text-foreground"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
            <SelectTrigger className="w-44 bg-input border-border text-foreground">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="vigilante">Vigilante</SelectItem>
            </SelectContent>
          </Select>
          <Select value={buildingFilter} onValueChange={setBuildingFilter}>
            <SelectTrigger className="w-52 bg-input border-border text-foreground">
              <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Edificio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los edificios</SelectItem>
              {mockBuildingStats.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Users Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Usuario</TableHead>
                <TableHead className="text-muted-foreground">Contacto</TableHead>
                <TableHead className="text-muted-foreground">Rol</TableHead>
                <TableHead className="text-muted-foreground">Edificio Asignado</TableHead>
                <TableHead className="text-muted-foreground">Estado Edificio</TableHead>
                <TableHead className="text-muted-foreground w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              )}
              {filteredUsers.map((user) => {
                const roleCfg = roleConfig[user.role]
                const building = getBuildingStatus(user.buildingId)
                const RoleIcon = roleCfg?.icon || Shield
                return (
                  <TableRow key={user.id} className="border-border hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate max-w-[180px]">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {roleCfg && (
                        <Badge variant="outline" className={roleCfg.className}>
                          <RoleIcon className="mr-1 h-3 w-3" />
                          {roleCfg.label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm">{getBuildingName(user.buildingId)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {building ? (
                        <Badge
                          variant="outline"
                          className={
                            building.subscriptionStatus === 'active'
                              ? statusColors.active
                              : statusColors.inactive
                          }
                        >
                          {building.subscriptionStatus === 'active' ? (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          ) : (
                            <XCircle className="mr-1 h-3 w-3" />
                          )}
                          {building.subscriptionStatus === 'active' ? 'Al dia' : 'Mora'}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => { setSelectedUser(user); setShowDetailDialog(true) }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => handleOpenEdit(user)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar usuario
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive cursor-pointer"
                            onClick={() => handleDeactivate(user.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Desactivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edificios sin administrador */}
      {mockBuildingStats.some((b) => !users.find((u) => u.role === 'admin' && u.buildingId === b.id)) && (
        <Card className="bg-card border-border border-warning/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-warning flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Edificios sin administrador asignado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mockBuildingStats
                .filter((b) => !users.find((u) => u.role === 'admin' && u.buildingId === b.id))
                .map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2"
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{b.name}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-xs border-primary/50 text-primary hover:bg-primary/10"
                      onClick={() => {
                        setNewUser((p) => ({ ...p, buildingId: b.id, role: 'admin' }))
                        setShowCreateDialog(true)
                      }}
                    >
                      Asignar admin
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Crear nuevo usuario operativo</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Registra un administrador o vigilante y asignalo a un edificio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Tabs
              value={newUser.role}
              onValueChange={(v) => setNewUser((p) => ({ ...p, role: v as 'admin' | 'vigilante' }))}
            >
              <TabsList className="w-full bg-muted">
                <TabsTrigger value="admin" className="flex-1 data-[state=active]:bg-info/20 data-[state=active]:text-info">
                  <Shield className="mr-2 h-4 w-4" /> Administrador
                </TabsTrigger>
                <TabsTrigger value="vigilante" className="flex-1 data-[state=active]:bg-success/20 data-[state=active]:text-success">
                  <Eye className="mr-2 h-4 w-4" /> Vigilante
                </TabsTrigger>
              </TabsList>
              <TabsContent value="admin" className="mt-0">
                <p className="text-xs text-muted-foreground mt-2">
                  El administrador tendra acceso completo al dashboard del edificio asignado: residentes, pagos, comunicaciones y reportes.
                </p>
              </TabsContent>
              <TabsContent value="vigilante" className="mt-0">
                <p className="text-xs text-muted-foreground mt-2">
                  El vigilante tendra acceso al modulo de seguridad: control de acceso, visitantes, parqueaderos y alertas.
                </p>
              </TabsContent>
            </Tabs>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Nombre completo *</Label>
                <Input
                  placeholder="Ej: Maria Torres"
                  value={newUser.name}
                  onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Correo electronico *</Label>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Telefono</Label>
                <Input
                  placeholder="+57 300 000 0000"
                  value={newUser.phone}
                  onChange={(e) => setNewUser((p) => ({ ...p, phone: e.target.value }))}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Numero de documento</Label>
                <Input
                  placeholder="CC 80123456"
                  value={newUser.documentId}
                  onChange={(e) => setNewUser((p) => ({ ...p, documentId: e.target.value }))}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Edificio asignado *</Label>
                <Select
                  value={newUser.buildingId}
                  onValueChange={(v) => setNewUser((p) => ({ ...p, buildingId: v }))}
                >
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Selecciona un edificio" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockBuildingStats.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {b.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={!newUser.name || !newUser.email || !newUser.buildingId}
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail / Edit Dialog */}
      {selectedUser && (
        <Dialog open={showDetailDialog} onOpenChange={(open) => { setShowDetailDialog(open); if (!open) setEditMode(false) }}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editMode ? 'Editar usuario operativo' : 'Perfil de usuario'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editMode ? 'Modifica los datos del usuario y guarda los cambios.' : 'Informacion y edificio asignado.'}
              </DialogDescription>
            </DialogHeader>

            {editMode ? (
              <div className="space-y-3 py-2">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Nombre completo</Label>
                  <Input
                    value={editData.name}
                    onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Correo electronico</Label>
                  <Input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData((p) => ({ ...p, email: e.target.value }))}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Rol</Label>
                  <Select value={editData.role} onValueChange={(v) => setEditData((p) => ({ ...p, role: v as 'admin' | 'vigilante' }))}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="vigilante">Vigilante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Edificio asignado</Label>
                  <Select value={editData.buildingId} onValueChange={(v) => setEditData((p) => ({ ...p, buildingId: v }))}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue placeholder="Seleccionar edificio" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockBuildingStats.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <User className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-lg">{selectedUser.name}</p>
                    {roleConfig[selectedUser.role] && (
                      <Badge variant="outline" className={roleConfig[selectedUser.role].className}>
                        {roleConfig[selectedUser.role].label}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-2 rounded-lg bg-muted p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{getBuildingName(selectedUser.buildingId)}</span>
                  </div>
                  {selectedUser.buildingId && (() => {
                    const b = getBuildingStatus(selectedUser.buildingId)
                    return b ? (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {b.totalUnits} unidades &middot; {b.totalParkingSpots} parqueaderos
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Subscripcion: {b.subscriptionStatus === 'active' ? 'Activa' : 'En mora'}
                          </span>
                        </div>
                      </>
                    ) : null
                  })()}
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              {editMode ? (
                <>
                  <Button variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                  <Button onClick={handleSaveEdit} disabled={!editData.name || !editData.email}>
                    Guardar cambios
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Cerrar</Button>
                  <Button variant="secondary" onClick={() => setEditMode(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="destructive" onClick={() => { handleDeactivate(selectedUser.id); setShowDetailDialog(false) }}>
                    Desactivar
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
