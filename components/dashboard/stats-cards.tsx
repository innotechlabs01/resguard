'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Car, Users, AlertTriangle, Clock } from 'lucide-react'
import type { ParkingSpot, Visitor, Alert } from '@/lib/types'

interface StatsCardsProps {
  parkingSpots: ParkingSpot[]
  visitors: Visitor[]
  alerts: Alert[]
}

export function StatsCards({ parkingSpots, visitors, alerts }: StatsCardsProps) {
  const availableSpots = parkingSpots.filter((s) => s.status === 'available').length
  const occupiedSpots = parkingSpots.filter((s) => s.status === 'occupied').length
  const overtimeSpots = parkingSpots.filter((s) => s.status === 'overtime').length
  const activeVisitors = visitors.filter((v) => v.status === 'inside').length
  const unreadAlerts = alerts.filter((a) => !a.read).length
  const criticalAlerts = alerts.filter((a) => a.priority === 'critical' && !a.read).length

  const stats = [
    {
      label: 'Available Parking',
      value: availableSpots,
      total: parkingSpots.length,
      icon: Car,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Active Visitors',
      value: activeVisitors,
      subtitle: `${occupiedSpots} vehicles parked`,
      icon: Users,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      label: 'Overtime Vehicles',
      value: overtimeSpots,
      subtitle: 'Require attention',
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Pending Alerts',
      value: unreadAlerts,
      subtitle: criticalAlerts > 0 ? `${criticalAlerts} critical` : 'No critical alerts',
      icon: AlertTriangle,
      color: criticalAlerts > 0 ? 'text-destructive' : 'text-muted-foreground',
      bgColor: criticalAlerts > 0 ? 'bg-destructive/10' : 'bg-muted',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  {stat.total && (
                    <span className="text-sm text-muted-foreground">/ {stat.total}</span>
                  )}
                </div>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
