import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TSeed, showToast, requestFullScreen } from '../services/tseed'

describe('TSeed service', () => {
  const mockExec = vi.fn()

  beforeEach(() => {
    window.ksu = {
      exec: mockExec,
      toast: vi.fn(),
      fullScreen: vi.fn(),
    }
    mockExec.mockReset()
  })

  afterEach(() => {
    delete (window as any).ksu
  })

  describe('exec', () => {
    it('should execute command with namespace and action', async () => {
      mockExec.mockResolvedValue({ errno: 0, stdout: 'pong', stderr: '' })
      const result = await TSeed.system.ping()
      expect(mockExec).toHaveBeenCalledWith('/data/adb/modules/ts_enhancer_extreme/bin/tseed system ping')
      expect(result).toBe('pong')
    })

    it('should pass arguments correctly', async () => {
      mockExec.mockResolvedValue({ errno: 0, stdout: 'OK', stderr: '' })
      await TSeed.system.vbhashApply('aabbccdd11223344556677889900aabbccdd11223344556677889900aabbccdd')
      expect(mockExec).toHaveBeenCalledWith(
        '/data/adb/modules/ts_enhancer_extreme/bin/tseed system vbhashapply "aabbccdd11223344556677889900aabbccdd11223344556677889900aabbccdd"'
      )
    })

    it('should quote arguments with spaces (JSON)', async () => {
      mockExec.mockResolvedValue({ errno: 0, stdout: 'OK', stderr: '' })
      await TSeed.system.settingsSet('{"theme":"dark","lang":"zh"}')
      expect(mockExec).toHaveBeenCalledWith(
        '/data/adb/modules/ts_enhancer_extreme/bin/tseed system settingsset "{\\"theme\\":\\"dark\\",\\"lang\\":\\"zh\\"}"'
      )
    })

    it('should handle empty stdout with retry', async () => {
      mockExec
        .mockResolvedValueOnce({ errno: 0, stdout: '', stderr: '' })
        .mockResolvedValueOnce({ errno: 0, stdout: 'pong', stderr: '' })
      const result = await TSeed.system.ping()
      expect(mockExec).toHaveBeenCalledTimes(2)
      expect(result).toBe('pong')
    })

    it('should throw on non-zero exit', async () => {
      mockExec.mockResolvedValue({ errno: 1, stdout: '', stderr: 'permission denied' })
      await expect(TSeed.system.ping()).rejects.toThrow('permission denied')
    })
  })

  describe('system namespace', () => {
    it('should call all system methods', async () => {
      mockExec.mockResolvedValue({ errno: 0, stdout: 'OK', stderr: '' })

      await TSeed.system.ping()
      expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('system ping'))

      await TSeed.system.settingsGet()
      expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('system settingsget'))

      await TSeed.system.autoproxyEnable()
      expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('system autoproxyenable'))
    })
  })

  describe('service namespace', () => {
    it('should call service test', async () => {
      mockExec.mockResolvedValue({ errno: 0, stdout: 'tseet=true,tricky=false', stderr: '' })
      const result = await TSeed.service.test()
      expect(result).toBe('tseet=true,tricky=false')
    })

    it('should call proxy with action', async () => {
      mockExec.mockResolvedValue({ errno: 0, stdout: 'OK', stderr: '' })
      await TSeed.service.proxy('sync')
      expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('service proxy'))
    })
  })

  describe('app namespace', () => {
    it('should call app methods with arguments', async () => {
      mockExec.mockResolvedValue({ errno: 0, stdout: '[]', stderr: '' })

      await TSeed.app.listNames()
      expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('app list-names'))

      await TSeed.app.add('com.test.app', 'auto')
      expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('app add "com.test.app" "auto"'))

      await TSeed.app.remove('com.test.app')
      expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('app remove "com.test.app"'))
    })
  })

  describe('keybox namespace', () => {
    it('should call keybox methods', async () => {
      mockExec.mockResolvedValue({ errno: 0, stdout: 'yes', stderr: '' })

      const exists = await TSeed.keybox.exists()
      expect(exists).toBe('yes')

      await TSeed.keybox.import('/sdcard/keybox.xml')
      expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('keybox import "/sdcard/keybox.xml"'))
    })
  })

  describe('device namespace', () => {
    it('should execute shell commands directly', async () => {
      mockExec.mockResolvedValue({ errno: 0, stdout: 'Pixel 7', stderr: '' })
      const result = await TSeed.device.getProp('ro.product.model')
      expect(mockExec).toHaveBeenCalledWith('getprop ro.product.model')
      expect(result).toBe('Pixel 7')
    })
  })

  describe('utility functions', () => {
    it('should show toast when ksu available', () => {
      showToast('Hello')
      expect(window.ksu!.toast).toHaveBeenCalledWith('Hello')
    })

    it('should request fullscreen', () => {
      requestFullScreen(true)
      expect(window.ksu!.fullScreen).toHaveBeenCalledWith(true)
    })

    it('should handle missing ksu gracefully', () => {
      delete (window as any).ksu
      expect(() => showToast('test')).not.toThrow()
      expect(() => requestFullScreen(true)).not.toThrow()
    })
  })
})
