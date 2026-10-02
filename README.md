# PulseBar

**English** | [简体中文](README.zh-CN.md)

PulseBar is a compact, translucent desktop performance monitor for macOS and Windows. It keeps CPU, GPU, memory, and network activity visible in a polished floating bar without getting in your way.

<p align="center">
  <a href="https://github.com/xiangzhong26/PulseBar/releases/latest"><img alt="Download PulseBar" src="https://img.shields.io/badge/Download-PulseBar-7567F8?style=for-the-badge&logo=github"></a>
  <a href="https://github.com/xiangzhong26/PulseBar/releases"><img alt="All releases" src="https://img.shields.io/badge/View-All_Releases-252932?style=for-the-badge"></a>
</p>

## Download

> [!IMPORTANT]
> Ready-to-use installers are available from the **[latest GitHub Release](https://github.com/xiangzhong26/PulseBar/releases/latest)**. You do not need Node.js to run the packaged app.

| Platform | Recommended download | Alternative |
| --- | --- | --- |
| Windows 10/11 x64 | **EXE Setup** | Portable EXE |
| macOS Apple Silicon | **arm64 DMG** | arm64 ZIP |
| macOS Intel | **x64 DMG** | x64 ZIP |

> PulseBar is at an early stage. Feedback, bug reports, and contributions are welcome.

## Preview

![PulseBar performance monitor](docs/images/monitor.png)

<p align="center">
  <img src="docs/images/settings.png" width="430" alt="PulseBar settings">
</p>

## Highlights

- Live CPU, GPU, memory, upload, and download monitoring
- High-contrast color system with lightweight history charts
- Frameless translucent window with blur and always-on-top support
- Five window scales, adjustable opacity, and compact mode
- Choose exactly which metrics appear
- Select a network interface and polling interval
- Automatic system-language detection with Chinese and English overrides
- Launch at login on macOS and Windows
- Tray controls and persistent local settings
- No telemetry, account, or cloud service

## Requirements

- macOS 11 or later, Apple Silicon or Intel
- Windows 10 or later, x64
- Node.js 20 or later for development

GPU utilization depends on the information exposed by the operating system and graphics driver. Some macOS devices and virtual machines may show GPU utilization as unavailable.

## Getting started

```bash
git clone https://github.com/xiangzhong26/PulseBar.git
cd PulseBar
npm install
npm run dev
```

Use `npm start` to run the most recent production build locally.

## Build from source

```bash
# Build for the current platform
npm run dist

# Build macOS DMG and ZIP
npm run dist:mac

# Build Windows NSIS installer and portable executable
npm run dist:win
```

Artifacts are written to `release/`. Build Windows releases on Windows and macOS releases on macOS for the most reliable native packaging and code signing.

Prebuilt DMG and EXE installers are published on the [GitHub Releases page](https://github.com/xiangzhong26/PulseBar/releases). Pushing a version tag such as `v0.0.0` runs the cross-platform release workflow automatically.

## Support PulseBar

If PulseBar is useful to you, you can support its development through **[Afdian](https://afdian.com/a/xiangzhong26)**. Additional support options are available in the app's About page.

## Personalize the About page

Edit [`src/profile.js`](src/profile.js) before publishing:

```js
export const profile = {
  name: 'your-public-handle',
  github: 'https://github.com/xiangzhong26',
  avatar: 'https://example.com/public-avatar.png',
  donation: { url: 'https://afdian.com/a/xiangzhong26' },
}
```

The app validates external links and only opens HTTP, HTTPS, and email URLs.

## Internationalization

PulseBar follows the operating-system language by default. Users can explicitly choose Simplified Chinese or English in Settings. Translations live in [`src/i18n.js`](src/i18n.js); adding another language only requires a message set and a language option.

## Technology

- Electron for the macOS and Windows desktop shell
- React and Vite for the interface
- `systeminformation` for cross-platform performance data
- `electron-store` for local preferences

Settings stay on the local machine. PulseBar does not collect or transmit performance data.

## Project structure

```text
electron/          Electron main process and secure preload bridge
src/main.jsx       Monitor and settings interfaces
src/i18n.js        Chinese and English translations
src/profile.js     About-page profile and support links
src/styles.css     Visual system and responsive layout
```

## Contributing

1. Fork the repository and create a focused branch.
2. Run `npm install` and `npm run dev`.
3. Keep changes cross-platform where possible.
4. Run `npm run build` before opening a pull request.
5. Describe any OS-specific behavior in the pull request.

## License

Released under the [MIT License](LICENSE).
