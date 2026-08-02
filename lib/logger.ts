const isDev = process.env.NODE_ENV !== 'production'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }
const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (isDev ? 'debug' : 'info')

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[currentLevel]
}

function formatMessage(level: LogLevel, module: string, msg: string, data?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString()
  const base = `${timestamp} [${level.toUpperCase()}] [${module}] ${msg}`
  if (data && Object.keys(data).length > 0) {
    return `${base} ${JSON.stringify(data)}`
  }
  return base
}

function createLogger(module: string) {
  return {
    debug: (data: Record<string, unknown> | string, msg?: string) => {
      if (!shouldLog('debug')) return
      if (typeof data === 'string') {
        console.debug(formatMessage('debug', module, data))
      } else {
        console.debug(formatMessage('debug', module, msg || '', data))
      }
    },
    info: (data: Record<string, unknown> | string, msg?: string) => {
      if (!shouldLog('info')) return
      if (typeof data === 'string') {
        console.info(formatMessage('info', module, data))
      } else {
        console.info(formatMessage('info', module, msg || '', data))
      }
    },
    warn: (data: Record<string, unknown> | string, msg?: string) => {
      if (!shouldLog('warn')) return
      if (typeof data === 'string') {
        console.warn(formatMessage('warn', module, data))
      } else {
        console.warn(formatMessage('warn', module, msg || '', data))
      }
    },
    error: (data: Record<string, unknown> | string, msg?: string) => {
      if (!shouldLog('error')) return
      if (typeof data === 'string') {
        console.error(formatMessage('error', module, data))
      } else {
        console.error(formatMessage('error', module, msg || '', data))
      }
    },
    child: (bindings: { module: string }) => createLogger(bindings.module),
  }
}

export const logger = createLogger('app')
