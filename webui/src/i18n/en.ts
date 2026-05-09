import type { I18nDict } from './types'

const dict: I18nDict = {
  // Common
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.refresh': 'Refresh',
  'common.loading': 'Loading...',
  'common.failed': 'Failed',
  'common.success': 'Success',
  'common.version': 'Version',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',

  // Nav
  'nav.home': 'Home',
  'nav.tool': 'Tools',
  'nav.settings': 'Settings',

  // Home
  'home.dashboard': 'Dashboard',
  'home.device_info': 'Device Info',
  'home.device_model': 'Device Model',
  'home.android_sdk': 'Android Version',
  'home.abi': 'Architecture',
  'home.view_logs': 'View Logs',
  'home.clear_cache': 'Clear Cache',

  // Dashboard
  'dashboard.service_status': 'Service Status',
  'dashboard.tricky_status': 'TrickyStore',
  'dashboard.app_list_proxy': 'App List Proxy',
  'dashboard.proxy_mode_auto': 'Auto',
  'dashboard.proxy_mode_manual': 'Manual',
  'dashboard.integrity_failed': 'Integrity Check Failed',
  'dashboard.integrity_desc': 'Module may not be properly installed or configured',
  'status.running': 'Running',
  'status.stopped': 'Stopped',
  'status.checking': 'Checking',
  'status.unknown': 'Unknown',

  // Cards
  'card.home.app_management': 'App Management',
  'card.home.keybox_management': 'Keybox Management',
  'card.home.app_count': 'apps',
  'card.home.keybox_status': 'backups',
  'card.home.device_info': 'Device Info',
  'card.home.app_proxy_auto': 'Auto proxy mode is active',

  // Settings
  'settings.personalization': 'Personalization',
  'settings.theme_color': 'Theme Color',
  'settings.language': 'Language',
  'settings.navigation_mode': 'Navigation Mode',
  'settings.nav_bottom': 'Bottom Nav',
  'settings.nav_floating': 'Floating Nav',
  'theme.default': 'Default',

  // Target
  'target.title': 'Target Apps',
  'target.search': 'Search apps',
  'target.show_system_apps': 'Show system apps',
  'target.no_results': 'No apps found',
  'target.blacklist_mode': 'Blacklist Mode',
  'target.blacklist_desc': 'Selected apps will be excluded when enabled',
  'target.applied': 'Applied',
  'target.excluded': 'Excluded',
  'target.total': 'Total',
  'target.total_suffix': 'apps',
  'target.loading_init': 'Initializing...',
  'target.fetching_apps': 'Fetching app list...',
  'target.processing_apps': 'Processing apps...',
  'target.processing_system': 'Processing system apps...',
  'target.finishing': 'Finishing...',
  'target.complete': 'Complete',

  // Keybox
  'keybox.title': 'Keybox Management',
  'keybox.steal_a': 'Source A (Tricky Addon)',
  'keybox.steal_b': 'Source B (Integrity Box)',
  'keybox.steal_c': 'Source C (YuriKey)',
  'keybox.import': 'Import Keybox',
  'keybox.import_path': 'Enter absolute path to keybox file',
  'keybox.import_desc': 'Copy keybox.xml from specified path to tricky_store',
  'keybox.current_status': 'Current Status',
  'keybox.exists': 'Exists',
  'keybox.not_found': 'Not Found',

  // Tool
  'tool.title': 'Tools',
  'tool.service_control': 'Service Control',
  'tool.start_ts': 'Start TrickyStore',
  'tool.stop_ts': 'Stop TrickyStore',
  'tool.start_tsee': 'Start TSEE',
  'tool.stop_tsee': 'Stop TSEE',
  'tool.refresh_state': 'Refresh State',
  'tool.pass_vbhash': 'Fix VBHash',
  'tool.pass_prop': 'Spoof Boot State',
  'tool.root_detect': 'Root Detection',
  'tool.conflict_app': 'Conflict Apps Check',
  'tool.conflict_mod': 'Conflict Modules Check',
  'tool.update_targets': 'Update Target List',
  'tool.service_status': 'Service Status',
  'tool.tseet_service': 'TSEES',
  'tool.tricky_status': 'TrickyStore',
  'tool.proxy_status': 'Proxy Status',
  'tool.integrity': 'Integrity',
  'tool.verified': 'Verified',
  'tool.verification_failed': 'Verification Failed',
  'tool.maintenance': 'Maintenance',
  'tool.view_logs': 'View Logs',
  'tool.security_patch': 'Set Security Patch Level',
  'tool.security_patch_desc': 'This only modifies KeyAttestation results without resetting system properties.',
  'tool.patch_system': 'System',
  'tool.patch_boot': 'Boot',
  'tool.patch_vendor': 'Vendor',
  'tool.get_patch_date': 'Get Patch Date',
  'tool.patch_auto': 'Auto',
  'tool.patch_manual': 'Manual',
  'tool.patch_apply': 'Apply',
  'settings.patch_mode_simple': 'Simple',
  'settings.patch_mode_advanced': 'Advanced',
  'settings.patch_format_hint': 'Format: YYYY-MM-DD',
  'settings.patch_invalid': 'Invalid date format',

  // Logs
  'logs.title': 'Logs',
  'logs.module_log': 'Module Log',
  'logs.console_log': 'Console Log',
  'logs.empty': 'No logs',

  // About
  'about.module': 'Module',
  'about.title': 'About',
  'about.module_name': 'Name',
  'about.contributors': 'Contributors',
  'about.role': 'Developer',

  // Developer
  'dev.title': 'Developer Options',
  'dev.enable': 'Enable Proxy',
  'dev.disable': 'Disable Proxy',
  'dev.sync': 'Sync',
  'dev.refresh': 'Refresh State',
}

export default dict
