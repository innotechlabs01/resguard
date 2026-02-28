'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  FileText,
  Mic,
  MicOff,
  Send,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  AlertTriangle,
  ShieldAlert,
  Car,
  Users,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface ShiftReport {
  id: string
  date: string
  shiftStart: string
  shiftEnd: string
  guard: string
  incidents: number
  status: 'pendiente' | 'enviado'
  text?: string
  incidentDetails?: Incident[]
}

interface Incident {
  id: string
  type: 'parqueo' | 'seguridad' | 'visitante' | 'infraestructura' | 'otro'
  description: string
  unit?: string
  severity: 'leve' | 'moderado' | 'grave'
}

const incidentTypeLabels: Record<Incident['type'], string> = {
  parqueo: 'Parqueo',
  seguridad: 'Seguridad',
  visitante: 'Visitante',
  infraestructura: 'Infraestructura',
  otro: 'Otro',
}

const severityConfig: Record<Incident['severity'], { label: string; className: string }> = {
  leve: { label: 'Leve', className: 'bg-success/10 text-success border-success/20' },
  moderado: { label: 'Moderado', className: 'bg-warning/10 text-warning border-warning/20' },
  grave: { label: 'Grave', className: 'bg-destructive/10 text-destructive border-destructive/20' },
}

const mockReports: ShiftReport[] = [
  {
    id: '1',
    date: '2026-02-28',
    shiftStart: '06:00',
    shiftEnd: '14:00',
    guard: 'Carlos Rodriguez',
    incidents: 2,
    status: 'enviado',
    text: 'Turno sin novedades mayores. Se registraron 2 incidentes menores: vehiculo en tiempo extra cupo V-04 y visitante sin documentos. Ambos resueltos satisfactoriamente.',
    incidentDetails: [
      { id: 'i1', type: 'parqueo', description: 'Vehiculo XYZ-789 supero tiempo en cupo V-04', unit: '502', severity: 'leve' },
      { id: 'i2', type: 'visitante', description: 'Visitante sin cedula intento ingresar a apto 205', unit: '205', severity: 'moderado' },
    ],
  },
  {
    id: '2',
    date: '2026-02-28',
    shiftStart: '14:00',
    shiftEnd: '22:00',
    guard: 'Juan Rodriguez',
    incidents: 0,
    status: 'pendiente',
  },
  {
    id: '3',
    date: '2026-02-27',
    shiftStart: '22:00',
    shiftEnd: '06:00',
    guard: 'Ana Martinez',
    incidents: 1,
    status: 'enviado',
    text: 'Turno nocturno. Un residente del apto 605 llego despues de la 1am con ruido excesivo. Se le hizo llamado de atencion. Sin mas novedades.',
    incidentDetails: [
      { id: 'i3', type: 'seguridad', description: 'Residente con ruido excesivo a la 1:15am', unit: '605', severity: 'leve' },
    ],
  },
  {
    id: '4',
    date: '2026-02-27',
    shiftStart: '14:00',
    shiftEnd: '22:00',
    guard: 'Juan Rodriguez',
    incidents: 3,
    status: 'enviado',
    text: 'Turno con alta actividad. 3 incidentes registrados. Se contacto a administracion por daño en la barrera de parqueo.',
    incidentDetails: [
      { id: 'i4', type: 'infraestructura', description: 'Barrera de parqueo daño por vehiculo al salir', severity: 'grave' },
      { id: 'i5', type: 'parqueo', description: 'Vehiculo sin tarjeta intento acceder', severity: 'leve' },
      { id: 'i6', type: 'visitante', description: 'Visitante permanecion mas de 4 horas', unit: '301', severity: 'leve' },
    ],
  },
  {
    id: '5',
    date: '2026-02-27',
    shiftStart: '06:00',
    shiftEnd: '14:00',
    guard: 'Carlos Rodriguez',
    incidents: 0,
    status: 'enviado',
    text: 'Turno sin novedades. Mantenimiento de ascensor realizado por tecnico externo (8am-11am). Todo en orden.',
  },
]

