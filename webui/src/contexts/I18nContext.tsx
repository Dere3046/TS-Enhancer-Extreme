import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { loadSettings, saveSettings } from '../utils/settings'

interface I18nContextType {
  lang: string
  t: (key: string, params?: Record<string, string>) => string
  setLang: (lang: string) => void
}

const translations: Record<string, Record<string, string>> = {
  zh: {
    // App
    'app.name': 'TS Enhancer Extreme',
    
    // Navigation
    'nav.home': '主页',
    'nav.settings': '设置',
    'nav.tool': '工具',
    'nav.apps': '应用',
    'nav.keybox': 'Keybox',
    
    // Status
    'status.running': '运行中',
    'status.stopped': '已停止',
    'status.unknown': '未知',
    'status.checking': '检测中',
    
    // Card Home
    'card.home.working': '运行中',
    'card.home.stopped': '已停止',
    'card.home.app_management': '应用管理',
    'card.home.keybox_management': 'Keybox 管理',
    'card.home.device_info': '设备信息',
    'card.home.module_info': '模块信息',
    'card.home.author': '作者',
    'card.home.app_count': '个应用',
    'card.home.app_proxy_auto': '应用代理',
    'card.home.keybox_status': '个备份',
    
    // Home
    'home.device_model': '设备型号',
    'home.android_sdk': 'Android 版本',
    'home.abi': 'ABI',
    'home.dashboard': '仪表盘',
    'home.view_logs': '查看日志',
    'home.clear_cache': '清除缓存',
    'home.proxy_mode_auto': '自动代理已启用',
    'home.proxy_mode_manual': '手动代理模式',
    'home.show_more': '显示更多',
    'home.show_less': '收起',
    'home.search': '搜索',
    
    // Dashboard
    'dashboard.app_list_proxy': '应用列表代理',
    'dashboard.proxy_mode_auto': '自动',
    'dashboard.proxy_mode_manual': '手动',
    'dashboard.service_status': 'TSEET 服务',
    'dashboard.tricky_status': 'Tricky Store',
    'dashboard.proxy_status': '代理服务',
    'dashboard.proxy_active': '活跃',
    'dashboard.proxy_inactive': '未激活',
    'dashboard.integrity_failed': '未通过完整性校验',
    'dashboard.integrity_desc': '模块文件可能被篡改，功能受限',
    
    // Settings
    'settings.title': '设置',
    'settings.personalization': '个性化',
    'settings.theme_color': '主题颜色',
    'settings.theme_color_desc': '切换浅色/深色模式',
    'settings.language': '语言',
    'settings.navigation_mode': '导航方式',
    'settings.nav_bottom': '底部导航',
    'settings.nav_floating': '非底部导航',
    'settings.tools': '工具',
    'settings.clear_cache': '清除缓存',
    'settings.ui_mode': '界面模式',
    'settings.proxy_mode': '代理模式',
    'settings.auto_proxy': '自动代理 (TSEET)',
    'settings.auto_proxy_desc': '通过 TSEED 启用 TSEET 自动代理',
    'settings.manual_proxy': '手动代理',
    'settings.manual_proxy_desc': '手动选择需要代理的应用',
    
    // Theme
    'theme.default': '默认',
    'theme.monet': '莫奈',
    'theme.monet_prompt': '请输入莫奈主题的种子颜色（HEX格式）：',
    'theme.monet_applied': '莫奈主题已应用',
    'theme.default_applied': '已切换到默认主题',
    'theme.seed_color': '种子颜色',
    'theme.apply': '应用',
    'theme.custom': '自定义',
    'theme.light': '浅色',
    'theme.dark': '深色',
    
    // Logs
    'logs.title': '日志',
    'logs.empty': '暂无日志记录',
    'logs.back': '返回',
    'logs.module_log': '模块日志',
    'logs.console_log': '控制台',
    
    // Common
    'common.back': '返回',
    'common.version': '版本',
    'common.confirm': '确定',
    'common.cancel': '取消',
    'common.save': '保存',
    'common.delete': '删除',
    'common.refresh': '刷新',
    'common.loading': '加载中...',
    'common.success': '成功',
    'common.failed': '失败',
    'common.hash': '哈希',
    'common.path': '路径',
    
    // Keybox
    'keybox.title': 'Keybox 管理',
    'keybox.import': '安装',
    'keybox.backup': '备份',
    'keybox.restore': '恢复',
    'keybox.delete': '删除',
    'keybox.enabled': '已启用',
    'keybox.disabled': '已禁用',
    'keybox.install': '安装',
    'keybox.backup_count': '个备份',
    'keybox.empty_folder': '暂无 Keybox',
    'keybox.import_prompt': '请输入 keybox 文件的绝对路径：',
    'keybox.import_default_path': '/storage/emulated/0/Download/keybox.xml',
    'keybox.import_success': '导入成功',
    'keybox.import_failed': '导入失败',
    'keybox.delete_confirm': '确定要删除这个 Keybox 吗？',
    'keybox.delete_success': '删除成功',
    'keybox.delete_failed': '删除失败',
    'keybox.enable_failed': '启用失败',
    
    // Apps
    'apps.title': '应用管理',
    'apps.search': '搜索应用...',
    'apps.selected': '已选择',
    'apps.selected_suffix': '个',
    'apps.no_results': '未找到应用',
    'apps.total': '共',
    'apps.total_suffix': '个应用',
    'apps.select_mode': '选择模式',
    'apps.mode_auto': '自动',
    'apps.mode_gen': '生成',
    'apps.mode_mod': '修改',
    'apps.mode_auto_desc': '自动选择证书模式',
    'apps.mode_gen_desc': '强制生成新证书',
    'apps.mode_mod_desc': '修改现有证书',
    'apps.type_normal': '正常',
    'apps.type_exclude': '排除',
    'apps.type_force': '强制',
    'apps.type_normal_desc': '正常代理',
    'apps.type_exclude_desc': '排除代理',
    'apps.type_force_desc': '强制模式',
    'apps.removed': '已移除',
    'apps.added': '已添加',
    'apps.mode_changed': '模式已更改',
    'apps.save_failed': '保存失败',
    'apps.select_all': '全选',
    'apps.include_system_apps': '包含系统应用',
    'apps.cert_mode': '证书模式',
    'target.auto_proxy_active': '当前为自动代理模式，手动配置不生效',
    
    // Dev
    'dev.service_control': '服务控制',
    'dev.start_service': '启动服务',
    'dev.stop_service': '停止服务',
    
    // Toast
    'toast.cache_cleared': '缓存已清除',
    
    // Logger
    'logger.read_failed': '无法读取日志文件',
    'logger.no_log_file': '无日志文件',
    
    // AutoProxy
    'autoproxy.title': '自动代理管理',
    'autoproxy.mode': '代理模式',
    'autoproxy.mode_user_only': '仅用户应用',
    'autoproxy.mode_sys_whitelist': '系统应用白名单',
    'autoproxy.mode_sys_blacklist': '系统应用黑名单',
    'autoproxy.mode_custom': '自定义',
    'autoproxy.sys_whitelist': '系统白名单',
    'autoproxy.sys_blacklist': '系统黑名单',
    'autoproxy.usr_blacklist': '用户黑名单',
    'autoproxy.exclude': '排除列表',
    'autoproxy.add': '添加',
    'autoproxy.remove': '移除',
    'autoproxy.empty': '列表为空',
    'autoproxy.enter_pkg': '输入包名',
    // VerifiedBootHash
    'settings.verified_boot_hash': 'VerifiedBootHash',
    'settings.verified_boot_hash_desc': '修正已验证启动哈希属性',
    'settings.vbhash_get': '获取 Hash',
    'settings.vbhash_apply_once': '应用一次',
    'settings.vbhash_persist': '持久化应用',
    'settings.vbhash_clear': '清除',
    'settings.vbhash_empty': '未获取',
    'settings.vbhash_applied': 'VerifiedBootHash 已应用',
    'settings.vbhash_persisted': 'VerifiedBootHash 已持久化，下次启动将自动应用',
    'settings.vbhash_cleared': 'VerifiedBootHash 已清除',
    'settings.vbhash_fetch_failed': '获取失败',
    'settings.vbhash_invalid': '无效的 Hash',
    'settings.vbhash_persist_hint': '应用一次：仅本次生效；持久化应用：写入文件并在每次启动时自动重新应用。',
    // Security Patch
    'settings.security_patch': '安全补丁时间',
    'settings.security_patch_desc': '修改 KeyAttestation 返回的安全补丁日期',
    'settings.enter_patch_date': '输入安全补丁日期 (YYYY-MM-DD)',
    'settings.patch_updated': '补丁时间已更新',
    'settings.patch_synced': '补丁已同步',
    'settings.patch_invalid': '日期格式无效',
    'settings.patch_mode_simple': '简单模式',
    'settings.patch_mode_advanced': '高级模式',
    'settings.patch_per_partition': '按分区配置',
    'settings.patch_format_hint': '格式：YYYY-MM-DD 或 YYYYMMDD，应用到所有分区',
    'settings.current_config': '当前配置',
    'settings.patch_help_title': '说明',
    'settings.patch_help_simple': '简单模式：输入一个日期，应用到所有支持的分区',
    'settings.patch_help_advanced': '高级模式：为每个分区单独设置日期',
    'settings.patch_help_no': 'no — 不修改该分区的安全补丁级别',
    'settings.patch_help_prop': 'prop — 使用系统实际属性的值',
    // Proxy
    'proxy.title': '代理配置',
    // FileBrowser
    'filebrowser.title': '浏览文件',
    'filebrowser.loading': '加载中...',
    'filebrowser.read_error': '无法读取目录',
    'filebrowser.no_xml': '此目录下没有 .xml 文件',
    'filebrowser.empty': '空目录',
    'filebrowser.show_all': '显示全部文件',
    'filebrowser.filter_xml': '过滤 .xml',
    'filebrowser.download': '下载',
    'filebrowser.sdcard': 'SD 卡',
    'filebrowser.adb': 'ADB',
    // About
    'about.module': '关于模块',
    'about.name': '名称',
    'about.license': '许可证',
    'about.contributors': '贡献者',
    'about.developer': '开发者',
    // Tool
    'tool.service_control': '服务控制',
    'tool.service_status': '服务状态',
    'tool.start_proxy': '启动代理',
    'tool.stop_proxy': '停止代理',
    'tool.sync_targets': '同步目标',
    'tool.refresh_state': '刷新状态',
    'tool.tseet_service': 'TSEET 服务',
    'tool.tricky_status': 'Tricky Store',
    'tool.proxy_status': '代理服务',
    'tool.integrity': '完整性校验',
    'tool.verified': '已通过',
    'tool.verification_failed': '未通过',
    'tool.maintenance': '维护',
  },
  en: {
    // App
    'app.name': 'TS Enhancer Extreme',
    
    // Navigation
    'nav.home': 'Home',
    'nav.settings': 'Settings',
    'nav.tool': 'Tool',
    'nav.apps': 'Apps',
    'nav.keybox': 'Keybox',
    
    // Status
    'status.running': 'Running',
    'status.stopped': 'Stopped',
    'status.unknown': 'Unknown',
    'status.checking': 'Checking',
    
    // Card Home
    'card.home.working': 'Working',
    'card.home.stopped': 'Stopped',
    'card.home.app_management': 'App Management',
    'card.home.keybox_management': 'Keybox Management',
    'card.home.device_info': 'Device Info',
    'card.home.module_info': 'Module Info',
    'card.home.author': 'Author',
    'card.home.app_count': 'apps',
    'card.home.app_proxy_auto': 'App Proxy',
    'card.home.keybox_status': 'backups',
    
    // Home
    'home.device_model': 'Device Model',
    'home.android_sdk': 'Android SDK',
    'home.abi': 'ABI',
    'home.dashboard': 'Dashboard',
    'home.view_logs': 'View Logs',
    'home.clear_cache': 'Clear Cache',
    'home.proxy_mode_auto': 'Auto proxy enabled',
    'home.proxy_mode_manual': 'Manual proxy mode',
    'home.show_more': '显示更多',
    'home.show_less': '收起',
    'home.search': 'Search',
    
    // Dashboard
    'dashboard.app_list_proxy': 'App List Proxy',
    'dashboard.proxy_mode_auto': 'Auto',
    'dashboard.proxy_mode_manual': 'Manual',
    'dashboard.service_status': 'TSEET Service',
    'dashboard.tricky_status': 'Tricky Store',
    'dashboard.proxy_status': 'Proxy Service',
    'dashboard.proxy_active': 'Active',
    'dashboard.proxy_inactive': 'Inactive',
    'dashboard.integrity_failed': 'Integrity Check Failed',
    'dashboard.integrity_desc': 'Module files may be tampered, functionality limited',
    
    // Settings
    'settings.title': 'Settings',
    'settings.personalization': 'Personalization',
    'settings.theme_color': 'Theme Color',
    'settings.theme_color_desc': 'Toggle light/dark mode',
    'settings.language': 'Language',
    'settings.navigation_mode': 'Navigation',
    'settings.nav_bottom': 'Bottom Navigation',
    'settings.nav_floating': 'Floating',
    'settings.tools': 'Tools',
    'settings.clear_cache': 'Clear Cache',
    'settings.ui_mode': 'UI Mode',
    'settings.proxy_mode': 'Proxy Mode',
    'settings.auto_proxy': 'Auto Proxy (TSEET)',
    'settings.auto_proxy_desc': 'Enable TSEET auto-proxy via TSEED',
    'settings.manual_proxy': 'Manual Proxy',
    'settings.manual_proxy_desc': 'Manually select apps to proxy',
    
    // Theme
    'theme.default': 'Default',
    'theme.monet': 'Monet',
    'theme.monet_prompt': 'Enter Monet seed color (HEX):',
    'theme.monet_applied': 'Monet theme applied',
    'theme.default_applied': 'Switched to default theme',
    'theme.seed_color': 'Seed Color',
    'theme.apply': 'Apply',
    'theme.custom': 'Custom',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    
    // Logs
    'logs.title': 'Logs',
    'logs.empty': 'No logs recorded',
    'logs.back': 'Back',
    'logs.module_log': 'Module Log',
    'logs.console_log': 'Console',
    
    // Common
    'common.back': 'Back',
    'common.version': 'Version',
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.refresh': 'Refresh',
    'common.loading': 'Loading...',
    'common.success': 'Success',
    'common.failed': 'Failed',
    'common.hash': 'Hash',
    'common.path': 'Path',
    
    // Keybox
    'keybox.title': 'Keybox Manager',
    'keybox.import': 'Install',
    'keybox.backup': 'Backup',
    'keybox.restore': 'Restore',
    'keybox.delete': 'Delete',
    'keybox.enabled': 'Enabled',
    'keybox.disabled': 'Disabled',
    'keybox.install': 'Install',
    'keybox.backup_count': 'backups',
    'keybox.empty_folder': 'No Keybox found',
    'keybox.import_prompt': 'Enter absolute path to keybox file:',
    'keybox.import_default_path': '/storage/emulated/0/Download/keybox.xml',
    'keybox.import_success': 'Import successful',
    'keybox.import_failed': 'Import failed',
    'keybox.delete_confirm': 'Are you sure you want to delete this Keybox?',
    'keybox.delete_success': 'Deleted successfully',
    'keybox.delete_failed': 'Delete failed',
    'keybox.enable_failed': 'Enable failed',
    
    // Apps
    'apps.title': 'App Management',
    'apps.search': 'Search apps...',
    'apps.selected': 'Selected',
    'apps.selected_suffix': '',
    'apps.no_results': 'No apps found',
    'apps.total': 'Total',
    'apps.total_suffix': 'apps',
    'apps.select_mode': 'Select Mode',
    'apps.mode_auto': 'Auto',
    'apps.mode_gen': 'Gen',
    'apps.mode_mod': 'Mod',
    'apps.mode_auto_desc': 'Auto select certificate mode',
    'apps.mode_gen_desc': 'Force generate new certificate',
    'apps.mode_mod_desc': 'Modify existing certificate',
    'apps.type_normal': 'Normal',
    'apps.type_exclude': 'Exclude',
    'apps.type_force': 'Force',
    'apps.type_normal_desc': 'Normal proxy',
    'apps.type_exclude_desc': 'Exclude proxy',
    'apps.type_force_desc': 'Force mode',
    'apps.removed': 'Removed',
    'apps.added': 'Added',
    'apps.mode_changed': 'Mode changed',
    'apps.save_failed': 'Save failed',
    'apps.select_all': 'Select All',
    'apps.include_system_apps': 'Include system apps',
    'apps.cert_mode': 'Certificate mode',
    'target.auto_proxy_active': 'Auto proxy is active. Manual config is ignored.',
    
    // Dev
    'dev.service_control': 'Service Control',
    'dev.start_service': 'Start Service',
    'dev.stop_service': 'Stop Service',
    
    // Toast
    'toast.cache_cleared': 'Cache cleared',
    
    // Logger
    'logger.read_failed': 'Cannot read log file',
    'logger.no_log_file': 'No log file',
    
    // AutoProxy
    'autoproxy.title': 'Auto Proxy Manager',
    'autoproxy.mode': 'Proxy Mode',
    'autoproxy.mode_user_only': 'User Apps Only',
    'autoproxy.mode_sys_whitelist': 'System Whitelist',
    'autoproxy.mode_sys_blacklist': 'System Blacklist',
    'autoproxy.mode_custom': 'Custom',
    'autoproxy.sys_whitelist': 'System Whitelist',
    'autoproxy.sys_blacklist': 'System Blacklist',
    'autoproxy.usr_blacklist': 'User Blacklist',
    'autoproxy.exclude': 'Exclude List',
    'autoproxy.add': 'Add',
    'autoproxy.remove': 'Remove',
    'autoproxy.empty': 'List is empty',
    'autoproxy.enter_pkg': 'Enter package name',
    // VerifiedBootHash
    'settings.verified_boot_hash': 'VerifiedBootHash',
    'settings.verified_boot_hash_desc': 'Correct verified boot hash property',
    'settings.vbhash_get': 'Get Hash',
    'settings.vbhash_apply_once': 'Apply Once',
    'settings.vbhash_persist': 'Persist',
    'settings.vbhash_clear': 'Clear',
    'settings.vbhash_empty': 'Not fetched',
    'settings.vbhash_applied': 'VerifiedBootHash applied',
    'settings.vbhash_persisted': 'VerifiedBootHash persisted. It will be auto-applied on boot.',
    'settings.vbhash_cleared': 'VerifiedBootHash cleared',
    'settings.vbhash_fetch_failed': 'Fetch failed',
    'settings.vbhash_invalid': 'Invalid hash',
    'settings.vbhash_persist_hint': 'Apply Once: effective for this session only. Persist: saved to file and auto-reapplied on every boot.',
    // Security Patch
    'settings.security_patch': 'Security Patch',
    'settings.security_patch_desc': 'Modify security patch date for KeyAttestation',
    'settings.enter_patch_date': 'Enter security patch date (YYYY-MM-DD)',
    'settings.patch_updated': 'Patch date updated',
    'settings.patch_synced': 'Patch synced',
    'settings.patch_invalid': 'Invalid date format',
    'settings.patch_mode_simple': 'Simple',
    'settings.patch_mode_advanced': 'Advanced',
    'settings.patch_per_partition': 'Per-partition config',
    'settings.patch_format_hint': 'Format: YYYY-MM-DD or YYYYMMDD, applies to all partitions',
    'settings.current_config': 'Current config',
    'settings.patch_help_title': 'Notes',
    'settings.patch_help_simple': 'Simple mode: enter one date applied to all supported partitions',
    'settings.patch_help_advanced': 'Advanced mode: set date individually for each partition',
    'settings.patch_help_no': 'no — do not modify this partition',
    'settings.patch_help_prop': 'prop — use the actual system property value',
    // Proxy
    'proxy.title': 'Proxy Config',
    // FileBrowser
    'filebrowser.title': 'Browse Files',
    'filebrowser.loading': 'Loading...',
    'filebrowser.read_error': 'Unable to read directory',
    'filebrowser.no_xml': 'No .xml files in this directory',
    'filebrowser.empty': 'Empty directory',
    'filebrowser.show_all': 'Show all files',
    'filebrowser.filter_xml': 'Filter .xml',
    'filebrowser.download': 'Download',
    'filebrowser.sdcard': 'SD Card',
    'filebrowser.adb': 'ADB',
    // About
    'about.module': 'About Module',
    'about.name': 'Name',
    'about.license': 'License',
    'about.contributors': 'Contributors',
    'about.developer': 'Developer',
    // Tool
    'tool.service_control': 'Service Control',
    'tool.service_status': 'Service Status',
    'tool.start_proxy': 'Start Proxy',
    'tool.stop_proxy': 'Stop Proxy',
    'tool.sync_targets': 'Sync Targets',
    'tool.refresh_state': 'Refresh State',
    'tool.tseet_service': 'TSEET Service',
    'tool.tricky_status': 'Tricky Store',
    'tool.proxy_status': 'Proxy Service',
    'tool.integrity': 'Integrity',
    'tool.verified': 'Verified',
    'tool.verification_failed': 'Failed',
    'tool.maintenance': 'Maintenance',
  }
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(() => {
    return loadSettings().lang
  })

  const t = useCallback((key: string, params?: Record<string, string>) => {
    const trans = translations[lang]
    let text = trans?.[key] || key
    if (params) {
      Object.keys(params).forEach(k => {
        text = text.replace(new RegExp(`{${k}}`, 'g'), params[k])
      })
    }
    return text
  }, [lang])

  const setLang = useCallback((newLang: string) => {
    if (translations[newLang]) {
      saveSettings({ lang: newLang })
      setLangState(newLang)
    }
  }, [])

  return (
    <I18nContext.Provider value={{ lang, t, setLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
