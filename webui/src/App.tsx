import { useState, useCallback, lazy, Suspense } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { I18nProvider } from './contexts/I18nContext'
import { LoggerProvider } from './contexts/LoggerContext'
import { AppProvider, useApp } from './contexts/AppContext'
import { AppBar } from './components/AppBar'
import { StatusCard } from './components/StatusCard'
import { NavCards } from './components/NavCards'
import { DashboardCard } from './components/DashboardCard'
import { DeviceInfoCard } from './components/DeviceInfoCard'
import { DeveloperCard } from './components/DeveloperCard'
import { BottomNav } from './components/BottomNav'
import { loadSettings, saveSettings } from './utils/settings'
import { useTheme } from './contexts/ThemeContext'

// Lazy-loaded pages to eliminate switch lag
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })))
const LogsPage = lazy(() => import('./components/LogsPage').then(m => ({ default: m.LogsPage })))
const TargetPage = lazy(() => import('./components/TargetPage').then(m => ({ default: m.TargetPage })))
const KeyboxPage = lazy(() => import('./components/KeyboxPage').then(m => ({ default: m.KeyboxPage })))
const AutoProxyPage = lazy(() => import('./components/AutoProxyPage').then(m => ({ default: m.AutoProxyPage })))
const SecurityPatchPage = lazy(() => import('./components/SecurityPatchPage').then(m => ({ default: m.SecurityPatchPage })))
const ToolPage = lazy(() => import('./components/ToolPage').then(m => ({ default: m.ToolPage })))
const AboutPage = lazy(() => import('./components/AboutPage').then(m => ({ default: m.AboutPage })))
const TestPage = lazy(() => import('./components/TestPage').then(m => ({ default: m.TestPage })))

type PageType = 'home' | 'settings' | 'logs' | 'target' | 'keybox' | 'autoproxy' | 'securitypatch' | 'tool' | 'about' | 'test'

function PageLoader() {
  const { colors } = useTheme()
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: colors.primaryContainer, borderTopColor: colors.primary }} />
    </div>
  )
}

function HomePage({ onNavigate }: { onNavigate: (page: PageType) => void }) {
  const { state, apps, keyboxes } = useApp()
  const proxiedCount = apps.filter(a => a.isProxied).length
  const keyboxCount = keyboxes.length

  const handleTargetClick = () => {
    if (state.proxyMode === 'auto') onNavigate('autoproxy')
    else onNavigate('target')
  }

  return (
    <div className="flex flex-col gap-4">
      <StatusCard proxyMode={state.proxyMode} />
      <NavCards
        appCount={proxiedCount}
        keyboxCount={keyboxCount}
        proxyMode={state.proxyMode}
        onTargetClick={handleTargetClick}
        onKeyboxClick={() => onNavigate('keybox')}
      />
      <DashboardCard
        serviceRunning={state.serviceRunning}
        trickyRunning={state.trickyRunning}
        proxyMode={state.proxyMode}
        integrityVerified={state.integrityVerified}
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
  const { apps, setAppProxied } = useApp()
  const [currentPage, setCurrentPage] = useState<PageType>('home')
  const [navigationMode, setNavigationMode] = useState<'bottom' | 'floating'>(
    () => loadSettings().navigationMode ?? 'bottom'
  )
  const [targetSearch, setTargetSearch] = useState('')
  const [showSystemApps, setShowSystemApps] = useState(true)

  const handleBack = () => (currentPage === 'logs' ? setCurrentPage('tool') : setCurrentPage('home'))

  const handleSelectAll = useCallback((includeSystem: boolean, mode: 'auto' | 'modify' | 'generate') => {
    const targets = includeSystem ? apps : apps.filter(a => !a.isSystem)
    targets.forEach(app => {
      if (!app.isProxied) setAppProxied(app.packageName, true, mode)
      else { setAppProxied(app.packageName, false); setTimeout(() => setAppProxied(app.packageName, true, mode), 0) }
    })
  }, [apps, setAppProxied])

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage onNavigate={setCurrentPage} />
      case 'target': return <TargetPage searchText={targetSearch} showSystemApps={showSystemApps} />
      case 'keybox': return <KeyboxPage />
      case 'settings':
        return <SettingsPage navigationMode={navigationMode} onNavigationModeChange={m => { setNavigationMode(m); saveSettings({ navigationMode: m }) }} />
      case 'logs': return <LogsPage />
      case 'autoproxy': return <AutoProxyPage />
      case 'securitypatch': return <SecurityPatchPage />
      case 'tool': return <ToolPage onNavigate={p => setCurrentPage(p as PageType)} />
      case 'about': return <AboutPage />
      case 'test': return <TestPage />
      default: return <HomePage onNavigate={setCurrentPage} />
    }
  }

  const getNavPage = (): string => {
    if (currentPage === 'target' || currentPage === 'keybox' || currentPage === 'autoproxy' || currentPage === 'securitypatch') return 'home'
    if (currentPage === 'logs') return 'tool'
    if (currentPage === 'about') return 'settings'
    if (currentPage === 'test') return 'tool'
    return currentPage
  }

  return (
    <div className="min-h-screen transition-colors duration-300 pb-20" style={{ backgroundColor: colors.background }}>
      <AppBar
        currentPage={currentPage}
        onBack={handleBack}
        onNavigate={setCurrentPage}
        navigationMode={navigationMode}
        searchText={targetSearch}
        onSearchChange={setTargetSearch}
        showSystemApps={showSystemApps}
        onShowSystemAppsChange={setShowSystemApps}
        onSelectAll={handleSelectAll}
      />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Suspense fallback={<PageLoader />}>
          {renderPage()}
        </Suspense>
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
