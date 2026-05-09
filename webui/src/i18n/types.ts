/**
 * Modular i18n system — add new languages by creating a new file and adding to the map.
 */

export interface I18nDict {
  // Common
  'common.save': string
  'common.delete': string
  'common.refresh': string
  'common.loading': string
  'common.failed': string
  'common.success': string
  'common.version': string
  'common.cancel': string
  'common.confirm': string

  // Nav
  'nav.home': string
  'nav.tool': string
  'nav.settings': string

  // Home
  'home.dashboard': string
  'home.device_info': string
  'home.device_model': string
  'home.android_sdk': string
  'home.abi': string
  'home.view_logs': string
  'home.clear_cache': string

  // Dashboard
  'dashboard.service_status': string
  'dashboard.tricky_status': string
  'dashboard.app_list_proxy': string
  'dashboard.proxy_mode_auto': string
  'dashboard.proxy_mode_manual': string
  'dashboard.integrity_failed': string
  'dashboard.integrity_desc': string
  'status.running': string
  'status.stopped': string
  'status.checking': string
  'status.unknown': string

  // Cards
  'card.home.app_management': string
  'card.home.keybox_management': string
  'card.home.app_count': string
  'card.home.keybox_status': string
  'card.home.device_info': string
  'card.home.app_proxy_auto': string

  // Settings
  'settings.personalization': string
  'settings.theme_color': string
  'settings.language': string
  'settings.navigation_mode': string
  'settings.nav_bottom': string
  'settings.nav_floating': string
  'theme.default': string

  // Target
  'target.title': string
  'target.search': string
  'target.show_system_apps': string
  'target.no_results': string
  'target.blacklist_mode': string
  'target.blacklist_desc': string
  'target.applied': string
  'target.excluded': string
  'target.total': string
  'target.total_suffix': string

  // Keybox
  'keybox.title': string
  'keybox.steal_a': string
  'keybox.steal_b': string
  'keybox.steal_c': string
  'keybox.import': string
  'keybox.import_path': string
  'keybox.import_desc': string
  'keybox.current_status': string
  'keybox.exists': string
  'keybox.not_found': string

  // Tool
  'tool.title': string
  'tool.service_control': string
  'tool.start_ts': string
  'tool.stop_ts': string
  'tool.start_tsee': string
  'tool.stop_tsee': string
  'tool.refresh_state': string
  'tool.pass_vbhash': string
  'tool.pass_prop': string
  'tool.root_detect': string
  'tool.conflict_app': string
  'tool.conflict_mod': string
  'tool.update_targets': string
  'tool.service_status': string
  'tool.tseet_service': string
  'tool.tricky_status': string
  'tool.proxy_status': string
  'tool.integrity': string
  'tool.verified': string
  'tool.verification_failed': string
  'tool.maintenance': string
  'tool.view_logs': string
  'tool.security_patch': string
  'tool.security_patch_desc': string
  'tool.patch_system': string
  'tool.patch_boot': string
  'tool.patch_vendor': string
  'tool.get_patch_date': string
  'tool.patch_auto': string
  'tool.patch_manual': string
  'tool.patch_apply': string
  'settings.patch_mode_simple': string
  'settings.patch_mode_advanced': string
  'settings.patch_format_hint': string
  'settings.patch_invalid': string

  // Logs
  'logs.title': string
  'logs.module_log': string
  'logs.console_log': string
  'logs.empty': string

  // About
  'about.module': string
  'about.title': string
  'about.module_name': string
  'about.contributors': string
  'about.role': string

  // Developer
  'dev.title': string
  'dev.enable': string
  'dev.disable': string
  'dev.sync': string
  'dev.refresh': string
}

export type LangCode = string

export interface LangMeta {
  code: LangCode
  label: string
}

export const translations: Record<LangCode, I18nDict> = {}
export const langRegistry: LangMeta[] = []

export function registerLang(code: LangCode, dict: I18nDict, label: string) {
  translations[code] = dict
  langRegistry.push({ code, label })
}

export function t(key: keyof I18nDict, lang: LangCode): string {
  const dict = translations[lang]
  if (!dict) return key
  return dict[key] || key
}
