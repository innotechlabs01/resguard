'use client'

import { useState } from 'react'
import {
  Bell,
  Megaphone,
  Wrench,
  AlertTriangle,
  Calendar,
  FileText,
  CheckCheck,
  Clock,
  Users,
  BellOff,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { mockCommunications } from '@/lib/mock-data'
import type { Communication } from '@/lib/types'

const typeConfig: Record<
  Communication['type'],
  { label: string; icon: typeof Bell; className: string; bgClass: string }
> = {
  announcement: { label: 'Anuncio', icon: Megaphone, className: 'text-primary border-primary/20 bg-primary/10', bgClass: '' },
  maintenance: { label: 'Mantenimiento', icon: Wrench, className: 'text-warning border-warning/20 bg-warning/10', bgClass: 'bg-warning/5' },
  alert: { label: 'Alerta', icon: AlertTriangle, className: 'text-destructive border-destructive/20 bg-destructive/10', bgClass: 'bg-destructive/5' },
  event: { label: 'Evento', icon: Calendar, className: 'text-success border-success/20 bg-success/10', bgClass: 'bg-success/5' },
  circular: { label: 'Circular', icon: FileText, className: 'text-info border-info/20 bg-info/10', bgClass: '' },
}

const priorityBadge: Record<Communication['priority'], string> = {
  low: 'text-muted-foreground bg-muted border-border',
  normal: 'text-info bg-info/10 border-info/20',
  high: 'text-warning bg-warning/10 border-warning/20',
  urgent: 'text-destructive bg-destructive/10 border-destructive/20',
}

const priorityLabel: Record<Communication['priority'], string> = {
  low: 'Baja',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'URGENTE',
}

function formatRelativeTime(date: Date) {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  return `Hace ${Math.floor(hrs / 24)} dias`
}

const MY_USER_ID = 'usuario-1'

export function UsuarioNotifications() {
  const [communications, setCommunications] = useState<Communication[]>(mockCommunications)
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all')
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null)

  const markAsRead = (id: string) => {
    setCommunications((prev) =>
      prev.map((c) =>
        c.id === id && !c.readBy.includes(MY_USER_ID)
          ? { ...c, readBy: [...c.readBy, MY_USER_ID] }
          : c
      )
    )
  }

  const markAllRead = () => {
    setCommunications((prev) =>
      prev.map((c) =>
        !c.readBy.includes(MY_USER_ID) ? { ...c, readBy: [...c.readBy, MY_USER_ID] } : c
      )
    )
  }

  const isRead = (comm: Communication) => comm.readBy.includes(MY_USER_ID)

  const filtered = communications.filter((c) => {
    if (filter === 'unread') return !isRead(c)
    if (filter === 'urgent') return c.priority === 'urgent' || c.priority === 'high'
    return true
  })

  const unreadCount = communications.filter((c) => !isRead(c)).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Notificaciones del Edificio</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full px-2">
              {unreadCount} nuevas
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todo como leido
          </Button>
        )}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="bg-muted">
          <TabsTrigger value="all">Todas ({communications.length})</TabsTrigger>
          <TabsTrigger value="unread">
            Sin leer
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-4 min-w-[16px] px-1 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="urgent">Importantes</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BellOff className="h-10 w-10 mb-3 opacity-30" />
            <p>No hay notificaciones</p>
          </div>
        )}
        {filtered.map((comm) => {
          const typeCfg = typeConfig[comm.type]
          const TypeIcon = typeCfg.icon
          const read = isRead(comm)
          return (
            <Card
              key={comm.id}
              className={cn(
                'border-border cursor-pointer transition-colors',
                !read ? 'bg-muted/40 border-primary/20' : 'bg-card hover:bg-muted/20',
                typeCfg.bgClass
              )}
              onClick={() => { setSelectedComm(comm); markAsRead(comm.id) }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0">
                    {!read && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                  </div>
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', typeCfg.className)}>
                    <TypeIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn('text-sm font-semibold truncate', !read ? 'text-foreground' : 'text-muted-foreground')}>
                        {comm.title}
                      </span>
                      <Badge variant="outline" className={cn('text-xs shrink-0', typeCfg.className)}>
                        {typeCfg.label}
                      </Badge>
                      {(comm.priority === 'urgent' || comm.priority === 'high') && (
                        <Badge variant="outline" className={cn('text-xs shrink-0', priorityBadge[comm.priority])}>
                          {priorityLabel[comm.priority]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{comm.message}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(comm.sentAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {comm.authorName}
                      </span>
                      {read && (
                        <span className="flex items-center gap-1 text-primary">
                          <CheckCheck className="h-3 w-3" />
                          Leido
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedComm && (
        <Dialog open={!!selectedComm} onOpenChange={() => setSelectedComm(null)}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                {(() => {
                  const cfg = typeConfig[selectedComm.type]
                  const Icon = cfg.icon
                  return (
                    <>
                      <span className={cn('flex h-7 w-7 items-center justify-center rounded-md border', cfg.className)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-balance">{selectedComm.title}</span>
                    </>
                  )
                })()}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className={typeConfig[selectedComm.type].className}>
                  {typeConfig[selectedComm.type].label}
                </Badge>
                <Badge variant="outline" className={priorityBadge[selectedComm.priority]}>
                  Prioridad: {priorityLabel[selectedComm.priority]}
                </Badge>
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {selectedComm.message}
              </p>
              <div className="rounded-lg bg-muted p-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Enviado por {selectedComm.authorName}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {formatRelativeTime(selectedComm.sentAt)}
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedComm(null)}>Entendido</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
