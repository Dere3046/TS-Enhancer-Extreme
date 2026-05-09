import {
  MOCK_APPS, MOCK_USR_TXT, MOCK_SYS_TXT, MOCK_BLACKLIST, setMockBlacklist,
  MODULE_PROP, DEVICE_PROPS, MOCK_LOGS,
} from './data'

const MIN_DELAY = 50
const MAX_DELAY = 200

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function randomDelay(): Promise<void> {
  return delay(MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY))
}

const _vfs: Record<string, string> = {}

function vfsRead(path: string): string {
  switch (path) {
    case '/data/adb/modules/ts_enhancer_extreme/module.prop':
      return MODULE_PROP
    case '/data/adb/ts_enhancer_extreme/usr.txt':
      return MOCK_USR_TXT.join('\n')
    case '/data/adb/ts_enhancer_extreme/sys.txt':
      return MOCK_SYS_TXT.join('\n')
    case '/data/adb/ts_enhancer_extreme/target.txt':
      if (MOCK_BLACKLIST) {
        const excluded = new Set(MOCK_USR_TXT)
        return MOCK_APPS.filter(a => a.isSystem || !excluded.has(a.packageName))
          .map(a => a.packageName).join('\n')
      } else {
        const included = new Set(MOCK_SYS_TXT)
        return MOCK_APPS.filter(a => a.isSystem ? included.has(a.packageName) : !included.has(a.packageName))
          .map(a => a.packageName).join('\n')
      }
    case '/data/adb/ts_enhancer_extreme/log/log.log':
      return MOCK_LOGS
    case '/data/adb/tricky_store/keybox.xml':
      return _vfs[path] || `<?xml version="1.0" encoding="UTF-8"?><Keybox><Key algorithm="ECDSA"><PrivateKey format="pem">...mocked...</PrivateKey><CertificateChain><NumberOfCertificates>1</NumberOfCertificates><Certificate>...mocked...</Certificate></CertificateChain></Key></Keybox>`
    case '/data/adb/tricky_store/security_patch.txt':
      return _vfs[path] || '2024-05-01'
    default:
      return _vfs[path] || ''
  }
}

function vfsWrite(path: string, content: string) {
  _vfs[path] = content
}

function vfsExists(path: string): boolean {
  if (path === '/data/adb/tricky_store/keybox.xml') return true
  if (path === '/data/adb/ts_enhancer_extreme/blacklist') return MOCK_BLACKLIST
  return path in _vfs || path.includes('module.prop') || path.includes('.txt') || path.includes('.log')
}

