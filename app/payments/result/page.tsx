import { Suspense } from 'react'
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PaymentResultContent } from './payment-result-content'

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Procesando resultado del pago...</p>
    </div>
  )
}

export default function PaymentResultPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <Suspense fallback={
          <CardHeader className="text-center">
            <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary mb-4" />
            <CardTitle className="text-2xl">Cargando...</CardTitle>
          </CardHeader>
        }>
          <PaymentResultContent />
        </Suspense>
      </Card>
    </div>
  )
}