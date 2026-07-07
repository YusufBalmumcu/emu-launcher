# emu-launcher
A simple emulation launcher to organize and quickly start your emulators (Azahar, PCSX2, Eden, etc.) from one window.

## Stack
- [Tauri 2](https://tauri.app) (Rust backend)
- React 19 + TypeScript
- Tailwind CSS 4

## Development

Prerequisites: Node.js, Rust toolchain, and the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for Windows.

```sh
npm install
npm run tauri dev     # desktop app with hot reload
```

`npm run dev` alone serves the UI in a browser with a localStorage-backed mock (no launching), useful for pure UI work.

## Build

```sh
npm run tauri build
```

## Config

Emulator entries are stored as JSON at `%APPDATA%\com.emulauncher.app\emulators.json`.

## Artwork

Each emulator shows the logo of the system it emulates. The system is auto-detected
from the emulator's name/exe (e.g. `pcsx2.exe` → PlayStation 2) and can be overridden
in the add/edit dialog.

Artwork is resolved through a pluggable provider layer (`src/artwork/`). Today only the
bundled console-logo provider is registered; the same interface is designed to host a
SteamGridDB scraper for game cover/logo art once game shortcuts are added (see
`src/artwork/steamGridDb.ts`).

Bundled console logos come from [HVR88/Monochrome-Gaming-Logos](https://github.com/HVR88/Monochrome-Gaming-Logos)
(RetroArch logo from [Simple Icons](https://simpleicons.org)). All console/brand logos
are trademarks of their respective owners.
