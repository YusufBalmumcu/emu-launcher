import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { Emulator } from "./types";

export interface ExeEntry {
  path: string;
  fileName: string;
  dirName: string;
}

// Tauri dışında (salt tarayıcıda `npm run dev`) çalışırken UI geliştirmesi
// yapılabilsin diye localStorage tabanlı bir yedek kullanılır.
const isTauri = "__TAURI_INTERNALS__" in window;
const BROWSER_KEY = "emu-launcher:emulators";

export async function loadEmulators(): Promise<Emulator[]> {
  if (!isTauri) {
    return JSON.parse(localStorage.getItem(BROWSER_KEY) ?? "[]");
  }
  return invoke<Emulator[]>("load_emulators");
}

export async function saveEmulators(emulators: Emulator[]): Promise<void> {
  if (!isTauri) {
    localStorage.setItem(BROWSER_KEY, JSON.stringify(emulators));
    return;
  }
  return invoke("save_emulators", { emulators });
}

export async function launchEmulator(exePath: string): Promise<void> {
  if (!isTauri) {
    throw new Error("Başlatma yalnızca masaüstü uygulamasında çalışır.");
  }
  return invoke("launch_emulator", { exePath });
}

export async function pickExecutable(): Promise<string | null> {
  if (!isTauri) return null;
  const selected = await open({
    title: "Emülatör çalıştırılabilir dosyasını seç",
    filters: [{ name: "Uygulama", extensions: ["exe"] }],
    multiple: false,
  });
  return typeof selected === "string" ? selected : null;
}

export async function pickDirectory(): Promise<string | null> {
  if (!isTauri) return "C:\\Emulators"; // tarayıcı önizlemesi için sahte yol
  const selected = await open({
    title: "Emülatör klasörünü seç",
    directory: true,
    multiple: false,
  });
  return typeof selected === "string" ? selected : null;
}

export async function scanDirectory(dir: string): Promise<ExeEntry[]> {
  if (!isTauri) return MOCK_SCAN;
  return invoke<ExeEntry[]>("scan_directory", { dir });
}

// Sadece tarayıcı önizlemesinde kullanılan örnek tarama sonucu.
const MOCK_SCAN: ExeEntry[] = [
  { path: "C:\\Emulators\\PCSX2\\pcsx2-qt.exe", fileName: "pcsx2-qt.exe", dirName: "PCSX2" },
  { path: "C:\\Emulators\\PCSX2\\unins000.exe", fileName: "unins000.exe", dirName: "PCSX2" },
  { path: "C:\\Emulators\\DuckStation\\duckstation-qt-x64-ReleaseLTCG.exe", fileName: "duckstation-qt-x64-ReleaseLTCG.exe", dirName: "DuckStation" },
  { path: "C:\\Emulators\\DuckStation\\updater.exe", fileName: "updater.exe", dirName: "DuckStation" },
  { path: "C:\\Emulators\\Azahar\\azahar.exe", fileName: "azahar.exe", dirName: "Azahar" },
  { path: "C:\\Emulators\\Eden\\eden.exe", fileName: "eden.exe", dirName: "Eden" },
  { path: "C:\\Emulators\\Dolphin-x64\\Dolphin.exe", fileName: "Dolphin.exe", dirName: "Dolphin-x64" },
  { path: "C:\\Emulators\\RPCS3\\rpcs3.exe", fileName: "rpcs3.exe", dirName: "RPCS3" },
  { path: "C:\\Emulators\\_redist\\vc_redist.x64.exe", fileName: "vc_redist.x64.exe", dirName: "_redist" },
];
