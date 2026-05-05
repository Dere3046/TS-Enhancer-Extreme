import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AppProvider, useApp } from '../contexts/AppContext'
import React from 'react'

// Mock TSeed
vi.mock('../services/tseed', () => ({
  TSeed: {
    system: {
      ping: vi.fn().mockResolvedValue('pong'),
      autoproxyState: vi.fn().mockResolvedValue('disabled'),
      settingsGet: vi.fn().mockResolvedValue('{}'),
    },
    service: {
      test: vi.fn().mockResolvedValue('tseet=true,tricky=false'),
    },
    device: {
      getProp: vi.fn().mockResolvedValue('Pixel'),
      kernelVersion: vi.fn().mockResolvedValue('5.10'),
      versionCode: vi.fn().mockResolvedValue('123'),
    },
    app: {
      listNames: vi.fn().mockResolvedValue('[]'),
    },
    keybox: {
      list: vi.fn().mockResolvedValue(''),
    },
  },
}))

describe('AppContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(AppProvider, null, children)
  )

  beforeEach(() => {
    localStorage.clear()
  })

  it('should provide default state', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    expect(result.current.state.serviceRunning).toBe(false)
    expect(result.current.state.developerMode).toBe(false)
  })

  it('should update state', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    act(() => {
      result.current.setState({ developerMode: true })
    })
    expect(result.current.state.developerMode).toBe(true)
  })

  it('should persist state to localStorage', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    act(() => {
      result.current.setState({ developerMode: true })
    })
    const saved = localStorage.getItem('tsee-app-state')
    expect(saved).toContain('"developerMode":true')
  })

  it('should throw when used outside provider', () => {
    expect(() => renderHook(() => useApp())).toThrow('useApp must be used within an AppProvider')
  })
})
