'use client'

import { StatsCards } from './stats-cards'
import { ParkingMap } from './parking-map'
import { AlertsPanel } from './alerts-panel'
import type { ParkingSpot, Visitor, Alert } from '@/lib/types'

interface OverviewProps {
  parkingSpots: ParkingSpot[]
  visitors: Visitor[]
  alerts: Alert[]
  onSpotUpdate: (spotId: string, updates: Partial<ParkingSpot>) => void
  onMarkAlertRead: (alertId: string) => void
  onMarkAllAlertsRead: () => void
  onDismissAlert: (alertId: string) => void
}

export function Overview({
  parkingSpots,
  visitors,
  alerts,
  onSpotUpdate,
  onMarkAlertRead,
  onMarkAllAlertsRead,
  onDismissAlert,
}: OverviewProps) {
  return (
    <div className="space-y-6">
      <StatsCards parkingSpots={parkingSpots} visitors={visitors} alerts={alerts} />
      
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <ParkingMap parkingSpots={parkingSpots} onSpotUpdate={onSpotUpdate} />
        </div>
        <div className="col-span-1">
          <AlertsPanel
            alerts={alerts}
            onMarkAsRead={onMarkAlertRead}
            onMarkAllRead={onMarkAllAlertsRead}
            onDismiss={onDismissAlert}
            compact
          />
        </div>
      </div>
    </div>
  )
}
