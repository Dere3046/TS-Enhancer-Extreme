import { execShell } from '../services/tseed'

const LOG_PATH = '/data/adb/ts_enhancer_extreme/log/webui_debug.log'
let _buffer: string[] = []
let _flushTimer: ReturnType<typeof setTimeout> | null = null
let _initialized = false

async function ensureDir() {
  if (_initialized) return
  _initialized = true
  try {
    await execShell('mkdir -p /data/adb/ts_enhancer_extreme/log')
    await execShell(`echo "--- debug start $(date +%Y-%m-%d_%H:%M:%S) ---" > ${LOG_PATH}`)
  } catch { /* ignore */ }
}

export function debugLog(tag: string, data?: Record<string, any>) {
  const ts = Date.now()
  const line = JSON.stringify({ ts, tag, ...data })
  _buffer.push(line)

  if (!_flushTimer) {
    _flushTimer = setTimeout(() => {
      _flushTimer = null
      flush()
    }, 50)
  }
}

async function flush() {
  if (_buffer.length === 0) return
  const lines = _buffer.splice(0, _buffer.length).join('\n')
  try {
    await ensureDir()
    const escaped = lines.replace(/'/g, "'\"'\"'")
    await execShell(`echo '${escaped}' >> ${LOG_PATH}`)
  } catch (e) {
    console.error('debug flush failed:', e)
  }
}

export async function forceFlush() {
  if (_flushTimer) {
    clearTimeout(_flushTimer)
    _flushTimer = null
  }
  await flush()
}
