'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { 
  CalendarDays, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  Vote, 
  CheckCircle2, 
  XCircle, 
  Clock3,
  Send,
  BarChart3,
  FileText
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface Assembly {
  id: string
  building_id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  created_at: string
}

interface VoteOption {
  id: string
  label: string
  votes: number
}

interface AgendaItem {
  id: string
  assembly_id: string
  title: string
  description: string | null
  vote_type: 'yes_no' | 'multiple_choice'
  options: { id: string; label: string }[]
  created_at: string
  voteCounts: Record<string, number>
  totalVotes: number
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-CO', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

const statusConfig = {
  scheduled: { icon: Clock3, label: 'Programada', className: 'bg-warning/10 text-warning' },
  active: { icon: CheckCircle2, label: 'En Curso', className: 'bg-success/10 text-success' },
  completed: { icon: CheckCircle2, label: 'Completada', className: 'bg-muted text-muted-foreground' },
  cancelled: { icon: XCircle, label: 'Cancelada', className: 'bg-destructive/10 text-destructive' },
}

export function AssemblyPanel() {
  const { user } = useAuth()
  const [assemblies, setAssemblies] = useState<Assembly[]>([])
  const [agendaItems, setAgendaItems] = useState<Record<string, AgendaItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [voteDialogOpen, setVoteDialogOpen] = useState(false)
  const [selectedAssembly, setSelectedAssembly] = useState<Assembly | null>(null)
  const [newAssembly, setNewAssembly] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
  })
  const [newVote, setNewVote] = useState<{
    title: string
    description: string
    voteType: 'yes_no' | 'multiple_choice'
    options: { label: string }[]
  }>({
    title: '',
    description: '',
    voteType: 'yes_no',
    options: [{ label: '' }, { label: '' }],
  })

  useEffect(() => {
    if (user?.buildingId) {
      fetchAssemblies()
    }
  }, [user?.buildingId])

  const fetchAssemblies = async () => {
    if (!user?.buildingId) return
    try {
      const res = await fetch(`/api/assemblies?buildingId=${user.buildingId}`)
      const data = await res.json()
      setAssemblies(data.assemblies || [])
    } catch (error) {
      console.error('Error fetching assemblies:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAgendaItems = async (assemblyId: string) => {
    try {
      const res = await fetch(`/api/agenda-items?assemblyId=${assemblyId}`)
      const data = await res.json()
      setAgendaItems(prev => ({ ...prev, [assemblyId]: data.agendaItems || [] }))
    } catch (error) {
      console.error('Error fetching agenda items:', error)
    }
  }

  const handleCreateAssembly = async () => {
    if (!user?.buildingId || !newAssembly.title || !newAssembly.date || !newAssembly.time) return
    
    try {
      const res = await fetch('/api/assemblies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: user.buildingId,
          ...newAssembly,
        }),
      })
      
      if (res.ok) {
        setCreateDialogOpen(false)
        setNewAssembly({ title: '', description: '', date: '', time: '', location: '' })
        fetchAssemblies()
      }
    } catch (error) {
      console.error('Error creating assembly:', error)
    }
  }

  const handleActivateAssembly = async (assemblyId: string) => {
    try {
      await fetch('/api/assembly-votes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assemblyId, status: 'active' }),
      })
      fetchAssemblies()
    } catch (error) {
      console.error('Error activating assembly:', error)
    }
  }

  const handleCreateVote = async () => {
    if (!selectedAssembly || !newVote.title || newVote.options.length < 2) return
    
    const validOptions = newVote.options.filter(o => o.label.trim() !== '')
    if (validOptions.length < 2) return

    try {
      const res = await fetch('/api/agenda-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assemblyId: selectedAssembly.id,
          title: newVote.title,
          description: newVote.description,
          voteType: newVote.voteType,
          options: validOptions.map((o, i) => ({ id: String(i + 1), label: o.label })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error creating the agenda item')
      }

      setVoteDialogOpen(false)
      setNewVote({ title: '', description: '', voteType: 'yes_no', options: [{ label: '' }, { label: '' }] })
      fetchAgendaItems(selectedAssembly.id)
    } catch (error) {
      console.error('Error creating vote:', error)
    }
  }

  const upcomingAssemblies = assemblies.filter(a => a.status === 'scheduled')
  const activeAssemblies = assemblies.filter(a => a.status === 'active')
  const completedAssemblies = assemblies.filter(a => a.status === 'completed')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Asambleas y Votaciones</h2>
          <p className="text-sm text-muted-foreground">Gestion de asambleas y votaciones del edificio</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Programar Asamblea
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Programadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">{upcomingAssemblies.length}</div>
            <p className="text-xs text-muted-foreground">Próximas asambleas</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-success">{activeAssemblies.length}</div>
            <p className="text-xs text-muted-foreground">Votaciones activas</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-muted-foreground">{completedAssemblies.length}</div>
            <p className="text-xs text-muted-foreground">Historial total</p>
          </CardContent>
        </Card>
      </div>

      {/* Assembly List */}
      <div className="grid gap-4">
        {assemblies.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">No hay asambleas programadas</p>
              <Button onClick={() => setCreateDialogOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Programar Primera Asamblea
              </Button>
            </CardContent>
          </Card>
        ) : (
          assemblies.map(assembly => {
            const status = statusConfig[assembly.status]
            const StatusIcon = status.icon
            
            return (
              <Card key={assembly.id} className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-foreground">{assembly.title}</CardTitle>
                      <CardDescription className="text-muted-foreground mt-1">{assembly.description || 'Sin descripción'}</CardDescription>
                    </div>
                    <Badge className={status.className}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{formatDate(assembly.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{formatTime(assembly.time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{assembly.location || 'Sin ubicación'}</span>
                    </div>
                  </div>

                  {assembly.status === 'scheduled' && (
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" onClick={() => handleActivateAssembly(assembly.id)}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Activar Asamblea
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedAssembly(assembly)
                        fetchAgendaItems(assembly.id)
                        setVoteDialogOpen(true)
                      }}>
                        <Vote className="mr-2 h-4 w-4" />
                        Crear Votación
                      </Button>
                    </div>
                  )}

                  {assembly.status === 'active' && (
                    <div className="mt-4">
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedAssembly(assembly)
                        fetchAgendaItems(assembly.id)
                      }}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Ver Votaciones
                      </Button>
                    </div>
                  )}

                  {agendaItems[assembly.id]?.length > 0 && assembly.status !== 'scheduled' && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm font-medium text-foreground mb-2">Votaciones ({agendaItems[assembly.id].length})</p>
                      <div className="space-y-4">
                        {agendaItems[assembly.id].map(item => {
                          const total = item.totalVotes || 0
                          return (
                            <div key={item.id} className="bg-muted/50 p-3 rounded">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <span className="text-sm font-medium text-foreground">{item.title}</span>
                                <Badge variant="outline">{item.vote_type === 'yes_no' ? 'Sí/No' : 'Opción Múltiple'}</Badge>
                              </div>
                              {item.totalVotes > 0 ? (
                                <div className="mt-3">
                                  <div className="overflow-hidden rounded border border-border">
                                    <table className="w-full text-sm">
                                      <thead className="bg-muted text-muted-foreground">
                                        <tr>
                                          <th className="text-left px-3 py-2 font-medium">Opción</th>
                                          <th className="text-right px-3 py-2 font-medium">Votos</th>
                                          <th className="text-right px-3 py-2 font-medium">%</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {item.options.map(option => {
                                          const count = item.voteCounts[option.id] ?? 0
                                          const pct = total > 0 ? Math.round((count / total) * 100) : 0
                                          return (
                                            <tr key={option.id} className="border-t border-border">
                                              <td className="px-3 py-2 text-foreground">{option.label}</td>
                                              <td className="px-3 py-2 text-right text-foreground">{count}</td>
                                              <td className="px-3 py-2 text-right text-foreground">{pct}%</td>
                                            </tr>
                                          )
                                        })}
                                        <tr className="border-t border-border bg-muted/60">
                                          <td className="px-3 py-2 font-medium text-foreground">Total</td>
                                          <td className="px-3 py-2 text-right font-medium text-foreground" colSpan={2}>{total} votos</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground mt-2">Aún no hay votos registrados</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Create Assembly Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Programar Nueva Asamblea</DialogTitle>
            <DialogDescription>
              Define la fecha, hora y ubicación de la asamblea
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={newAssembly.title}
                onChange={(e) => setNewAssembly({ ...newAssembly, title: e.target.value })}
                placeholder="Asamblea Ordinaria 2026"
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={newAssembly.description}
                onChange={(e) => setNewAssembly({ ...newAssembly, description: e.target.value })}
                placeholder="Tema principal de la asamblea..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={newAssembly.date}
                  onChange={(e) => setNewAssembly({ ...newAssembly, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="time">Hora</Label>
                <Input
                  id="time"
                  type="time"
                  value={newAssembly.time}
                  onChange={(e) => setNewAssembly({ ...newAssembly, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={newAssembly.location}
                onChange={(e) => setNewAssembly({ ...newAssembly, location: e.target.value })}
                placeholder="Salón social, Torre A"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateAssembly}>Programar Asamblea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Vote Dialog */}
      <Dialog open={voteDialogOpen} onOpenChange={setVoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Votación</DialogTitle>
            <DialogDescription>
              Define las opciones de votación para la asamblea
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="voteTitle">Título de la Votación</Label>
              <Input
                id="voteTitle"
                value={newVote.title}
                onChange={(e) => setNewVote({ ...newVote, title: e.target.value })}
                placeholder="Aprobación presupuesto 2026"
              />
            </div>
            <div>
              <Label htmlFor="voteDescription">Descripción</Label>
              <Textarea
                id="voteDescription"
                value={newVote.description}
                onChange={(e) => setNewVote({ ...newVote, description: e.target.value })}
                placeholder="Detalles de la votación..."
              />
            </div>
            <div>
              <Label>Tipo de Votación</Label>
              <select
                value={newVote.voteType}
                onChange={(e) => setNewVote({ ...newVote, voteType: e.target.value as 'yes_no' | 'multiple_choice' })}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="yes_no">Sí / No</option>
                <option value="multiple_choice">Opción Múltiple</option>
              </select>
            </div>
            <div>
              <Label>Opciones de Votación</Label>
              <div className="space-y-2 mt-2">
                {newVote.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option.label}
                      onChange={(e) => {
                        const newOptions = [...newVote.options]
                        newOptions[index].label = e.target.value
                        setNewVote({ ...newVote, options: newOptions })
                      }}
                      placeholder={`Opción ${index + 1}`}
                    />
                    {newVote.options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newOptions = newVote.options.filter((_, i) => i !== index)
                          setNewVote({ ...newVote, options: newOptions })
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewVote({ ...newVote, options: [...newVote.options, { label: '' }] })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Opción
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoteDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateVote}>Crear Votación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}