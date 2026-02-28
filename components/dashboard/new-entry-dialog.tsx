'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Car, Footprints, Camera, User, CreditCard, Building, Printer } from 'lucide-react'
import type { Visitor, ParkingSpot } from '@/lib/types'

interface NewEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableSpots: ParkingSpot[]
  onSubmit: (visitor: Omit<Visitor, 'id' | 'entryTime' | 'status'>) => void
}

export function NewEntryDialog({
  open,
  onOpenChange,
  availableSpots,
  onSubmit,
}: NewEntryDialogProps) {
  const [visitorType, setVisitorType] = useState<'vehicle' | 'pedestrian'>('vehicle')
  const [name, setName] = useState('')
  const [documentId, setDocumentId] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [destinationUnit, setDestinationUnit] = useState('')
  const [residentName, setResidentName] = useState('')
  const [selectedSpot, setSelectedSpot] = useState('')
  const [printTicket, setPrintTicket] = useState(true)

  const resetForm = () => {
    setName('')
    setDocumentId('')
    setVehiclePlate('')
    setDestinationUnit('')
    setResidentName('')
    setSelectedSpot('')
    setVisitorType('vehicle')
  }

  const handleSubmit = () => {
    const visitor: Omit<Visitor, 'id' | 'entryTime' | 'status'> = {
      name,
      documentId,
      type: visitorType,
      destinationUnit,
      residentName,
      ...(visitorType === 'vehicle' && {
        vehiclePlate,
        parkingSpot: selectedSpot,
      }),
    }
    onSubmit(visitor)
    resetForm()
    onOpenChange(false)
  }

  const isValid =
    name.trim() !== '' &&
    documentId.trim() !== '' &&
    destinationUnit.trim() !== '' &&
    residentName.trim() !== '' &&
    (visitorType === 'pedestrian' || (vehiclePlate.trim() !== '' && selectedSpot !== ''))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Register New Entry
          </DialogTitle>
          <DialogDescription>
            Quick entry registration for visitors. Press F1 to open this form.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={visitorType} onValueChange={(v) => setVisitorType(v as typeof visitorType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vehicle" className="gap-2">
              <Car className="h-4 w-4" />
              Vehicle
            </TabsTrigger>
            <TabsTrigger value="pedestrian" className="gap-2">
              <Footprints className="h-4 w-4" />
              Pedestrian
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            {/* Visitor Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Visitor Name</Label>
                <Input
                  id="name"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentId">Document ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="documentId"
                    placeholder="ID number"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon" title="Capture with camera">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <TabsContent value="vehicle" className="m-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plate">License Plate</Label>
                  <div className="flex gap-2">
                    <Input
                      id="plate"
                      placeholder="ABC-123"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                      className="flex-1 font-mono"
                    />
                    <Button variant="outline" size="icon" title="Capture with camera">
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spot">Parking Spot</Label>
                  <Select value={selectedSpot} onValueChange={setSelectedSpot}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select spot" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSpots.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No spots available
                        </SelectItem>
                      ) : (
                        availableSpots.map((spot) => (
                          <SelectItem key={spot.id} value={spot.code}>
                            {spot.code}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pedestrian" className="m-0">
              <div className="rounded-lg bg-secondary p-3 text-sm text-muted-foreground">
                Pedestrian entry - no parking spot required.
              </div>
            </TabsContent>

            {/* Destination */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Destination Unit</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="unit"
                    placeholder="e.g., 301"
                    value={destinationUnit}
                    onChange={(e) => setDestinationUnit(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resident">Resident Name</Label>
                <Input
                  id="resident"
                  placeholder="Resident name"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                />
              </div>
            </div>

            {/* Print Option */}
            <div className="flex items-center gap-2 rounded-lg border border-border p-3">
              <input
                type="checkbox"
                id="printTicket"
                checked={printTicket}
                onChange={(e) => setPrintTicket(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="printTicket" className="flex items-center gap-2 text-sm">
                <Printer className="h-4 w-4 text-muted-foreground" />
                Print entry ticket with QR code
              </Label>
            </div>
          </div>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            <CreditCard className="mr-2 h-4 w-4" />
            Register Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