export async function exec(cmd: string): Promise<{ errno: number; stdout: string; stderr: string }> {
  await randomDelay()

  const fullCmd = cmd.trim()

  if (fullCmd.startsWith('pm list packages -3')) {
    const pkgs = MOCK_APPS.filter(a => !a.isSystem).map(a => `package:${a.packageName}`).join('\n')
    return { errno: 0, stdout: pkgs, stderr: '' }
  }
  if (fullCmd.startsWith('pm list packages -s')) {
    const pkgs = MOCK_APPS.filter(a => a.isSystem).map(a => `package:${a.packageName}`).join('\n')
    return { errno: 0, stdout: pkgs, stderr: '' }
  }


  const getpropMatch = fullCmd.match(/^getprop\s+(.+)$/)
  if (getpropMatch) {
    const prop = getpropMatch[1].trim()
    return { errno: 0, stdout: DEVICE_PROPS[prop] || '', stderr: '' }
  }


  if (fullCmd === 'uname -r') {
    return { errno: 0, stdout: '5.15.123-android14-11-00001-g3a6f5b4e2a3f', stderr: '' }
  }


  if (fullCmd === 'getenforce') {
    return { errno: 0, stdout: 'Enforcing', stderr: '' }
  }


  const catMatch = fullCmd.match(/^cat\s+"(.+)"$/)
  if (catMatch) {
    const path = catMatch[1]
    return { errno: 0, stdout: vfsRead(path), stderr: '' }
  }


  const grepMatch = fullCmd.match(/^grep\s+"(.+)"\s+(.+)\s*\|\s*cut\s+-d=\s+-f2$/)
  if (grepMatch) {
    const pattern = grepMatch[1]
    const path = grepMatch[2].replace(/"/g, '')
    const content = vfsRead(path)
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.includes(pattern.replace(/\^/g, '').replace(/=/g, ''))) {
        const parts = line.split('=')
        if (parts.length > 1) return { errno: 0, stdout: parts[1], stderr: '' }
      }
    }
    return { errno: 0, stdout: '', stderr: '' }
  }


  const echoMatch = fullCmd.match(/^echo\s+'(.+)'\s+>\s+"(.+)"$/)
  if (echoMatch) {
    const content = echoMatch[1]
    const path = echoMatch[2]
    vfsWrite(path, content)
    return { errno: 0, stdout: '', stderr: '' }
  }


  const touchMatch = fullCmd.match(/^touch\s+"(.+)"$/)
  if (touchMatch) {
    const path = touchMatch[1]
    if (!vfsExists(path)) vfsWrite(path, '')
    if (path === '/data/adb/ts_enhancer_extreme/blacklist') setMockBlacklist(true)
    return { errno: 0, stdout: '', stderr: '' }
  }


  const rmMatch = fullCmd.match(/^rm\s+-f\s+"(.+)"$/)
  if (rmMatch) {
    const path = rmMatch[1]
    delete _vfs[path]
    if (path === '/data/adb/ts_enhancer_extreme/blacklist') setMockBlacklist(false)
    return { errno: 0, stdout: '', stderr: '' }
  }


  const cpMatch = fullCmd.match(/^cp\s+"(.+)"\s+"(.+)"$/)
  if (cpMatch) {
    vfsWrite(cpMatch[2], vfsRead(cpMatch[1]))
    return { errno: 0, stdout: '', stderr: '' }
  }


  const chmodMatch = fullCmd.match(/^chmod\s+(\d+)\s+"(.+)"$/)
  if (chmodMatch) {
    return { errno: 0, stdout: '', stderr: '' }
  }


  const ifMatch = fullCmd.match(/^if\s+\[\s+-f\s+"(.+)"\s+\];\s+then\s+echo\s+"exists";\s+else\s+echo\s+"not\s+exists";\s+fi$/)
  if (ifMatch) {
    const path = ifMatch[1]
    return { errno: 0, stdout: vfsExists(path) ? 'exists' : 'not exists', stderr: '' }
  }


  const tseedMatch = fullCmd.match(/^\/data\/adb\/modules\/ts_enhancer_extreme\/bin\/tseed\s+(.+)$/)
  if (tseedMatch) {
    const flag = tseedMatch[1].trim()

    if (flag === '--tsctl -state') return { errno: 0, stdout: 'true', stderr: '' }
    if (flag === '--tsctl -start') return { errno: 0, stdout: 'started', stderr: '' }
    if (flag === '--tsctl -stop') return { errno: 0, stdout: 'stopped', stderr: '' }

    if (flag === '--tseectl -state') return { errno: 0, stdout: 'true', stderr: '' }
    if (flag === '--tseectl -start') return { errno: 0, stdout: 'started', stderr: '' }
    if (flag === '--tseectl -stop') return { errno: 0, stdout: 'stopped', stderr: '' }

    if (flag === '--rootdetect') return { errno: 0, stdout: 'root_detected', stderr: '' }
    if (flag === '--staterefresh') return { errno: 0, stdout: 'refreshed', stderr: '' }
    if (flag === '--passpropstate') return { errno: 0, stdout: 'passed', stderr: '' }
    if (flag === '--passvbhash') return { errno: 0, stdout: 'passed', stderr: '' }
    if (flag === '--conflictappcheck') return { errno: 0, stdout: 'no_conflict', stderr: '' }
    if (flag === '--conflictmodcheck') return { errno: 0, stdout: 'no_conflict', stderr: '' }
    if (flag === '--conflictmodcheck -s') return { errno: 0, stdout: 'no_conflict_service', stderr: '' }

    if (flag === '--packagelistupdate') {

      await delay(300)
      return { errno: 0, stdout: 'updated', stderr: '' }
    }

    if (flag === '--securitypatchpropsync') return { errno: 0, stdout: 'synced', stderr: '' }
    if (flag === '--securitypatchdatefetch') return { errno: 0, stdout: '2024-05-01', stderr: '' }

    if (flag.startsWith('--stealkeybox')) {
      vfsWrite('/data/adb/tricky_store/keybox.xml', `<?xml version="1.0" encoding="UTF-8"?><Keybox><Key algorithm="ECDSA"><PrivateKey format="pem">-----BEGIN EC PRIVATE KEY-----\nMOCKED_KEY_${Date.now()}\n-----END EC PRIVATE KEY-----\u003c/PrivateKey><CertificateChain><NumberOfCertificates>1</NumberOfCertificates><Certificate>-----BEGIN CERTIFICATE-----\nMOCKED_CERT_${Date.now()}\n-----END CERTIFICATE-----\u003c/Certificate></CertificateChain></Key></Keybox>`)
      return { errno: 0, stdout: 'keybox_stolen', stderr: '' }
    }

    return { errno: 1, stdout: '', stderr: `Unknown tseed flag: ${flag}` }
  }

  console.warn('[MOCK] Unhandled command:', fullCmd)
  return { errno: 1, stdout: '', stderr: `Command not implemented in mock: ${fullCmd}` }
}

export function toast(message: string) {
  console.log('[TOAST]', message)

}

export function fullScreen(full: boolean) {
  if (full) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}


export function injectMockKsu() {
  ;(window as any).ksu = {
    exec,
    toast,
    fullScreen,
    listUserPackages: () => JSON.stringify(MOCK_APPS.filter(a => !a.isSystem).map(a => a.packageName)),
    listSystemPackages: () => JSON.stringify(MOCK_APPS.filter(a => a.isSystem).map(a => a.packageName)),
    getPackagesInfo: (pkgs: string) => {
      try {
        const arr: string[] = JSON.parse(pkgs)
        return JSON.stringify(arr.map(pkg => {
          const app = MOCK_APPS.find(a => a.packageName === pkg)
          return {
            packageName: pkg,
            appLabel: app?.appName || pkg,
            versionName: '1.0.0',
            versionCode: 100,
          }
        }))
      } catch {
        return '[]'
      }
    },
  }
}

