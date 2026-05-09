import type { I18nDict } from './types'

const dict: I18nDict = {
  // Common
  'common.save': '保存',
  'common.delete': '删除',
  'common.refresh': '刷新',
  'common.loading': '加载中...',
  'common.failed': '失败',
  'common.success': '成功',
  'common.version': '版本',
  'common.cancel': '取消',
  'common.confirm': '确认',

  // Nav
  'nav.home': '首页',
  'nav.tool': '工具',
  'nav.settings': '设置',

  // Home
  'home.dashboard': '仪表板',
  'home.device_info': '设备信息',
  'home.device_model': '设备型号',
  'home.android_sdk': 'Android 版本',
  'home.abi': '架构',
  'home.view_logs': '查看日志',
  'home.clear_cache': '清除缓存',

  // Dashboard
  'dashboard.service_status': '服务状态',
  'dashboard.tricky_status': 'TrickyStore',
  'dashboard.app_list_proxy': '应用列表代理',
  'dashboard.proxy_mode_auto': '自动',
  'dashboard.proxy_mode_manual': '手动',
  'dashboard.integrity_failed': '完整性检查失败',
  'dashboard.integrity_desc': '模块可能未正确安装或配置',
  'status.running': '运行中',
  'status.stopped': '已停止',
  'status.checking': '检测中',
  'status.unknown': '未知',

  // Cards
  'card.home.app_management': '应用管理',
  'card.home.keybox_management': 'Keybox 管理',
  'card.home.app_count': '个应用',
  'card.home.keybox_status': '个备份',
  'card.home.device_info': '设备信息',
  'card.home.app_proxy_auto': '自动代理模式已启用',

  // Settings
  'settings.personalization': '个性化',
  'settings.theme_color': '主题颜色',
  'settings.language': '语言',
  'settings.navigation_mode': '导航模式',
  'settings.nav_bottom': '底部导航',
  'settings.nav_floating': '悬浮导航',
  'theme.default': '默认',

  // Target
  'target.title': '目标应用',
  'target.search': '搜索应用',
  'target.show_system_apps': '显示系统应用',
  'target.no_results': '未找到应用',
  'target.blacklist_mode': '黑名单模式',
  'target.blacklist_desc': '开启后选中的应用将被排除',
  'target.applied': '已应用',
  'target.excluded': '已排除',
  'target.total': '共',
  'target.total_suffix': '个',

  // Keybox
  'keybox.title': 'Keybox 管理',
  'keybox.steal_a': '来源 A (Tricky Addon)',
  'keybox.steal_b': '来源 B (Integrity Box)',
  'keybox.steal_c': '来源 C (YuriKey)',
  'keybox.import': '导入 Keybox',
  'keybox.import_path': '输入 Keybox 文件绝对路径',
  'keybox.import_desc': '从指定路径复制 keybox.xml 到 tricky_store',
  'keybox.current_status': '当前状态',
  'keybox.exists': '已存在',
  'keybox.not_found': '未找到',

  // Tool
  'tool.title': '工具',
  'tool.service_control': '服务控制',
  'tool.start_ts': '启动 TrickyStore',
  'tool.stop_ts': '停止 TrickyStore',
  'tool.start_tsee': '启动 TSEE',
  'tool.stop_tsee': '停止 TSEE',
  'tool.refresh_state': '刷新状态',
  'tool.pass_vbhash': '修正 VBHash',
  'tool.pass_prop': '伪装引导状态',
  'tool.root_detect': 'Root 检测',
  'tool.conflict_app': '冲突应用检查',
  'tool.conflict_mod': '冲突模块检查',
  'tool.update_targets': '更新目标列表',
  'tool.service_status': '服务状态',
  'tool.tseet_service': 'TSEES',
  'tool.tricky_status': 'TrickyStore',
  'tool.proxy_status': '代理状态',
  'tool.integrity': '完整性',
  'tool.verified': '已验证',
  'tool.verification_failed': '验证失败',
  'tool.maintenance': '维护',
  'tool.view_logs': '查看日志',
  'tool.security_patch': '设置安全补丁级别',
  'tool.security_patch_desc': '该功能仅修改 KeyAttestation 返回的结果，不会重置系统属性。',
  'tool.patch_system': 'System',
  'tool.patch_boot': 'Boot',
  'tool.patch_vendor': 'Vendor',
  'tool.get_patch_date': '获取安全补丁日期',
  'tool.patch_auto': '自动',
  'tool.patch_manual': '手动',
  'tool.patch_apply': '应用',
  'settings.patch_mode_simple': '简单',
  'settings.patch_mode_advanced': '高级',
  'settings.patch_format_hint': '格式: YYYY-MM-DD',
  'settings.patch_invalid': '无效的日期格式',

  // Logs
  'logs.title': '日志',
  'logs.module_log': '模块日志',
  'logs.console_log': '控制台日志',
  'logs.empty': '暂无日志',

  // About
  'about.module': '模块',
  'about.title': '关于',
  'about.module_name': '名称',
  'about.contributors': '开发者',
  'about.role': '开发者',

  // Developer
  'dev.title': '开发者选项',
  'dev.enable': '启用代理',
  'dev.disable': '禁用代理',
  'dev.sync': '同步',
  'dev.refresh': '刷新状态',
}

export default dict
