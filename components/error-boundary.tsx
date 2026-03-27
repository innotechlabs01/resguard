'use client'

import { Component, type ReactNode } from 'react'
import { track } from '@vercel/analytics'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error captured by boundary:', error, errorInfo)

    track('Error Occurred', {
      error: error.message,
      stack: error.stack || '',
      componentStack: errorInfo.componentStack || '',
      url: typeof window !== 'undefined' ? window.location.href : '',
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="max-w-md text-center">
            <h2 className="mb-4 text-2xl font-bold text-destructive">
              Algo salió mal
            </h2>
            <p className="mb-4 text-muted-foreground">
              Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Recargar Página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
