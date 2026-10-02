export const messages = {
  'zh-CN': {
    memory: '内存', network: '网络', unavailable: '不可用', disconnected: '未连接',
    settings: '设置', hide: '隐藏', quit: '退出', subtitle: '桌面性能监视器',
    appearance: '外观', about: '关于', displayItems: '显示项目', launchAtLogin: '开机自启',
    launchHint: '登录系统后自动运行', alwaysOnTop: '始终置顶', topHint: '保持在其他窗口上方',
    compact: '紧凑模式', compactHint: '隐藏曲线与辅助数据', opacity: '透明度', windowScale: '窗口缩放',
    refreshRate: '刷新频率', seconds: '秒', networkInterface: '网络接口', automatic: '自动选择', language: '界面语言',
    followSystem: '跟随系统', chinese: '简体中文', english: 'English', saved: '设置会自动保存',
    aboutIntro: '一个简洁、轻量、跨平台的桌面性能监视器。', developer: '开发者', github: 'GitHub 主页',
    email: '联系邮箱', sponsor: '支持项目', sponsorText: '如果 PulseBar 对你有帮助，欢迎请我喝杯咖啡。',
    configureProfile: '请在 src/profile.js 中填写 GitHub、头像与打赏链接。', openLink: '打开链接', supportTitle: '支持 PulseBar',
    supportHint: '感谢你对这个小工具的喜爱。你可以通过爱发电，或使用下方收款码支持项目。', afdian: '在爱发电上支持', wechatPay: '微信支付', alipay: '支付宝', close: '关闭',
  },
  en: {
    memory: 'Memory', network: 'Network', unavailable: 'N/A', disconnected: 'Offline',
    settings: 'Settings', hide: 'Hide', quit: 'Quit', subtitle: 'Desktop performance monitor',
    appearance: 'Appearance', about: 'About', displayItems: 'Visible metrics', launchAtLogin: 'Launch at login',
    launchHint: 'Start automatically after signing in', alwaysOnTop: 'Always on top', topHint: 'Keep the monitor above other windows',
    compact: 'Compact mode', compactHint: 'Hide charts and secondary details', opacity: 'Transparency', windowScale: 'Window scale',
    refreshRate: 'Refresh interval', seconds: 'sec', networkInterface: 'Network interface', automatic: 'Automatic', language: 'Language',
    followSystem: 'Follow system', chinese: '简体中文', english: 'English', saved: 'Settings are saved automatically',
    aboutIntro: 'A clean, lightweight, cross-platform desktop performance monitor.', developer: 'Developer', github: 'GitHub profile',
    email: 'Email', sponsor: 'Support the project', sponsorText: 'If PulseBar helps you, consider buying me a coffee.',
    configureProfile: 'Add your GitHub, avatar and donation link in src/profile.js.', openLink: 'Open link', supportTitle: 'Support PulseBar',
    supportHint: 'Thank you for supporting this little utility. Use Afdian or scan one of the payment codes below.', afdian: 'Support on Afdian', wechatPay: 'WeChat Pay', alipay: 'Alipay', close: 'Close',
  },
}

export function resolveLanguage(settings) {
  if (settings?.language && settings.language !== 'auto') return settings.language
  return String(settings?.systemLocale || navigator.language || 'en').toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

export function translator(language) {
  return (key) => messages[language]?.[key] ?? messages.en[key] ?? key
}
