import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

export interface LogEntry {
  id: string
  level: 'log' | 'warn' | 'error' | 'info'
  message: string
  timestamp: number
}

interface LoggerContextType {
  logs: LogEntry[]
  clearLogs: () => void
  addLog: (level: LogEntry['level'], message: string) => void
}

const LoggerContext = createContext<LoggerContextType | null>(null)

let logId = 0

export function LoggerProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([])

  const addLog = useCallback((level: LogEntry['level'], message: string) => {
    const entry: LogEntry = {
      id: `${Date.now()}-${++logId}`,
      level,
      message,
      timestamp: Date.now(),
    }
    setLogs(prev => {
      const next = [...prev, entry]
      // Keep last 500 entries to avoid memory bloat
      if (next.length > 500) return next.slice(-500)
      return next
    })
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  // Intercept console methods
  useEffect(() => {
    const origLog = console.log
    const origWarn = console.warn
    const origError = console.error
    const origInfo = console.info

    console.log = (...args: unknown[]) => {
      addLog('log', args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '))
      origLog.apply(console, args)
    }
    console.warn = (...args: unknown[]) => {
      addLog('warn', args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '))
      origWarn.apply(console, args)
    }
    console.error = (...args: unknown[]) => {
      addLog('error', args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '))
      origError.apply(console, args)
    }
    console.info = (...args: unknown[]) => {
      addLog('info', args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '))
      origInfo.apply(console, args)
    }

    // Capture global errors
    const onError = (e: ErrorEvent) => {
      addLog('error', `${e.message} at ${e.filename}:${e.lineno}`)
    }
    window.addEventListener('error', onError)

    // Capture unhandled promise rejections
    const onRejection = (e: PromiseRejectionEvent) => {
      addLog('error', `Unhandled rejection: ${e.reason}`)
    }
    window.addEventListener('unhandledrejection', onRejection)

    return () => {
      console.log = origLog
      console.warn = origWarn
      console.error = origError
      console.info = origInfo
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [addLog])

  return (
    <LoggerContext.Provider value={{ logs, clearLogs, addLog }}>
      {children}
    </LoggerContext.Provider>
  )
}

export function useLogger() {
  const context = useContext(LoggerContext)
  if (!context) {
    throw new Error('useLogger must be used within a LoggerProvider')
  }
  return context
}
