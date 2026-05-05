/**
 * TSeed API — KernelSU WebUI
 * All exec calls funnel through a single execShell() wrapper.
 */
declare global {
  interface Window {
    ksu?: {
      exec: (cmd: string, options?: Record<string, unknown>) => Promise<{ errno: number; stdout: string; stderr: string }>
      toast: (msg: string) => void
      fullScreen: (v: boolean) => void
    }
  }
}

type ExecResult = { errno: number; stdout: string; stderr: string }
type ExecFn = (cmd: string) => Promise<ExecResult>

const TSEED_BIN = '/data/adb/modules/ts_enhancer_extreme/bin/tseed'

let _execImpl: ExecFn | null = null
let _execReady = false
let _execInitialized = false

export function isExecReady() { return _execReady }

function createKernelSUExec(): ExecFn {
  const ksu = typeof window !== 'undefined'
    ? (window.ksu ?? (window as any).KernelSU ?? (window as any).ksud)
    : null
  if (!ksu?.exec) throw new Error('KernelSU exec API not available')
  if (!_execInitialized) { console.info('[TSEE] KSU exec initialized'); _execInitialized = true }
  return async (cmd: string) => {
    const result = await ksu.exec(cmd)
    if (typeof result === 'string') return { errno: 0, stdout: result, stderr: '' }
    return { errno: result.errno ?? 0, stdout: result.stdout ?? '', stderr: result.stderr ?? '' }
  }
}

function getExecImpl(): ExecFn {
  if (!_execImpl) _execImpl = createKernelSUExec()
  return _execImpl
}

async function execShell(cmd: string): Promise<string> {
  const exec = getExecImpl()
  const { errno, stdout, stderr } = await exec(cmd)
  if (errno !== 0) {
    console.error('[TSEE] Exec FAIL', { cmd: cmd.slice(-50), errno, stderr: String(stderr).slice(0, 100) })
    throw new Error(stderr || `Command failed with exit code ${errno}`)
  }
  if (!stdout.trim()) {
    await new Promise(r => setTimeout(r, 300))
    const r2 = await exec(cmd)
    if (r2.errno === 0) {
      _execReady = true
      return r2.stdout
    }
    console.warn('[TSEE] Exec empty stdout', cmd.slice(-50))
  }
  _execReady = true
  return stdout
}

export function showToast(message: string) {
  if (typeof window === 'undefined' || !window.ksu?.toast) return
  window.ksu.toast(message)
}

export function requestFullScreen(full: boolean) {
  if (typeof window === 'undefined' || !window.ksu?.fullScreen) return
  window.ksu.fullScreen(full)
}

export const TSeed = {
  async exec(namespace: string, action: string, ...args: string[]): Promise<string> {
    const argStr = args.length > 0
      ? ' ' + args.map(a => `"${a.replace(/"/g, '\\"')}"`).join(' ')
      : ''
    return execShell(`${TSEED_BIN} ${namespace} ${action}${argStr}`)
  },

  system: {
    async ping() { return TSeed.exec('system', 'ping') },
    async settingsGet() { return TSeed.exec('system', 'settingsget') },
    async settingsSet(json: string) { return TSeed.exec('system', 'settingsset', json) },
    async autoproxyState() { return TSeed.exec('system', 'autoproxystate') },
    async autoproxyEnable() { return TSeed.exec('system', 'autoproxyenable') },
    async autoproxyDisable() { return TSeed.exec('system', 'autoproxydisable') },
    async rootDetect() { return TSeed.exec('system', 'rootdetect') },
    async stateRefresh() { return TSeed.exec('system', 'staterefresh') },
    async passVBHash() { return TSeed.exec('system', 'passvbhash') },
    async vbhashGet() { return TSeed.exec('system', 'vbhashget') },
    async vbhashApply(hash: string) { return TSeed.exec('system', 'vbhashapply', hash) },
    async vbhashPersist(hash: string) { return TSeed.exec('system', 'vbhashpersist', hash) },
    async vbhashClear() { return TSeed.exec('system', 'vbhashclear') },
    async vbhashState() { return TSeed.exec('system', 'vbhashstate') },
    async passPropState() { return TSeed.exec('system', 'passpropstate') },
    async conflictAppCheck() { return TSeed.exec('system', 'conflictappcheck') },
    async conflictModCheck(mode = '') { return TSeed.exec('system', 'conflictmodcheck', mode) },
    async packageListUpdate(mode = '') { return TSeed.exec('system', 'packagelistupdate', mode) },
    async clearCache() { return TSeed.exec('system', 'clearcache') },
    async securityPatchSync() { return TSeed.exec('system', 'securitypatchsync') },
    async securityPatchGet() { return TSeed.exec('system', 'securitypatchget') },
    async securityPatchSet(config: string) { return TSeed.exec('system', 'securitypatchset', config) },
  },

  service: {
    async test() { return TSeed.exec('service', 'test') },
    async proxy(action: string) { return TSeed.exec('service', 'proxy', action) },
  },

  app: {
    async listNames(filter = '') { return TSeed.exec('app', 'list-names', filter) },
    async info(...packages: string[]) { return TSeed.exec('app', 'info', ...packages) },
    async add(pkg: string, mode = 'auto') { return TSeed.exec('app', 'add', pkg, mode) },
    async remove(pkg: string) { return TSeed.exec('app', 'remove', pkg) },
    async config(action: string, ...args: string[]) { return TSeed.exec('app', 'config', action, ...args) },
    async icon(pkg: string) { return TSeed.exec('app', 'icon', pkg) },
  },

  proxyconfig: {
    async getMode() { return TSeed.exec('proxyconfig', 'mode') },
    async setMode(mode: string) { return TSeed.exec('proxyconfig', 'mode', mode) },
    async list(type: string) { return TSeed.exec('proxyconfig', 'list', type) },
    async add(type: string, pkg: string) { return TSeed.exec('proxyconfig', 'add', type, pkg) },
    async remove(type: string, pkg: string) { return TSeed.exec('proxyconfig', 'remove', type, pkg) },
  },

  keybox: {
    async exists() { return TSeed.exec('keybox', 'exists') },
    async list() { return TSeed.exec('keybox', 'list') },
    async listJson() { return TSeed.exec('keybox', 'list-json') },
    async enable(id: string) { return TSeed.exec('keybox', 'enable', id) },
    async disable(id: string) { return TSeed.exec('keybox', 'disable', id) },
    async remove(id: string) { return TSeed.exec('keybox', 'remove', id) },
    async import(sourcePath: string) { return TSeed.exec('keybox', 'import', sourcePath) },
    async backup() { return TSeed.exec('keybox', 'backup') },
    async restore(path: string) { return TSeed.exec('keybox', 'restore', path) },
    async delete() { return TSeed.exec('keybox', 'delete') },
    async deleteBackup(path: string) { return TSeed.exec('keybox', 'delete-backup', path) },
  },

  log: {
    async read() { return TSeed.exec('log', 'read') },
  },

  device: {
    async getProp(prop: string) { return execShell(`getprop ${prop}`) },
    async kernelVersion() { return execShell('uname -r') },
    async moduleInfo() { return execShell(`cat /data/adb/modules/ts_enhancer_extreme/module.prop`) },
    async versionCode() { return execShell(`grep "^versionCode=" /data/adb/modules/ts_enhancer_extreme/module.prop | cut -d= -f2`) },
  },
}

export const Shell = {
  async exec(cmd: string): Promise<string> { return execShell(cmd) },
}
