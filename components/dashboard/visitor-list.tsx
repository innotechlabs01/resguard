'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Users,
  Search,
  MoreHorizontal,
  LogOut,
  Car,
  Footprints,
  Clock,
  Building,
  Filter,
} from 'lucide-react'
import type { Visitor } from '@/lib/types'
import { cn } from '@/lib/utils'

interface VisitorListProps {
  visitors: Visitor[]
  onVisitorExit: (visitorId: string) => void
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDuration(entryTime: Date, exitTime?: Date): string {
  const end = exitTime || new Date()
  const diff = Math.floor((end.getTime() - entryTime.getTime()) / 60000)
  const hours = Math.floor(diff / 60)
  const mins = diff % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

function getStatusBadge(status: Visitor['status']) {
  switch (status) {
    case 'inside':
      return <Badge className="bg-success text-success-foreground">Inside</Badge>
    case 'exited':
      return <Badge variant="secondary">Exited</Badge>
    case 'pending':
      return <Badge className="bg-warning text-warning-foreground">Pending</Badge>
    default:
      return null
  }
}

export function VisitorList({ visitors, onVisitorExit }: VisitorListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'inside' | 'exited'>('all')

  const filteredVisitors = visitors.filter((visitor) => {
    const matchesSearch =
      visitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visitor.documentId.includes(searchQuery) ||
      visitor.destinationUnit.includes(searchQuery) ||
      visitor.vehiclePlate?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || visitor.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const activeCount = visitors.filter((v) => v.status === 'inside').length
  const vehicleCount = visitors.filter((v) => v.type === 'vehicle' && v.status === 'inside').length
  const pedestrianCount = visitors.filter((v) => v.type === 'pedestrian' && v.status === 'inside').length

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5" />
              Visitor Registry
            </CardTitle>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-success" />
                {activeCount} active
              </span>
              <span className="flex items-center gap-1">
                <Car className="h-3 w-3" />
                {vehicleCount} vehicles
              </span>
              <span className="flex items-center gap-1">
                <Footprints className="h-3 w-3" />
                {pedestrianCount} pedestrians
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search visitors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-secondary pl-9"
              />
            </div>
            {/* Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  All Visitors
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('inside')}>
                  Inside Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('exited')}>
                  Exited Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Visitor</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Destination</TableHead>
                <TableHead className="text-muted-foreground">Entry Time</TableHead>
                <TableHead className="text-muted-foreground">Duration</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisitors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No visitors found
                  </TableCell>
                </TableRow>
              ) : (
                filteredVisitors.map((visitor) => (
                  <TableRow key={visitor.id} className="border-border">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{visitor.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {visitor.documentId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {visitor.type === 'vehicle' ? (
                          <>
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-mono text-sm">{visitor.vehiclePlate}</p>
                              {visitor.parkingSpot && (
                                <p className="text-xs text-muted-foreground">
                                  Spot {visitor.parkingSpot}
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <Footprints className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Pedestrian</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm">Unit {visitor.destinationUnit}</p>
                          <p className="text-xs text-muted-foreground">{visitor.residentName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatTime(visitor.entryTime)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'text-sm',
                        visitor.status === 'inside' && 'font-medium text-foreground'
                      )}>
                        {formatDuration(visitor.entryTime, visitor.exitTime)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(visitor.status)}</TableCell>
                    <TableCell className="text-right">
                      {visitor.status === 'inside' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onVisitorExit(visitor.id)}>
                              <LogOut className="mr-2 h-4 w-4" />
                              Register Exit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
