'use client'

import { useState } from 'react'
import { User, Phone, Mail, Lock, Bell, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth-context'

export function UsuarioSettings() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+57 300 123 4567',
  })
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    parking: true,
    payments: true,
    announcements: true,
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Mi Cuenta</h2>
        <p className="text-muted-foreground">Administra tu perfil y preferencias</p>
      </div>

      {/* Profile Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <User className="h-5 w-5" />
            Informacion Personal
          </CardTitle>
          <CardDescription>Actualiza tus datos de contacto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Apartamento</Label>
              <Input id="unit" value="301" disabled className="bg-muted" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electronico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  className="pl-10"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
            </div>
          </div>
          <Button className="gap-2">
            <Save className="h-4 w-4" />
            Guardar Cambios
          </Button>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Lock className="h-5 w-5" />
            Seguridad
          </CardTitle>
          <CardDescription>Gestiona tu contrasena y acceso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="current-password">Contrasena Actual</Label>
              <Input id="current-password" type="password" />
            </div>
            <div />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva Contrasena</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Contrasena</Label>
              <Input id="confirm-password" type="password" />
            </div>
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Lock className="h-4 w-4" />
            Cambiar Contrasena
          </Button>
        </CardContent>
      </Card>

      {/* Notifications Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Bell className="h-5 w-5" />
            Preferencias de Notificaciones
          </CardTitle>
          <CardDescription>Configura como quieres recibir alertas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Notificaciones por Email</p>
                <p className="text-sm text-muted-foreground">Recibe alertas en tu correo</p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Notificaciones Push</p>
                <p className="text-sm text-muted-foreground">Alertas en tu dispositivo</p>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Tipos de Notificaciones</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Parqueadero y Visitantes</p>
                <p className="text-sm text-muted-foreground">Alertas de ingresos y solicitudes</p>
              </div>
              <Switch
                checked={notifications.parking}
                onCheckedChange={(checked) => setNotifications({ ...notifications, parking: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Pagos y Facturacion</p>
                <p className="text-sm text-muted-foreground">Recordatorios de cuotas</p>
              </div>
              <Switch
                checked={notifications.payments}
                onCheckedChange={(checked) => setNotifications({ ...notifications, payments: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Anuncios del Edificio</p>
                <p className="text-sm text-muted-foreground">Comunicados y eventos</p>
              </div>
              <Switch
                checked={notifications.announcements}
                onCheckedChange={(checked) => setNotifications({ ...notifications, announcements: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
