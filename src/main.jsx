import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Activity, ArrowDown, ArrowUp, ChevronDown, Code2, Coffee, Cpu, ExternalLink, Gauge, Info, MemoryStick, Minus, Network, Palette, Settings as SettingsIcon, X } from 'lucide-react'
import { resolveLanguage, translator } from './i18n'
import { profile } from './profile'
import alipayQr from '../fundings/alipay.jpg'
import wechatQr from '../fundings/wechat.png'
import './styles.css'

const defaults = { modules: ['cpu', 'gpu', 'memory', 'network'], opacity: .92, scale: 1, interval: 1500, alwaysOnTop: true, compact: false, autoLaunch: false, networkInterface: 'auto', language: 'auto', systemLocale: navigator.language }
const bridge = window.pulsebar || {
  getMetrics: async () => ({ cpu: { value: 38 }, gpu: { value: 24 }, memory: { value: 61, used: 10.4e9, total: 16e9 }, network: { down: 4.8e6, up: 820e3, label: 'Wi-Fi' }, interfaces: [] }),
  getSettings: async () => defaults, updateSettings: async (value) => ({ ...defaults, ...value }), setAutoLaunch: async (value) => value,
  minimize: () => {}, quit: () => {}, openSettings: () => {}, openExternal: (url) => window.open(url, '_blank'), onSettings: () => () => {},
}
const moduleMeta = {
  cpu: { labelKey: 'CPU', color: '#ff6b57', Icon: Cpu }, gpu: { labelKey: 'GPU', color: '#ad7cff', Icon: Gauge },
  memory: { labelKey: 'memory', color: '#43d6aa', Icon: MemoryStick }, network: { labelKey: 'network', color: '#4aafff', Icon: Network },
}

function formatBytes(value, speed = false) {
  if (!Number.isFinite(value)) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']; let size = value; let i = 0
  while (size >= 1000 && i < units.length - 1) { size /= 1000; i += 1 }
  return `${size.toFixed(size >= 100 ? 0 : size >= 10 ? 1 : 2)} ${units[i]}${speed ? '/s' : ''}`
}

