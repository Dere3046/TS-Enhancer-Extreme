import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { loadSettings, saveSettings } from '../utils/settings'

interface MonetColors {
  primary: string
  onPrimary: string
  primaryContainer: string
  onPrimaryContainer: string
  secondary: string
  onSecondary: string
  secondaryContainer: string
  onSecondaryContainer: string
  tertiary: string
  onTertiary: string
  tertiaryContainer: string
  onTertiaryContainer: string
  error: string
  onError: string
  errorContainer: string
  onErrorContainer: string
  background: string
  onBackground: string
  surface: string
  onSurface: string
  surfaceVariant: string
  onSurfaceVariant: string
  outline: string
  outlineVariant: string
  shadow: string
  scrim: string
  inverseSurface: string
  inverseOnSurface: string
  inversePrimary: string
  surfaceDim: string
  surfaceBright: string
  surfaceContainerLowest: string
  surfaceContainerLow: string
  surfaceContainer: string
  surfaceContainerHigh: string
  surfaceContainerHighest: string
}

interface ThemeContextType {
  colors: MonetColors
  seedColor: string
  setSeedColor: (color: string) => void
  isDark: boolean
  toggleDark: () => void
}

const defaultSeedColor = '#006c4c'

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

function HSLToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0

  if (0 <= h && h < 60) { r = c; g = x; b = 0 }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0 }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function generateMonetPalette(seedColor: string, isDark: boolean): MonetColors {
  const { h, s, l } = hexToHSL(seedColor)

  if (isDark) {
    return {
      primary: HSLToHex(h, Math.min(s * 0.8, 70), 70),
      onPrimary: HSLToHex(h, 30, 15),
      primaryContainer: HSLToHex(h, s * 0.5, 25),
      onPrimaryContainer: HSLToHex(h, s * 0.6, 85),
      secondary: HSLToHex((h + 30) % 360, s * 0.5, 70),
      onSecondary: HSLToHex((h + 30) % 360, 30, 15),
      secondaryContainer: HSLToHex((h + 30) % 360, s * 0.4, 25),
      onSecondaryContainer: HSLToHex((h + 30) % 360, s * 0.5, 85),
      tertiary: HSLToHex((h + 60) % 360, s * 0.6, 70),
      onTertiary: HSLToHex((h + 60) % 360, 30, 15),
      tertiaryContainer: HSLToHex((h + 60) % 360, s * 0.5, 25),
      onTertiaryContainer: HSLToHex((h + 60) % 360, s * 0.6, 85),
      error: '#ffb4ab',
      onError: '#690005',
      errorContainer: '#93000a',
      onErrorContainer: '#ffb4ab',
      background: '#141316',
      onBackground: '#e5e1e6',
      surface: '#141316',
      onSurface: '#e5e1e6',
      surfaceVariant: '#49454f',
      onSurfaceVariant: '#cac4d0',
      outline: '#948f99',
      outlineVariant: '#49454f',
      shadow: '#000000',
      scrim: '#000000',
      inverseSurface: '#e5e1e6',
      inverseOnSurface: '#322f35',
      inversePrimary: HSLToHex(h, s * 0.8, 40),
      surfaceDim: '#141316',
      surfaceBright: '#3a383e',
      surfaceContainerLowest: '#0f0e11',
      surfaceContainerLow: '#1c1b1f',
      surfaceContainer: '#211f24',
      surfaceContainerHigh: '#2b2930',
      surfaceContainerHighest: '#36343b',
    }
  }

  return {
    primary: HSLToHex(h, Math.min(s * 1.2, 90), Math.max(l * 0.9, 25)),
    onPrimary: HSLToHex(h, 20, 95),
    primaryContainer: HSLToHex(h, s * 0.8, 90),
    onPrimaryContainer: HSLToHex(h, s * 1.2, 20),
    secondary: HSLToHex((h + 30) % 360, s * 0.7, 50),
    onSecondary: HSLToHex((h + 30) % 360, 20, 95),
    secondaryContainer: HSLToHex((h + 30) % 360, s * 0.5, 90),
    onSecondaryContainer: HSLToHex((h + 30) % 360, s * 0.8, 20),
    tertiary: HSLToHex((h + 60) % 360, s * 0.8, 50),
    onTertiary: HSLToHex((h + 60) % 360, 20, 95),
    tertiaryContainer: HSLToHex((h + 60) % 360, s * 0.6, 90),
    onTertiaryContainer: HSLToHex((h + 60) % 360, s * 0.9, 20),
    error: '#ba1a1a',
    onError: '#ffffff',
    errorContainer: '#ffdad6',
    onErrorContainer: '#410002',
    background: '#fdf8fd',
    onBackground: '#1d1b20',
    surface: '#fdf8fd',
    onSurface: '#1d1b20',
    surfaceVariant: '#e7e0ec',
    onSurfaceVariant: '#49454f',
    outline: '#7a757f',
    outlineVariant: '#cac4d0',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#322f35',
    inverseOnSurface: '#f5eff4',
    inversePrimary: HSLToHex(h, s * 0.8, 80),
    surfaceDim: '#ddd8dd',
    surfaceBright: '#fdf8fd',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f8f2f8',
    surfaceContainer: '#f2ecf2',
    surfaceContainerHigh: '#ece6ec',
    surfaceContainerHighest: '#e6e1e6',
  }
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [seedColor, setSeedColorState] = useState(() => {
    return loadSettings().monetColor || defaultSeedColor
  })
  const [isDark, setIsDark] = useState(() => {
    const saved = loadSettings().theme
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const colors = generateMonetPalette(seedColor, isDark)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const setSeedColor = useCallback((color: string) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      saveSettings({ monetColor: color })
      setSeedColorState(color)
    }
  }, [])

  const toggleDark = useCallback(() => {
    setIsDark(prev => {
      const next = !prev
      saveSettings({ theme: next ? 'dark' : 'light' })
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        colors,
        seedColor,
        setSeedColor,
        isDark,
        toggleDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
