import { revalidateTag } from 'next/cache'

export interface CachedApiOptions {
  revalidate?: number
  tags?: string[]
}

export function createCachedFetch<T>(
  fetchFn: () => Promise<T>,
  options: CachedApiOptions = {}
) {
  const { revalidate = 60, tags = [] } = options
  
  return async function cachedFetch() {
    const data = await fetchFn()
    return data
  }
}

export function getCachedBuildings() {
  return async function fetchBuildings() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/buildings`, {
      next: { revalidate: 60, tags: ['buildings'] }
    })
    if (!res.ok) throw new Error('Failed to fetch buildings')
    return res.json()
  }
}

export function getCachedStats() {
  return async function fetchStats() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stats`, {
      next: { revalidate: 30, tags: ['stats'] }
    })
    if (!res.ok) throw new Error('Failed to fetch stats')
    return res.json()
  }
}

export function getCachedUsers() {
  return async function fetchUsers() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users`, {
      next: { revalidate: 60, tags: ['users'] }
    })
    if (!res.ok) throw new Error('Failed to fetch users')
    return res.json()
  }
}

export async function revalidateCacheTag(tag: string) {
  'use server'
  revalidateTag(tag, 'max')
}

export async function revalidateBuildingsCache() {
  'use server'
  revalidateTag('buildings', 'max')
}

export async function revalidateStatsCache() {
  'use server'
  revalidateTag('stats', 'max')
}

export async function revalidateUsersCache() {
  'use server'
  revalidateTag('users', 'max')
}