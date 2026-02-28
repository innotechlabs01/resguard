'use client'

import {
  Settings,
  CreditCard,
  Bell,
  Shield,
  Globe,
  Save,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

export function SystemSettingsPanel() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* General Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Globe className="h-5 w-5" />
            Configuracion General
          </CardTitle>
          <CardDescription>Ajustes globales del sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="systemName">Nombre del Sistema</Label>
              <Input
                id="systemName"
                defaultValue="ResGuard"
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Email de Soporte</Label>
              <Input
                id="supportEmail"
                type="email"
                defaultValue="soporte@resguard.com"
                className="bg-input border-border"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Zona Horaria</Label>
            <Input
              id="timezone"
              defaultValue="America/Bogota (UTC-5)"
              className="bg-input border-border"
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Stripe Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CreditCard className="h-5 w-5" />
            Configuracion de Pagos (Stripe)
          </CardTitle>
          <CardDescription>Gestion de Stripe Connect y tarifas de plataforma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium text-foreground">Stripe Connect</p>
              <p className="text-sm text-muted-foreground">Estado de la integracion</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-sm text-success">Conectado</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="platformFee">Comision de Plataforma (%)</Label>
              <Input
                id="platformFee"
                type="number"
                defaultValue="5"
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda Principal</Label>
              <Input
                id="currency"
                defaultValue="COP"
                className="bg-input border-border"
                disabled
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cobros Automaticos</Label>
              <p className="text-sm text-muted-foreground">
                Procesar pagos de suscripcion automaticamente
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Button variant="outline" size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir Stripe Dashboard
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Bell className="h-5 w-5" />
            Notificaciones del Sistema
          </CardTitle>
          <CardDescription>Configurar alertas y comunicaciones globales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas de Pagos Fallidos</Label>
              <p className="text-sm text-muted-foreground">
                Notificar cuando un edificio tenga pagos fallidos
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Reportes Semanales</Label>
              <p className="text-sm text-muted-foreground">
                Enviar resumen semanal de metricas del sistema
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas de Seguridad</Label>
              <p className="text-sm text-muted-foreground">
                Notificar actividades sospechosas o intentos de acceso
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Nuevos Edificios</Label>
              <p className="text-sm text-muted-foreground">
                Notificar cuando se registre un nuevo edificio
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5" />
            Seguridad
          </CardTitle>
          <CardDescription>Configuracion de acceso y permisos del sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Autenticacion de Dos Factores</Label>
              <p className="text-sm text-muted-foreground">
                Requerir 2FA para todos los super admins
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Logs de Auditoria</Label>
              <p className="text-sm text-muted-foreground">
                Registrar todas las acciones administrativas
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Tiempo de Sesion (minutos)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              defaultValue="60"
              className="w-32 bg-input border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg">
          <Save className="mr-2 h-4 w-4" />
          Guardar Cambios
        </Button>
      </div>
    </div>
  )
}
