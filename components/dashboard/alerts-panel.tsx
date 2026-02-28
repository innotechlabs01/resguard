'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bell,
  Clock,
  Car,
  Users,
  AlertTriangle,
  Settings,
  Check,
  CheckCheck,
  Trash2,
  Filter,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Alert } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AlertsPanelProps {
  alerts: Alert[]
  onMarkAsRead: (alertId: string) => void
  onMarkAllRead: () => void
  onDismiss: (alertId: string) => void
  compact?: boolean
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function getAlertIcon(type: Alert['type']) {
  switch (type) {
    case 'parking_overtime':
      return Clock
    case 'visitor_entry':
    case 'visitor_exit':
      return Users
    case 'parking_request':
      return Car
    case 'emergency':
      return AlertTriangle
    default:
      return Bell
  }
}

function getPriorityStyles(priority: Alert['priority'], read: boolean) {
  if (read) {
    return 'border-border bg-card/50 opacity-70'
  }
  
  switch (priority) {
    case 'critical':
      return 'border-destructive bg-destructive/10'
    case 'high':
      return 'border-warning bg-warning/10'
    case 'medium':
      return 'border-info bg-info/10'
    default:
      return 'border-border bg-card'
  }
}

function getPriorityBadge(priority: Alert['priority']) {
  switch (priority) {
    case 'critical':
      return <Badge variant="destructive">Critical</Badge>
    case 'high':
      return <Badge className="bg-warning text-warning-foreground">High</Badge>
    case 'medium':
      return <Badge className="bg-info text-info-foreground">Medium</Badge>
    default:
      return <Badge variant="secondary">Low</Badge>
  }
}

export function AlertsPanel({
  alerts,
  onMarkAsRead,
  onMarkAllRead,
  onDismiss,
  compact = false,
}: AlertsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all')

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'unread') return !alert.read
    if (filter === 'critical') return alert.priority === 'critical' || alert.priority === 'high'
    return true
  })

  const unreadCount = alerts.filter((a) => !a.read).length
  const criticalCount = alerts.filter(
    (a) => !a.read && (a.priority === 'critical' || a.priority === 'high')
  ).length

  if (compact) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Bell className="h-4 w-4" />
              Recent Alerts
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
                <CheckCheck className="mr-1 h-3 w-3" />
                Read all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => {
                const Icon = getAlertIcon(alert.type)
                return (
                  <button
                    key={alert.id}
                    onClick={() => !alert.read && onMarkAsRead(alert.id)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                      getPriorityStyles(alert.priority, alert.read)
                    )}
                  >
                    <Icon className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      alert.priority === 'critical' && !alert.read && 'text-destructive',
                      alert.priority === 'high' && !alert.read && 'text-warning'
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {alert.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatTimeAgo(alert.timestamp)}
                      </p>
                    </div>
                    {!alert.read && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Bell className="h-5 w-5" />
              Alerts & Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount} unread</Badge>
              )}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {criticalCount > 0
                ? `${criticalCount} alerts require immediate attention`
                : 'All critical alerts have been addressed'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  {filter === 'all' ? 'All' : filter === 'unread' ? 'Unread' : 'Critical'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter('all')}>
                  All Alerts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('unread')}>
                  Unread Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('critical')}>
                  Critical & High
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={onMarkAllRead}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-lg font-medium text-muted-foreground">No alerts</p>
                <p className="text-sm text-muted-foreground">
                  {filter !== 'all'
                    ? 'Try changing the filter to see more alerts'
                    : "You're all caught up!"}
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const Icon = getAlertIcon(alert.type)
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      'group flex items-start gap-4 rounded-lg border p-4 transition-all',
                      getPriorityStyles(alert.priority, alert.read)
                    )}
                  >
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      alert.priority === 'critical' && !alert.read && 'bg-destructive/20',
                      alert.priority === 'high' && !alert.read && 'bg-warning/20',
                      alert.priority === 'medium' && !alert.read && 'bg-info/20',
                      (alert.priority === 'low' || alert.read) && 'bg-muted'
                    )}>
                      <Icon className={cn(
                        'h-5 w-5',
                        alert.priority === 'critical' && !alert.read && 'text-destructive',
                        alert.priority === 'high' && !alert.read && 'text-warning',
                        alert.priority === 'medium' && !alert.read && 'text-info',
                        (alert.priority === 'low' || alert.read) && 'text-muted-foreground'
                      )} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{alert.title}</h4>
                        {getPriorityBadge(alert.priority)}
                        {alert.actionRequired && !alert.read && (
                          <Badge variant="outline" className="border-primary text-primary">
                            Action Required
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatTimeAgo(alert.timestamp)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {!alert.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onMarkAsRead(alert.id)}
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDismiss(alert.id)}
                        title="Dismiss"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
