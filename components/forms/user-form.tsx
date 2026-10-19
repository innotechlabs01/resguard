'use client'

import { useState } from 'react'
import { UserPlus, Loader2, Copy, Check, ShieldAlert } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUserApi } from '@/hooks/useApiMutations'

interface UserFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  buildings?: { id: string; name: string }[]
  onSuccess?: () => void
}

const roles = [
  { value: 'super_admin', label: 'Super Administrador' },
  { value: 'admin', label: 'Administrador' },
  { value: 'vigilante', label: 'Vigilante / Portero' },
  { value: 'usuario', label: 'Residente' },
]

export function UserForm({ open, onOpenChange, buildings = [], onSuccess }: UserFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const { createUser } = useUserApi()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'usuario' as string,
    building_id: '' as string,
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCreated(null)
      setCopied(false)
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  const handleCopy = async () => {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable (permissions); user can still copy manually
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await createUser({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        building_id: formData.role !== 'super_admin' ? formData.building_id : undefined,
      })

      if (result.success) {
        setFormData({
          name: '',
          email: '',
          role: 'usuario',
          building_id: '',
        })
        onSuccess?.()
        if (result.tempPassword) {
          setCreated({ email: result.email ?? formData.email, password: result.tempPassword })
        } else {
          onOpenChange(false)
        }
      } else {
        setError(result.error || 'Error al crear usuario')
      }
    } catch (err) {
      setError('Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Usuario Creado
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Credenciales generadas para{' '}
                <span className="font-medium text-foreground">{created.email}</span>. Compártelas
                por un canal seguro: la contraseña solo se muestra una vez.
              </p>

              <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/50 p-3">
                <code className="font-mono text-lg font-semibold tracking-widest select-all">
                  {created.password}
                </code>
                <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copiada' : 'Copiar'}
                </Button>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Recomienda al usuario cambiar su contraseña tras el primer inicio de sesión.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="button" onClick={() => handleOpenChange(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Nuevo Usuario
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  placeholder="Ej: Juan Rodriguez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electronico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.role !== 'super_admin' && (
                <div className="space-y-2">
                  <Label htmlFor="building">Edificio</Label>
                  <Select
                    value={formData.building_id}
                    onValueChange={(value) => setFormData({ ...formData, building_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar edificio" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Usuario
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