function Sparkline({ values, color }) {
  const points = useMemo(() => {
    const data = values.length > 1 ? values : values.length === 1 ? [0, values[0]] : [0, 0]
    const max = Math.max(...data, 100)
    return data.map((value, index) => `${(index / (data.length - 1)) * 100},${30 - (value / max) * 27}`).join(' ')
  }, [values])
  return <svg className="sparkline" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id={`fill-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={color} stopOpacity=".35"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs><polygon points={`0,32 ${points} 100,32`} fill={`url(#fill-${color.slice(1)})`}/><polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke"/></svg>
}

function Metric({ type, data, history, compact, t }) {
  const { labelKey, color, Icon } = moduleMeta[type]; const unavailable = data?.value == null
  const label = labelKey === 'CPU' || labelKey === 'GPU' ? labelKey : t(labelKey)
  return <section className={`metric metric-${type}`} style={{ '--accent': color }}><div className="metric-head"><Icon size={14}/><span>{label}</span></div><div className="metric-value">{unavailable ? <><b className="muted-value">—</b><span>{t('unavailable')}</span></> : <><b>{data.value}</b><span>%</span></>}</div>{!compact && <Sparkline values={history} color={color}/>}<div className="progress"><i style={{ width: `${unavailable ? 0 : data.value}%` }}/></div>{type === 'memory' && !compact && <div className="metric-note">{formatBytes(data?.used)} / {formatBytes(data?.total)}</div>}</section>
}

function NetworkMetric({ data, compact, t }) {
  return <section className="metric metric-network" style={{ '--accent': moduleMeta.network.color }}><div className="metric-head"><Network size={14}/><span>{t('network')}</span><small>{data?.label || t('disconnected')}</small></div><div className="network-values"><span><ArrowDown size={13}/><b>{formatBytes(data?.down, true)}</b></span><span><ArrowUp size={13}/><b>{formatBytes(data?.up, true)}</b></span></div>{!compact && <div className="network-bars"><i/><i/></div>}</section>
}

function Monitor() {
  const [metrics, setMetrics] = useState(null); const [settings, setSettings] = useState(null)
  const [histories, setHistories] = useState({ cpu: [], gpu: [], memory: [] }); const timer = useRef(null)
  useEffect(() => { bridge.getSettings().then(setSettings); return bridge.onSettings(setSettings) }, [])
  useEffect(() => {
    if (!settings) return; let cancelled = false
    async function update() { const next = await bridge.getMetrics(); if (cancelled || next.error) return; setMetrics(next); setHistories((old) => { const add = (key) => [...old[key], Number(next[key]?.value) || 0].slice(-28); return { cpu: add('cpu'), gpu: add('gpu'), memory: add('memory') } }) }
    update(); timer.current = setInterval(update, Math.max(750, settings.interval || 1500)); return () => { cancelled = true; clearInterval(timer.current) }
  }, [settings?.interval])
  if (!settings) return null
  const t = translator(resolveLanguage(settings))
  return <main className={`monitor ${settings.compact ? 'compact' : ''}`} style={{ '--panel-opacity': settings.opacity }}><div className="drag-zone"><Activity size={15}/><span>PULSEBAR</span></div><div className="metrics-grid">{(settings.modules || []).map((type) => type === 'network' ? <NetworkMetric key={type} data={metrics?.network} compact={settings.compact} t={t}/> : <Metric key={type} type={type} data={metrics?.[type]} history={histories[type]} compact={settings.compact} t={t}/>)}</div><div className="window-actions"><button onClick={bridge.openSettings} title={t('settings')}><SettingsIcon size={15}/></button><button onClick={bridge.minimize} title={t('hide')}><Minus size={16}/></button><button className="quit" onClick={bridge.quit} title={t('quit')}><X size={15}/></button></div></main>
}

function Toggle({ checked, onChange }) { return <button className={`toggle ${checked ? 'on' : ''}`} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}><i/></button> }
function Select({ value, onChange, children }) { return <div className="select-wrap"><select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select><ChevronDown size={15}/></div> }

function Appearance({ settings, interfaces, save, preview, setSettings, t }) {
  const toggleModule = (type) => { const has = settings.modules.includes(type); const modules = has ? settings.modules.filter((item) => item !== type) : [...settings.modules, type]; if (modules.length) save({ modules }) }
  const transparency = Math.round((1 - settings.opacity) * 100)
  return <><section className="settings-card"><h2>{t('displayItems')}</h2><div className="module-pills">{Object.entries(moduleMeta).map(([key, value]) => <button key={key} className={settings.modules.includes(key) ? 'active' : ''} style={{ '--accent': value.color }} onClick={() => toggleModule(key)}><value.Icon size={16}/>{value.labelKey === 'CPU' || value.labelKey === 'GPU' ? value.labelKey : t(value.labelKey)}</button>)}</div></section><section className="settings-card rows"><label><span><b>{t('launchAtLogin')}</b><small>{t('launchHint')}</small></span><Toggle checked={settings.autoLaunch} onChange={async (value) => setSettings({ ...settings, autoLaunch: await bridge.setAutoLaunch(value) })}/></label><label><span><b>{t('alwaysOnTop')}</b><small>{t('topHint')}</small></span><Toggle checked={settings.alwaysOnTop} onChange={(value) => save({ alwaysOnTop: value })}/></label><label><span><b>{t('compact')}</b><small>{t('compactHint')}</small></span><Toggle checked={settings.compact} onChange={(value) => save({ compact: value })}/></label></section><section className="settings-card controls"><label><span>{t('opacity')} <b>{transparency}%</b></span><input type="range" min="0" max="45" step="1" value={transparency} onChange={(event) => preview({ opacity: 1 - Number(event.target.value) / 100 })}/></label><label><span>{t('windowScale')}</span><Select value={settings.scale} onChange={(value) => save({ scale: Number(value) })}>{[.75,.9,1,1.1,1.25].map((value) => <option key={value} value={value}>{Math.round(value * 100)}%</option>)}</Select></label><label><span>{t('refreshRate')}</span><Select value={settings.interval} onChange={(value) => save({ interval: Number(value) })}>{[750,1500,3000,5000].map((value) => <option key={value} value={value}>{value / 1000} {t('seconds')}</option>)}</Select></label><label><span>{t('networkInterface')}</span><Select value={settings.networkInterface} onChange={(value) => save({ networkInterface: value })}><option value="auto">{t('automatic')}</option>{interfaces.map((item) => <option key={item.iface} value={item.iface}>{item.name}</option>)}</Select></label><label><span>{t('language')}</span><Select value={settings.language} onChange={(value) => save({ language: value })}><option value="auto">{t('followSystem')}</option><option value="zh-CN">{t('chinese')}</option><option value="en">{t('english')}</option></Select></label></section></>
}

function LinkRow({ icon: Icon, label, value, url }) { const enabled = Boolean(url); return <button className="about-link" disabled={!enabled} onClick={() => enabled && bridge.openExternal(url)}><Icon size={17}/><span><b>{label}</b><small>{value || '—'}</small></span>{enabled && <ExternalLink size={14}/>}</button> }
function About({ t }) {
  const [showSupport, setShowSupport] = useState(false)
  const initials = profile.name.split(/[_\s-]/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return <><section className="settings-card about-card"><div className="profile"><div className="avatar">{profile.avatar ? <img src={profile.avatar} alt={profile.name}/> : initials}</div><div><span>{t('developer')}</span><h2>{profile.name}</h2><p>{t('aboutIntro')}</p></div></div><div className="about-links"><LinkRow icon={Code2} label={t('github')} value={profile.github} url={profile.github}/><button className="about-link" onClick={() => setShowSupport(true)}><Coffee size={17}/><span><b>{t('sponsor')}</b><small>{t('sponsorText')}</small></span><ExternalLink size={14}/></button></div><div className="version-mark"><Activity size={16}/>PulseBar <span>v0.0.0</span></div></section>{showSupport && <div className="support-backdrop" onClick={() => setShowSupport(false)}><section className="support-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowSupport(false)} title={t('close')}><X size={16}/></button><Coffee size={23}/><h2>{t('supportTitle')}</h2><p>{t('supportHint')}</p><button className="afdian-button" onClick={() => bridge.openExternal(profile.donation.url)}>{t('afdian')}<ExternalLink size={14}/></button><div className="qr-grid"><figure><img src={wechatQr} alt={t('wechatPay')}/><figcaption>{t('wechatPay')}</figcaption></figure><figure><img src={alipayQr} alt={t('alipay')}/><figcaption>{t('alipay')}</figcaption></figure></div></section></div>}</>
}

function SettingsPage() {
  const [settings, setSettings] = useState(null); const [interfaces, setInterfaces] = useState([]); const [tab, setTab] = useState('appearance')
  const previewTimer = useRef(null)
  useEffect(() => { bridge.getSettings().then(setSettings); bridge.getMetrics().then((data) => setInterfaces(data.interfaces || [])) }, [])
  if (!settings) return <div className="settings-page"/>
  const save = async (patch) => setSettings(await bridge.updateSettings(patch))
  const preview = (patch) => { setSettings((current) => ({ ...current, ...patch })); clearTimeout(previewTimer.current); previewTimer.current = setTimeout(async () => setSettings(await bridge.updateSettings(patch)), 80) }
  const t = translator(resolveLanguage(settings))
  return <main className="settings-page"><header><div className="brand-icon"><Activity size={20}/></div><div><h1>PulseBar</h1><p>{t('subtitle')}</p></div></header><nav className="settings-tabs"><button className={tab === 'appearance' ? 'active' : ''} onClick={() => setTab('appearance')}><Palette size={15}/>{t('appearance')}</button><button className={tab === 'about' ? 'active' : ''} onClick={() => setTab('about')}><Info size={15}/>{t('about')}</button></nav>{tab === 'appearance' ? <Appearance settings={settings} interfaces={interfaces} save={save} preview={preview} setSettings={setSettings} t={t}/> : <About t={t}/>}<footer>{t('saved')} · v0.0.0</footer></main>
}

const isSettings = window.location.hash === '#/settings' || window.location.pathname.endsWith('/settings')
createRoot(document.getElementById('root')).render(<React.StrictMode>{isSettings ? <SettingsPage/> : <Monitor/>}</React.StrictMode>)
