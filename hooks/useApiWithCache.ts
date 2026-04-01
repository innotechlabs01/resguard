'use client'

import { useState, useEffect, useCallback } from 'react'

interface FetchOptions extends RequestInit {
  revalidate?: number
  cache?: RequestCache
}

interface UseApiOptions {
  revalidate?: number
  cache?: boolean
  cacheKey?: string
}

const cacheStore = new Map<string, { data: any; timestamp: number; revalidate: number }>()

export function useApiWithCache<T>(url: string, options: UseApiOptions = {}) {
  const { revalidate = 60, cache = true, cacheKey = url } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    const cacheKeyStr = `${cacheKey}_${url}`
    
    if (cache && cacheStore.has(cacheKeyStr)) {
      const cached = cacheStore.get(cacheKeyStr)!
      if (Date.now() - cached.timestamp < cached.revalidate * 1000) {
        setData(cached.data as T)
        setLoading(false)
        return
      }
    }

    try {
      const response = await fetch(url, {
        next: { revalidate },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (cache) {
        cacheStore.set(cacheKeyStr, { 
          data: result, 
          timestamp: Date.now(), 
          revalidate 
        })
      }
      
      setData(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [url, cache, cacheKey, revalidate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const invalidate = useCallback(() => {
    const cacheKeyStr = `${cacheKey}_${url}`
    cacheStore.delete(cacheKeyStr)
    setLoading(true)
    fetchData()
  }, [cacheKey, url, fetchData])

  return { data, loading, error, refetch: fetchData, invalidate }
}

export function invalidateApiCache(prefix?: string) {
  if (!prefix) {
    cacheStore.clear()
    return
  }
  
  for (const key of cacheStore.keys()) {
    if (key.includes(prefix)) {
      cacheStore.delete(key)
    }
  }
}