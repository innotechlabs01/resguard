'use client'

import {
  Building2,
  Clock,
  Car,
  Bell,
  Users,
  CreditCard,
  Shield,
  Save,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import type { BuildingStats } from '@/lib/types'

interface AdminSettingsPanelProps {
  building: BuildingStats
}

export function AdminSettingsPanel({ building }: AdminSettingsPanelProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Building Info */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Building2 className="h-5 w-5" />
            Informacion del Edificio
          </CardTitle>
          <CardDescription>Datos generales de la propiedad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="buildingName">Nombre del Edificio</Label>
              <Input
                id="buildingName"
                defaultValue={building.name}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Direccion</Label>
              <Input
                id="address"
                defaultValue={building.address}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalUnits">Total de Unidades</Label>
              <Input
                id="totalUnits"
                type="number"
                defaultValue={building.totalUnits}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visitorParking">Parqueaderos de Visitantes</Label>
              <Input
                id="visitorParking"
                type="number"
                defaultValue={building.visitorParkingSpots}
                className="bg-input border-border"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parking Rules */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Car className="h-5 w-5" />
            Reglas de Parqueadero
          </CardTitle>
          <CardDescription>Configuracion de tiempos y tarifas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxFreeTime">Tiempo Gratuito (minutos)</Label>
              <Input
                id="maxFreeTime"
                type="number"
                defaultValue={120}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="overtimeFee">Tarifa Tiempo Extra (COP/30min)</Label>
              <Input
                id="overtimeFee"
                type="number"
                defaultValue={5000}
                className="bg-input border-border"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cobro Automatico</Label>
              <p className="text-sm text-muted-foreground">
                Cobrar automaticamente el tiempo extra al residente
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificar Overtime</Label>
              <p className="text-sm text-muted-foreground">
                Enviar notificacion cuando un vehiculo exceda el tiempo
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>Configurar alertas y comunicaciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas de Visitantes</Label>
              <p className="text-sm text-muted-foreground">
                Notificar al residente cuando llega un visitante
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Recordatorios de Pago</Label>
              <p className="text-sm text-muted-foreground">
                Enviar recordatorios automaticos de cuotas pendientes
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas de Emergencia</Label>
              <p className="text-sm text-muted-foreground">
                Notificar a todos los residentes en caso de emergencia
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
          <CardDescription>Configuracion de acceso y permisos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Autorizacion Previa</Label>
              <p className="text-sm text-muted-foreground">
                Requerir autorizacion del residente para cada visitante
              </p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Registro Fotografico</Label>
              <p className="text-sm text-muted-foreground">
                Tomar foto de documento y vehiculo de visitantes
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="quietHoursStart">Horario de Silencio</Label>
            <div className="flex items-center gap-2">
              <Input
                id="quietHoursStart"
                type="time"
                defaultValue="22:00"
                className="w-32 bg-input border-border"
              />
              <span className="text-muted-foreground">a</span>
              <Input
                type="time"
                defaultValue="07:00"
                className="w-32 bg-input border-border"
              />
            </div>
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
