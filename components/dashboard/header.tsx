'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Bell, Clock, Building2 } from 'lucide-react'

interface HeaderProps {
  title: string
  onNewEntry: () => void
  unreadAlerts: number
}

export function Header({ title, onNewEntry, unreadAlerts }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <header className="flex flex-col gap-4 border-b border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
      <div className="flex items-center gap-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{title}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>Torres del Parque - Building A</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search visitors, plates..."
            className="w-full sm:w-64 bg-secondary pl-9"
          />
        </div>

        {/* Current Time */}
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2">
          <Clock className="h-4 w-4 text-primary" />
          <div className="text-right">
            <p className="font-mono text-lg font-semibold text-foreground">
              {formatTime(currentTime)}
            </p>
            <p className="text-xs text-muted-foreground">{formatDate(currentTime)}</p>
          </div>
        </div>

        {/* Notifications & New Entry */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="relative bg-transparent">
            <Bell className="h-5 w-5" />
            {unreadAlerts > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
              >
                {unreadAlerts}
              </Badge>
            )}
          </Button>

          {/* New Entry Button */}
          <Button onClick={onNewEntry} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Entry</span>
            <kbd className="ml-1 rounded bg-primary-foreground/20 px-1.5 py-0.5 text-xs hidden sm:inline">F1</kbd>
          </Button>
        </div>
      </div>
    </header>
  )
}
