'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Car, Clock, User, Building, AlertTriangle, Check, X } from 'lucide-react'
import type { ParkingSpot } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ParkingMapProps {
  parkingSpots: ParkingSpot[]
  onSpotUpdate: (spotId: string, updates: Partial<ParkingSpot>) => void
}

function formatTimeRemaining(minutes: number): string {
  if (minutes < 0) {
    const overMinutes = Math.abs(minutes)
    const hours = Math.floor(overMinutes / 60)
    const mins = overMinutes % 60
    return hours > 0 ? `-${hours}h ${mins}m` : `-${mins}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

function getSpotColor(status: ParkingSpot['status']): string {
  switch (status) {
    case 'available':
      return 'bg-success/20 border-success/50 hover:bg-success/30'
    case 'occupied':
      return 'bg-info/20 border-info/50 hover:bg-info/30'
    case 'reserved':
      return 'bg-warning/20 border-warning/50 hover:bg-warning/30'
    case 'overtime':
      return 'bg-destructive/20 border-destructive/50 hover:bg-destructive/30 animate-pulse'
    default:
      return 'bg-muted border-border'
  }
}

function getStatusBadge(status: ParkingSpot['status']) {
  switch (status) {
    case 'available':
      return <Badge className="bg-success text-success-foreground">Available</Badge>
    case 'occupied':
      return <Badge className="bg-info text-info-foreground">Occupied</Badge>
    case 'reserved':
      return <Badge className="bg-warning text-warning-foreground">Reserved</Badge>
    case 'overtime':
      return <Badge variant="destructive">Overtime</Badge>
    default:
      return null
  }
}

export function ParkingMap({ parkingSpots, onSpotUpdate }: ParkingMapProps) {
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleSpotClick = (spot: ParkingSpot) => {
    setSelectedSpot(spot)
    setDialogOpen(true)
  }

  const handleRelease = () => {
    if (selectedSpot) {
      onSpotUpdate(selectedSpot.id, {
        status: 'available',
        vehiclePlate: undefined,
        visitorName: undefined,
        residentUnit: undefined,
        entryTime: undefined,
        timeRemaining: undefined,
      })
      setDialogOpen(false)
    }
  }

  const legend = [
    { status: 'available', label: 'Available', color: 'bg-success' },
    { status: 'occupied', label: 'Occupied', color: 'bg-info' },
    { status: 'reserved', label: 'Reserved', color: 'bg-warning' },
    { status: 'overtime', label: 'Overtime', color: 'bg-destructive' },
  ]

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Car className="h-5 w-5" />
              Visitor Parking Map
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time status of all visitor parking spots
            </p>
          </div>
          <div className="flex items-center gap-4">
            {legend.map((item) => (
              <div key={item.status} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded ${item.color}`} />
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {/* Parking Grid - 5 columns x 4 rows */}
          <div className="grid grid-cols-5 gap-3">
            {parkingSpots.map((spot) => (
              <button
                key={spot.id}
                onClick={() => handleSpotClick(spot)}
                className={cn(
                  'relative flex min-h-24 flex-col items-center justify-center rounded-lg border-2 p-3 transition-all',
                  getSpotColor(spot.status)
                )}
              >
                {/* Spot Code */}
                <span className="font-mono text-lg font-bold text-foreground">{spot.code}</span>

                {/* Status indicator */}
                {spot.status === 'available' && (
                  <Check className="mt-1 h-5 w-5 text-success" />
                )}

                {spot.status === 'occupied' && (
                  <div className="mt-1 text-center">
                    <p className="truncate text-xs font-medium text-foreground">
                      {spot.vehiclePlate}
                    </p>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeRemaining(spot.timeRemaining || 0)}</span>
                    </div>
                  </div>
                )}

                {spot.status === 'reserved' && (
                  <div className="mt-1 text-center">
                    <p className="text-xs text-muted-foreground">Reserved</p>
                    <p className="text-xs font-medium text-foreground">Unit {spot.residentUnit}</p>
                  </div>
                )}

                {spot.status === 'overtime' && (
                  <div className="mt-1 text-center">
                    <p className="truncate text-xs font-medium text-foreground">
                      {spot.vehiclePlate}
                    </p>
                    <div className="flex items-center justify-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{formatTimeRemaining(spot.timeRemaining || 0)}</span>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Spot Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Spot {selectedSpot?.code}
              {selectedSpot && getStatusBadge(selectedSpot.status)}
            </DialogTitle>
            <DialogDescription>
              {selectedSpot?.status === 'available'
                ? 'This spot is currently available for visitors.'
                : selectedSpot?.status === 'reserved'
                ? 'This spot has been reserved by a resident.'
                : 'Detailed information about this parking spot.'}
            </DialogDescription>
          </DialogHeader>

          {selectedSpot && (selectedSpot.status === 'occupied' || selectedSpot.status === 'overtime') && (
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Vehicle</p>
                      <p className="font-mono font-medium">{selectedSpot.vehiclePlate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Visitor</p>
                      <p className="font-medium">{selectedSpot.visitorName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Destination</p>
                      <p className="font-medium">Unit {selectedSpot.residentUnit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className={cn(
                        'font-medium',
                        (selectedSpot.timeRemaining || 0) < 0 && 'text-destructive'
                      )}>
                        {formatTimeRemaining(selectedSpot.timeRemaining || 0)}
                        {(selectedSpot.timeRemaining || 0) < 0 && ' over'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedSpot.status === 'overtime' && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    This vehicle has exceeded the time limit. A charge will be applied to the resident.
                  </span>
                </div>
              )}
            </div>
          )}

          {selectedSpot?.status === 'reserved' && (
            <div className="rounded-lg bg-secondary p-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Reserved by</p>
                  <p className="font-medium">Unit {selectedSpot.residentUnit}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {(selectedSpot?.status === 'occupied' || selectedSpot?.status === 'overtime') && (
              <>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleRelease}>
                  <X className="mr-2 h-4 w-4" />
                  Release Spot
                </Button>
              </>
            )}
            {selectedSpot?.status === 'available' && (
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
            )}
            {selectedSpot?.status === 'reserved' && (
              <>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="secondary" onClick={handleRelease}>
                  Cancel Reservation
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
