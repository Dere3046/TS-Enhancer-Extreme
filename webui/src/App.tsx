import { useState } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { I18nProvider } from './contexts/I18nContext'
import { LoggerProvider } from './contexts/LoggerContext'
import { AppProvider, useApp } from './contexts/AppContext'
import { AppBar } from './components/AppBar'
import { StatusCard } from './components/StatusCard'
import { NavCards } from './components/NavCards'
import { DeviceInfoCard } from './components/DeviceInfoCard'
import { DeveloperCard } from './components/DeveloperCard'
import { BottomNav } from './components/BottomNav'
import { SettingsPage } from './components/SettingsPage'
import { LogsPage } from './components/LogsPage'
// TargetPage removed - waiting for TSEED update
import { KeyboxPage } from './components/KeyboxPage'
import { ToolPage } from './components/ToolPage'
import { AboutPage } from './components/AboutPage'
import { loadSettings, saveSettings } from './utils/settings'
import { useTheme } from './contexts/ThemeContext'

type PageType = 'home' | 'settings' | 'logs' | 'keybox' | 'tool' | 'about'

function HomePage({ onNavigate }: { onNavigate: (page: PageType) => void }) {
  const { state } = useApp()

  return (
    <div className="flex flex-col gap-4">
      <StatusCard />
      <NavCards
        hasKeybox={state.hasKeybox}
        onKeyboxClick={() => onNavigate('keybox')}
      />
      <DeviceInfoCard
        deviceName={state.deviceName}
        androidVersion={state.androidVersion}
        kernelVersion={state.kernelVersion}
        selinuxStatus={state.selinuxStatus}
        architecture={state.architecture}
      />
      <DeveloperCard />
    </div>
  )
}

function AppContent() {
  const { colors } = useTheme()
  const [currentPage, setCurrentPage] = useState<PageType>('home')
  const [navigationMode, setNavigationMode] = useState<'bottom' | 'floating'>(
    () => loadSettings().navigationMode ?? 'bottom'
  )
  const [keyboxRefreshKey, setKeyboxRefreshKey] = useState(0)

  const handleBack = () => (currentPage === 'logs' ? setCurrentPage('tool') : setCurrentPage('home'))

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage onNavigate={setCurrentPage} />
      case 'keybox': return <KeyboxPage key={keyboxRefreshKey} />
      case 'settings':
        return <SettingsPage navigationMode={navigationMode} onNavigationModeChange={m => { setNavigationMode(m); saveSettings({ navigationMode: m }) }} />
      case 'logs': return <LogsPage />
      case 'tool': return <ToolPage onNavigate={p => setCurrentPage(p as PageType)} />
      case 'about': return <AboutPage />
      default: return <HomePage onNavigate={setCurrentPage} />
    }
  }

  const getNavPage = (): string => {
    if (currentPage === 'keybox') return 'home'
    if (currentPage === 'logs') return 'tool'
    if (currentPage === 'about') return 'settings'
    return currentPage
  }

  return (
    <div className="min-h-screen transition-colors duration-300 pb-20" style={{ backgroundColor: colors.background }}>
      <AppBar
        currentPage={currentPage}
        onBack={handleBack}
        onNavigate={(page) => setCurrentPage(page)}
        navigationMode={navigationMode}
        onKeyboxRefresh={() => setKeyboxRefreshKey(k => k + 1)}
      />
      <main className="max-w-2xl mx-auto px-4 py-6">
        {renderPage()}
      </main>
      {navigationMode === 'bottom' && <BottomNav currentPage={getNavPage()} onNavigate={p => setCurrentPage(p as PageType)} />}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <LoggerProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </LoggerProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
