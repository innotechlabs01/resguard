'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseFetchOptions<T> {
  cache?: boolean
  cacheKey?: string
  revalidate?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface CachedData {
  data: any
  timestamp: number
}

const memoryCache = new Map<string, CachedData>()

export function useFetch<T>(url: string, options?: UseFetchOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const { 
    cache = true, 
    cacheKey = url, 
    revalidate, 
    onSuccess, 
    onError 
  } = options || {}

  const fetchData = useCallback(async () => {
    if (cache && memoryCache.has(cacheKey)) {
      const cached = memoryCache.get(cacheKey)!
      if (revalidate && Date.now() - cached.timestamp < revalidate * 1000) {
        setData(cached.data)
        setLoading(false)
        return
      }
    }

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      
      if (cache) {
        memoryCache.set(cacheKey, { data: result, timestamp: Date.now() })
      }
      
      setData(result)
      onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [url, cache, cacheKey, revalidate, onSuccess, onError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const invalidateCache = useCallback(() => {
    memoryCache.delete(cacheKey)
  }, [cacheKey])

  return { data, loading, error, refetch: fetchData, invalidateCache }
}

export function clearAllCache() {
  memoryCache.clear()
}

export function invalidateCacheByPrefix(prefix: string) {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key)
    }
  }
}