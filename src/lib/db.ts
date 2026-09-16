import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Database client. Primary store: Supabase Postgres.
 *
 * The sandbox platform injects a stale `DATABASE_URL` (sqlite file) into the
 * process environment, and real environment variables beat .env files. To stay
 * on Supabase regardless of how this process was launched, .env also defines
 * DATABASE_URL_SUPABASE; when the ambient DATABASE_URL is a sqlite file (or
 * missing) we use the Supabase URL explicitly.
 */
function resolveDatasourceUrl(): string | undefined {
  const ambient = process.env.DATABASE_URL ?? ''
  const supabase = process.env.DATABASE_URL_SUPABASE
  if (supabase && (ambient.startsWith('file:') || ambient === '')) return supabase
  return undefined
}

const datasourceUrl = resolveDatasourceUrl()

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    ...(datasourceUrl ? { datasourceUrl } : {}),
  })

// Keep the global cache keyed to the same datasource so a stale sqlite client
// is never reused after a hot reload once Supabase is active.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
