import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { addLogListener, removeLogListener, type LogEntry } from '../services/tseed'

interface LoggerContextType {
  logs: LogEntry[]
  clearLogs: () => void
}

const LoggerContext = createContext<LoggerContextType | null>(null)

export function LoggerProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
    const listener = (entry: LogEntry) => {
      setLogs(prev => {
        const next = [...prev, entry]
        if (next.length > 500) return next.slice(-500)
        return next
      })
    }
    addLogListener(listener)
    return () => removeLogListener(listener)
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  return (
    <LoggerContext.Provider value={{ logs, clearLogs }}>
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
