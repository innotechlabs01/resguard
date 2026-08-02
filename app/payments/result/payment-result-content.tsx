'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function PaymentResultContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'success' | 'error' | 'pending'>('pending')

  const orderId = searchParams.get('orderId')
  const boldStatus = searchParams.get('status')
  const paymentId = searchParams.get('paymentId')

  useEffect(() => {
    const processResult = async () => {
      if (boldStatus === 'approved') {
        setStatus('success')
        
        if (paymentId) {
          try {
            await fetch('/api/payments/update-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, status: 'succeeded' }),
            })
          } catch (err) {
            console.error('Error updating payment status:', err)
          }
        }
      } else if (boldStatus === 'rejected' || boldStatus === 'failed') {
        setStatus('error')
      } else {
        setStatus('pending')
      }
      setLoading(false)
    }

    processResult()
  }, [boldStatus, paymentId])

  if (loading) {
    return (
      <>
        <CardHeader className="text-center">
          <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary mb-4" />
          <CardTitle className="text-2xl">Procesando...</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">Procesando resultado del pago...</p>
        </CardContent>
      </>
    )
  }

  return (
    <>
      <CardHeader className="text-center">
        {status === 'success' ? (
          <>
            <CheckCircle className="mx-auto h-16 w-16 text-success mb-4" />
            <CardTitle className="text-2xl text-success">Pago Exitoso</CardTitle>
          </>
        ) : status === 'error' ? (
          <>
            <XCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
            <CardTitle className="text-2xl text-destructive">Pago Fallido</CardTitle>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-16 w-16 text-warning mb-4" />
            <CardTitle className="text-2xl text-warning">Pago Pendiente</CardTitle>
          </>
        )}
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {status === 'success' && (
          <p className="text-muted-foreground">
            Tu pago ha sido procesado exitosamente. Gracias por tu pago.
          </p>
        )}
        {status === 'error' && (
          <p className="text-muted-foreground">
            El pago no pudo ser completado. Por favor intenta nuevamente o contacta a soporte.
          </p>
        )}
        {status === 'pending' && (
          <p className="text-muted-foreground">
            El estado de tu pago esta siendo procesado. Te notificaremos cuando este listo.
          </p>
        )}

        {orderId && (
          <p className="text-sm text-muted-foreground">
            Referencia: {orderId}
          </p>
        )}

        <div className="flex gap-2 justify-center pt-4">
          <Button variant="outline" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>
          {status === 'error' && (
            <Button onClick={() => router.back()}>
              Intentar nuevamente
            </Button>
          )}
        </div>
      </CardContent>
    </>
  )
}