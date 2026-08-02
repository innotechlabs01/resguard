'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface BoldPaymentButtonProps {
  paymentId: string
  amount: number
  description: string
  onSuccess?: (orderId: string, status: string) => void
  onError?: (error: string) => void
}

export function BoldPaymentButton({
  paymentId,
  amount,
  description,
  onSuccess,
  onError,
}: BoldPaymentButtonProps) {
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [paid, setPaid] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const preparePayment = async () => {
      try {
        const res = await fetch('/api/payments/prepare-button', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId,
            amount,
            description,
          }),
        })

        const data = await res.json()
        if (data.success) {
          setConfig(data.buttonConfig)
        } else {
          setError(data.error || 'Error al preparar pago')
          onError?.(data.error)
        }
      } catch (err) {
        setError('Error de conexión')
        onError?.('Error de conexión')
      } finally {
        setLoading(false)
      }
    }

    preparePayment()
  }, [paymentId, amount, description, onError])

  useEffect(() => {
    if (!config || !containerRef.current) return

    const checkAndMountButton = () => {
      const container = containerRef.current
      if (!container || paid) return

      const existingScript = document.getElementById('bold-payment-script')
      if (!existingScript) {
        const script = document.createElement('script')
        script.id = 'bold-payment-script'
        script.src = 'https://checkout.bold.co/library/boldPaymentButton.js'
        script.async = true
        script.onload = () => mountButton()
        document.head.appendChild(script)
      } else {
        mountButton()
      }
    }

    const mountButton = () => {
      const container = containerRef.current
      if (!container || paid) return
      
      container.innerHTML = ''

      const script = document.createElement('script')
      script.setAttribute('data-bold-button', config.renderMode || 'dark-L')
      script.setAttribute('data-api-key', config.apiKey)
      script.setAttribute('data-order-id', config.orderId)
      script.setAttribute('data-currency', config.currency)
      script.setAttribute('data-description', config.description)
      script.setAttribute('data-redirection-url', config.redirectUrl)

      if (config.amount > 0) {
        script.setAttribute('data-amount', config.amount.toString())
        script.setAttribute('data-integrity-signature', config.integritySignature)
      }

      if (config.customerData) {
        script.setAttribute('data-customer-data', JSON.stringify(config.customerData))
      }

      if (config.renderMode) {
        script.setAttribute('data-render-mode', config.renderMode)
      }

      container.appendChild(script)
    }

    const timeout = setTimeout(checkAndMountButton, 500)
    return () => clearTimeout(timeout)
  }, [config, paid])

  const handlePaid = () => {
    setPaid(true)
    onSuccess?.(config?.orderId || paymentId, 'paid')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Preparando pago...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-destructive text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-2">
          Reintentar
        </Button>
      </div>
    )
  }

  if (paid) {
    return (
      <div className="text-center p-8">
        <div className="text-success text-lg font-medium mb-2">Pago completado</div>
        <p className="text-muted-foreground text-sm">Tu pago ha sido procesado exitosamente</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div>
          <p className="font-medium">{description}</p>
          <p className="text-2xl font-bold text-primary">
            ${amount.toLocaleString('es-CO')}
          </p>
        </div>
        <Button onClick={() => setShowCheckout(true)}>
          Pagar ahora
        </Button>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Pago con Bold</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowCheckout(false)}>
                ✕
              </Button>
            </div>
            <div ref={containerRef} className="p-4" />
          </div>
        </div>
      )}
    </div>
  )
}