const emptyIncident = (): Incident => ({
  id: Math.random().toString(36).slice(2),
  type: 'parqueo',
  description: '',
  unit: '',
  severity: 'leve',
})

export function ReportsPanel() {
  const { user } = useAuth()
  const [reports, setReports] = useState<ShiftReport[]>(mockReports)
  const [reportText, setReportText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [selectedReport, setSelectedReport] = useState<ShiftReport | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const today = new Date().toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Determine current shift based on time
  const hour = new Date().getHours()
  const currentShift =
    hour >= 6 && hour < 14 ? '06:00 - 14:00' : hour >= 14 && hour < 22 ? '14:00 - 22:00' : '22:00 - 06:00'

  const addIncident = () => setIncidents((prev) => [...prev, emptyIncident()])
  const removeIncident = (id: string) => setIncidents((prev) => prev.filter((i) => i.id !== id))
  const updateIncident = (id: string, field: keyof Incident, value: string) => {
    setIncidents((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
  }

  const handleSubmit = () => {
    const newReport: ShiftReport = {
      id: Math.random().toString(36).slice(2),
      date: new Date().toISOString().split('T')[0],
      shiftStart: currentShift.split(' - ')[0],
      shiftEnd: currentShift.split(' - ')[1],
      guard: user?.name ?? 'Vigilante',
      incidents: incidents.length,
      status: 'enviado',
      text: reportText,
      incidentDetails: incidents,
    }
    setReports((prev) => [newReport, ...prev])
    setReportText('')
    setIncidents([])
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* New Report Form */}
      <div className="space-y-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              Reporte de Turno
            </CardTitle>
            <CardDescription>
              Documenta novedades, incidentes y observaciones de tu turno actual.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Shift info bar */}
            <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Turno actual</p>
                  <p className="text-sm font-semibold text-foreground">{currentShift}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="text-sm font-semibold text-foreground">{today}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vigilante</p>
                <p className="text-sm font-semibold text-foreground">{user?.name ?? 'Vigilante'}</p>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="report">Novedades y observaciones del turno</Label>
              <Textarea
                id="report"
                placeholder="Describe las novedades del turno: visitas, incidentes, condiciones del edificio, entregas recibidas, etc..."
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                className="min-h-32 bg-secondary border-border text-foreground resize-none"
              />
            </div>

            {/* Voice button */}
            <div className="flex items-center gap-3">
              <Button
                variant={isRecording ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setIsRecording(!isRecording)}
                className="gap-2"
              >
                {isRecording ? (
                  <><MicOff className="h-4 w-4" />Detener grabacion</>
                ) : (
                  <><Mic className="h-4 w-4" />Grabar nota de voz</>
                )}
              </Button>
              {isRecording && (
                <span className="flex items-center gap-1.5 text-sm text-destructive animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  Grabando...
                </span>
              )}
            </div>

            {/* Incidents section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Incidentes registrados ({incidents.length})</Label>
                <Button variant="outline" size="sm" onClick={addIncident} className="gap-1.5 h-7 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Agregar incidente
                </Button>
              </div>

              {incidents.length === 0 && (
                <p className="text-xs text-muted-foreground italic px-1">
                  Sin incidentes registrados. Agrega uno si ocurrio alguna novedad relevante.
                </p>
              )}

              {incidents.map((inc) => (
                <div key={inc.id} className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={inc.type} onValueChange={(v) => updateIncident(inc.id, 'type', v)}>
                      <SelectTrigger className="h-8 text-xs bg-input border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parqueo">Parqueo</SelectItem>
                        <SelectItem value="seguridad">Seguridad</SelectItem>
                        <SelectItem value="visitante">Visitante</SelectItem>
                        <SelectItem value="infraestructura">Infraestructura</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={inc.severity} onValueChange={(v) => updateIncident(inc.id, 'severity', v)}>
                      <SelectTrigger className="h-8 text-xs bg-input border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leve">Leve</SelectItem>
                        <SelectItem value="moderado">Moderado</SelectItem>
                        <SelectItem value="grave">Grave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Descripcion del incidente..."
                    value={inc.description}
                    onChange={(e) => updateIncident(inc.id, 'description', e.target.value)}
                    className="h-8 text-xs bg-input border-border text-foreground"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Apto relacionado (opcional)"
                      value={inc.unit ?? ''}
                      onChange={(e) => updateIncident(inc.id, 'unit', e.target.value)}
                      className="h-7 text-xs bg-input border-border text-foreground flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => removeIncident(inc.id)}
                    >
                      &times;
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {submitted && (
              <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 px-3 py-2 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                Reporte enviado exitosamente
              </div>
            )}

            <Button
              onClick={handleSubmit}
              className="w-full gap-2"
              disabled={!reportText.trim()}
            >
              <Send className="h-4 w-4" />
              Enviar reporte de turno
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Reportes recientes
        </h3>
        {reports.map((report) => (
          <Card
            key={report.id}
            className={`border-border bg-card cursor-pointer hover:bg-muted/20 transition-colors ${
              report.status === 'pendiente' ? 'border-warning/30' : ''
            }`}
            onClick={() => { setSelectedReport(report); setShowDetail(true) }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {report.status === 'enviado' ? (
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-warning shrink-0 animate-pulse" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{report.guard}</p>
                    <p className="text-xs text-muted-foreground">
                      {report.date} &nbsp;|&nbsp; {report.shiftStart} - {report.shiftEnd}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {report.incidents > 0 && (
                    <Badge variant="outline" className="text-xs border-warning/30 text-warning bg-warning/5">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      {report.incidents} incidente{report.incidents > 1 ? 's' : ''}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={
                      report.status === 'enviado'
                        ? 'text-success border-success/30 bg-success/5 text-xs'
                        : 'text-warning border-warning/30 bg-warning/5 text-xs'
                    }
                  >
                    {report.status === 'enviado' ? 'Enviado' : 'Pendiente'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={(e) => { e.stopPropagation(); setSelectedReport(report); setShowDetail(true) }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {report.text && (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2 pl-8">{report.text}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Detail Dialog */}
      {selectedReport && (
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Reporte de turno
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {selectedReport.guard} &mdash; {selectedReport.date} &mdash; {selectedReport.shiftStart} a {selectedReport.shiftEnd}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className={
                    selectedReport.status === 'enviado'
                      ? 'text-success border-success/30 bg-success/5'
                      : 'text-warning border-warning/30 bg-warning/5'
                  }
                >
                  {selectedReport.status === 'enviado' ? 'Enviado' : 'Pendiente'}
                </Badge>
                {selectedReport.incidents > 0 && (
                  <Badge variant="outline" className="text-warning border-warning/30 bg-warning/5">
                    {selectedReport.incidents} incidente{selectedReport.incidents > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {selectedReport.text && (
                <div className="rounded-lg bg-muted/30 border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Novedades del turno</p>
                  <p className="text-sm text-foreground leading-relaxed">{selectedReport.text}</p>
                </div>
              )}

              {selectedReport.incidentDetails && selectedReport.incidentDetails.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Incidentes</p>
                  {selectedReport.incidentDetails.map((inc) => (
                    <div key={inc.id} className="flex items-start gap-3 rounded-lg border border-border p-3 bg-muted/10">
                      <ShieldAlert className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                            {incidentTypeLabels[inc.type]}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${severityConfig[inc.severity].className}`}>
                            {severityConfig[inc.severity].label}
                          </Badge>
                          {inc.unit && (
                            <span className="text-xs text-muted-foreground">Apto {inc.unit}</span>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{inc.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setShowDetail(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
