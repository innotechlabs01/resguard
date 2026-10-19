'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { QRCodeSVG } from 'qrcode.react'
import { QrCode, Camera, CameraOff, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface QRScannerProps {
  onScan: (data: string) => void
  title?: string
  description?: string
}

/**
 * QR scanner component for PWA. Uses the browser's camera via
 * @zxing/browser. Works on Android Chrome and iOS Safari (HTTPS required).
 * Displays camera feed + real-time scanning.
 */
export function QRScanner({ onScan, title = 'Escanear QR', description = 'Apunta la cámara al código QR del visitante' }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastScan, setLastScan] = useState<string | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const controlsRef = useRef<unknown>(null)

  const startScan = useCallback(async () => {
    setError(null)
    setScanning(true)
    try {
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      if (!videoRef.current) return

      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText()
            if (text && text !== lastScan) {
              setLastScan(text)
              onScan(text)
            }
          }
          // Ignore NotFoundError (no QR in frame) and camera permission errors
          if (err && !(err instanceof Error && err.name === 'NotFoundError')) {
            // Only show real errors
          }
        }
      )
      controlsRef.current = controls
    } catch {
      setError('No se pudo acceder a la cámara. Verifica los permisos del navegador.')
      setScanning(false)
    }
  }, [onScan, lastScan])

  const stopScan = useCallback(() => {
    if (controlsRef.current) {
      (controlsRef.current as { stop: () => void }).stop()
      controlsRef.current = null
    }
    setScanning(false)
  }, [])

  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        (controlsRef.current as { stop: () => void }).stop()
      }
    }
  }, [])

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <QrCode className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: scanning ? 'block' : 'none' }}
          />
          {!scanning && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <Camera className="h-12 w-12" />
            </div>
          )}
          {/* Scan frame overlay */}
          {scanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-[20%] inset-y-[25%] border-2 border-success/70 rounded-lg" />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {!scanning ? (
            <Button onClick={startScan} className="gap-2 flex-1">
              <Camera className="h-4 w-4" />
              Iniciar cámara
            </Button>
          ) : (
            <Button onClick={stopScan} variant="outline" className="gap-2 flex-1">
              <CameraOff className="h-4 w-4" />
              Detener
            </Button>
          )}
        </div>

        {lastScan && (
          <div className="bg-success/10 text-success text-sm p-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span className="font-mono truncate">{lastScan}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Visitor pass QR generator — generates a QR code that the vigilante
 * can scan at the entrance. The QR contains a signed payload with
 * visitor info + building + expiry.
 */
export function VisitorQRPass({ visitorId, visitorName, buildingId, unit }: {
  visitorId: string
  visitorName: string
  buildingId: string
  unit: string
}) {
  const payload = JSON.stringify({ t: 'visitor', vid: visitorId, n: visitorName, b: buildingId, u: unit })

  return (
    <Card className="border-border bg-card max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-foreground">Pase de Visitante</CardTitle>
        <CardDescription className="text-center">{visitorName}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <QRCodeSVG
          value={payload}
          size={220}
          level="M"
          includeMargin
        />
        <p className="text-xs text-muted-foreground text-center">
          Presenta este código QR en la entrada del edificio.
          Apartamento: {unit}
        </p>
      </CardContent>
    </Card>
  )
}
