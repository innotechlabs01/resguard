import 'server-only'

import { createClient, type Client } from '@libsql/client'
import { getDatabaseProvider } from '@/lib/env'

let tursoClient: Client | null = null

export function getTursoClient(): Client | null {
  if (getDatabaseProvider() !== 'turso') return null
  const url = process.env.DATABASE_URL_TURSO
  const authToken = process.env.DATABASE_TOKEN_TURSO
  if (!url) return null

  if (!tursoClient) {
    tursoClient = createClient({
      url,
      authToken: authToken ?? undefined,
    })
  }
  return tursoClient
}
