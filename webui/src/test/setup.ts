import '@testing-library/jest-dom'

// Mock KernelSU API
declare global {
  interface Window {
    ksu?: {
      exec: (cmd: string, options?: Record<string, unknown>) => Promise<{ errno: number; stdout: string; stderr: string }>
      toast: (msg: string) => void
      fullScreen: (v: boolean) => void
    }
  }
}
