import { exec, toast, fullScreen } from 'kernelsu'

// ── Log Event System ──────────────────────────────────────────
export interface LogEntry {
  id: number
  timestamp: number
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
}

type LogListener = (entry: LogEntry) => void

let _logId = 0
const _logListeners: LogListener[] = []

export function addLogListener(listener: LogListener) {
  _logListeners.push(listener)
}

export function removeLogListener(listener: LogListener) {
  const idx = _logListeners.indexOf(listener)
  if (idx >= 0) _logListeners.splice(idx, 1)
}

export function emitLog(message: string, level: LogEntry['level'] = 'info') {
  const entry: LogEntry = {
    id: ++_logId,
    timestamp: Date.now(),
    level,
    message,
  }
  _logListeners.forEach(fn => {
    try { fn(entry) } catch { /* ignore */ }
  })
}

// ── Core exec ─────────────────────────────────────────────────

const TSEED_BIN = '/data/adb/modules/ts_enhancer_extreme/bin/tseed'

let _execReady = false

export function isExecReady() { return _execReady }

export async function execShell(cmd: string, timeout = 10000): Promise<string> {
  emitLog(`$ ${cmd}`, 'info')

  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const execPromise = exec(cmd).then(({ errno, stdout, stderr }) => {
    if (timeoutId) clearTimeout(timeoutId)

    const fullOutput = stdout + (stderr ? `\n${stderr}` : '')

    if (errno === 0) {
      _execReady = true
      if (stdout.trim()) {
        emitLog(stdout.slice(0, 200), 'success')
      }
      return fullOutput
    } else {
      emitLog(stderr || `Exit code ${errno}`, 'error')
      throw fullOutput || `Command failed with exit code ${errno}`
    }
  })

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      emitLog(`Command timeout: ${cmd}`, 'error')
      reject(new Error(`Timeout after ${timeout}ms: ${cmd}`))
    }, timeout)
  })

  return Promise.race([execPromise, timeoutPromise])
}

export function showToast(message: string) {
  toast(message)
}

export function requestFullScreen(full: boolean) {
  fullScreen(full)
}

// ── Paths ─────────────────────────────────────────────────────

export const Paths = {
  MODULE: '/data/adb/modules/ts_enhancer_extreme/',
  TSEE_CONFIG: '/data/adb/ts_enhancer_extreme/',
  TS_CONFIG: '/data/adb/tricky_store/',
  USR_TXT: '/data/adb/ts_enhancer_extreme/usr.txt',
  SYS_TXT: '/data/adb/ts_enhancer_extreme/sys.txt',
  BLACKLIST: '/data/adb/ts_enhancer_extreme/blacklist',
  TARGET_TXT: '/data/adb/ts_enhancer_extreme/target.txt',
  KEYBOX: '/data/adb/tricky_store/keybox.xml',
  KEYBOX_BACKUP: '/data/adb/tricky_store/keybox_backup/',
  SECURITY_PATCH: '/data/adb/tricky_store/security_patch.txt',
  LOG: '/data/adb/ts_enhancer_extreme/log/log.log',
}

// ── TSeed upstream CLI wrappers ─────────────────────────────────

export const TSeed = {
  tsctl(action: 'start' | 'stop' | 'state') {
    return execShell(`${TSEED_BIN} --tsctl -${action}`)
  },

  tseectl(action: 'start' | 'stop' | 'state') {
    return execShell(`${TSEED_BIN} --tseectl -${action}`)
  },

  rootDetect() {
    return execShell(`${TSEED_BIN} --rootdetect`)
  },

  staterefresh() {
    return execShell(`${TSEED_BIN} --staterefresh`)
  },

  passpropstate() {
    return execShell(`${TSEED_BIN} --passpropstate`)
  },

  passvbhash() {
    return execShell(`${TSEED_BIN} --passvbhash`)
  },

  conflictappcheck() {
    return execShell(`${TSEED_BIN} --conflictappcheck`)
  },

  conflictmodcheck(mode?: 'servicemode') {
    const extra = mode === 'servicemode' ? ' -s' : ''
    return execShell(`${TSEED_BIN} --conflictmodcheck${extra}`)
  },

  packagelistupdate() {
    return execShell(`${TSEED_BIN} --packagelistupdate`)
  },

  securitypatchpropsync() {
    return execShell(`${TSEED_BIN} --securitypatchpropsync`)
  },

  securitypatchdatefetch() {
    return execShell(`${TSEED_BIN} --securitypatchdatefetch`)
  },

  stealkeybox(source: 'a' | 'b' | 'c') {
    return execShell(`${TSEED_BIN} --stealkeybox -${source}`)
  },

  device: {
    getProp(prop: string) { return execShell(`getprop ${prop}`) },
    kernelVersion() { return execShell('uname -r') },
    moduleInfo() { return execShell(`cat ${Paths.MODULE}module.prop`) },
    versionCode() { return execShell(`grep "^versionCode=" ${Paths.MODULE}module.prop | cut -d= -f2`) },
    version() { return execShell(`grep "^version=" ${Paths.MODULE}module.prop | cut -d= -f2`) },
  },

  file: {
    read(path: string) { return execShell(`cat "${path}"`) },
    write(path: string, content: string) {
      const escaped = content.replace(/'/g, "'\"'\"'")
      return execShell(`echo '${escaped}' > "${path}"`)
    },
    exists(path: string) { return execShell(`if [ -f "${path}" ]; then echo "exists"; else echo "not exists"; fi`) },
    touch(path: string) { return execShell(`touch "${path}"`) },
    rm(path: string) { return execShell(`rm -f "${path}"`) },
    cp(src: string, dst: string) { return execShell(`cp "${src}" "${dst}"`) },
    chmod(path: string, mode: string) { return execShell(`chmod ${mode} "${path}"`) },
  },

  pm: {
    listThirdParty() { return execShell('pm list packages -3') },
    listSystem() { return execShell('pm list packages -s') },
  },

  log: {
    read() { return execShell(`cat ${Paths.LOG}`) },
  },

  system: {
    securityPatchGet() {
      return execShell(`cat ${Paths.SECURITY_PATCH}`)
    },
    securityPatchSet(config: string) {
      return execShell(`echo '${config.replace(/'/g, "'\"'\"'")}' > ${Paths.SECURITY_PATCH}`)
    },
    securityPatchSync() {
      return execShell(`${TSEED_BIN} --securitypatchpropsync`)
    },
  },
}
