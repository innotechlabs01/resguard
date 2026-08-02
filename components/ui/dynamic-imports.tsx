'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { SkeletonCard } from './skeleton-loaders'

interface DynamicImportOptions {
  ssr?: boolean
  loading?: React.ReactNode
}

function createLazyComponent(importFn: () => Promise<any>, options: DynamicImportOptions = {}) {
  return dynamic(importFn, {
    ssr: options.ssr ?? false,
    loading: () => options.loading ?? <SkeletonCard className="h-[300px]" />,
  })
}

export const DynamicChart = createLazyComponent(
  () => import('@/components/ui/chart'),
  { ssr: false, loading: <SkeletonCard className="h-[300px]" /> }
)

export const DynamicParkingMap = createLazyComponent(
  () => import('@/components/dashboard/parking-map'),
  { ssr: false, loading: <SkeletonCard className="h-[400px]" /> }
)

export const DynamicAlertsPanel = createLazyComponent(
  () => import('@/components/dashboard/alerts-panel'),
  { ssr: false, loading: <SkeletonCard className="h-[200px]" /> }
)

export const DynamicReportsPanel = createLazyComponent(
  () => import('@/components/dashboard/reports-panel'),
  { ssr: false, loading: <SkeletonCard className="h-[400px]" /> }
)

export const DynamicMarketplace = createLazyComponent(
  () => import('@/components/usuario/marketplace'),
  { ssr: false, loading: <SkeletonCard className="h-[300px]" /> }
)

export const DynamicAnalyticsPanel = createLazyComponent(
  () => import('@/components/super-admin/analytics-panel'),
  { ssr: false, loading: <SkeletonCard className="h-[400px]" /> }
)

export const DynamicParkingConfigPanel = createLazyComponent(
  () => import('@/components/super-admin/parking-config-panel'),
  { ssr: false, loading: <SkeletonCard className="h-[400px]" /> }
)

export function LazyWrapper({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return <Suspense fallback={fallback ?? <SkeletonCard />}>{children}</Suspense>
}

export function SuspenseWrapper({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <Suspense fallback={fallback ?? <SkeletonCard />}>
      {children}
    </Suspense>
  )
}

export { SkeletonCard } from './skeleton-loaders'