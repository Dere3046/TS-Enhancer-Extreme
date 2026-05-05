import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadSettings, saveSettings, clearCacheOnly, syncSettingsFromDisk, type AppSettings } from './settings'

// Mock TSeed
vi.mock('../services/tseed', () => ({
  TSeed: {
    system: {
      settingsGet: vi.fn().mockResolvedValue('{}'),
      settingsSet: vi.fn().mockResolvedValue('OK'),
    },
  },
}))

describe('settings utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should load default settings', () => {
    const settings = loadSettings()
    expect(settings.lang).toBe('zh')
    expect(settings.theme).toBe('dark')
    expect(settings.proxyMode).toBe('manual')
  })

  it('should load settings from localStorage', () => {
    const custom: AppSettings = {
      lang: 'en',
      theme: 'light',
      monetColor: '#ff0000',
      proxyMode: 'auto',
      vbhashAutoApply: true,
      navigationMode: 'floating',
    }
    localStorage.setItem('tsee-settings', JSON.stringify(custom))
    const settings = loadSettings()
    expect(settings.lang).toBe('en')
    expect(settings.theme).toBe('light')
  })

  it('should save settings to localStorage', async () => {
    await saveSettings({ lang: 'en' })
    const saved = localStorage.getItem('tsee-settings')
    expect(saved).toContain('"lang":"en"')
  })

  it('should clear cache but keep settings', () => {
    localStorage.setItem('tsee-settings', '{"lang":"en"}')
    localStorage.setItem('tsee-app-state', '{"test":true}')
    clearCacheOnly()
    expect(localStorage.getItem('tsee-settings')).toBe('{"lang":"en"}')
    expect(localStorage.getItem('tsee-app-state')).toBeNull()
  })

  it('should sync settings from disk', async () => {
    const result = await syncSettingsFromDisk()
    expect(result.lang).toBe('zh')
  })
})
