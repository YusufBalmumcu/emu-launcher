// Bundled console logos (src/assets/systems/*.svg) — imported as URLs by Vite.
const logoModules = import.meta.glob("./assets/systems/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const LOGOS: Record<string, string> = {};
for (const [path, url] of Object.entries(logoModules)) {
  const id = path.split("/").pop()!.replace(/\.svg$/, "");
  LOGOS[id] = url;
}

export interface GameSystem {
  id: string;
  /** Tam ad — açılır listede ve erişilebilirlik metninde kullanılır. */
  name: string;
  /** Kapak arka planı için marka rengi. */
  color: string;
}

// Sıra, açılır listede görünen sırayı belirler.
export const SYSTEMS: GameSystem[] = [
  { id: "ps1", name: "PlayStation", color: "#2b6cb0" },
  { id: "ps2", name: "PlayStation 2", color: "#1d3fa0" },
  { id: "ps3", name: "PlayStation 3", color: "#2d3436" },
  { id: "ps4", name: "PlayStation 4", color: "#0a4bd0" },
  { id: "ps5", name: "PlayStation 5", color: "#1a1a2e" },
  { id: "psp", name: "PlayStation Portable", color: "#20242b" },
  { id: "psvita", name: "PlayStation Vita", color: "#1f6feb" },
  { id: "switch", name: "Nintendo Switch", color: "#e60012" },
  { id: "3ds", name: "Nintendo 3DS", color: "#d1232a" },
  { id: "nds", name: "Nintendo DS", color: "#6b7075" },
  { id: "gamecube", name: "Nintendo GameCube", color: "#5c4b9e" },
  { id: "wii", name: "Nintendo Wii", color: "#0a9bd6" },
  { id: "wiiu", name: "Nintendo Wii U", color: "#0aa3e0" },
  { id: "n64", name: "Nintendo 64", color: "#0a9e46" },
  { id: "snes", name: "Super Nintendo (SNES)", color: "#4c469b" },
  { id: "nes", name: "Nintendo NES", color: "#b0121a" },
  { id: "gb", name: "Game Boy", color: "#6d7b2e" },
  { id: "gbc", name: "Game Boy Color", color: "#c0398f" },
  { id: "gba", name: "Game Boy Advance", color: "#4b3fce" },
  { id: "genesis", name: "Sega Genesis", color: "#17559e" },
  { id: "megadrive", name: "Sega Mega Drive", color: "#1a1a1a" },
  { id: "dreamcast", name: "Sega Dreamcast", color: "#d9640c" },
  { id: "saturn", name: "Sega Saturn", color: "#26262b" },
  { id: "mastersystem", name: "Sega Master System", color: "#b01018" },
  { id: "gamegear", name: "Sega Game Gear", color: "#1f2429" },
  { id: "xbox", name: "Xbox", color: "#107c10" },
  { id: "xbox360", name: "Xbox 360", color: "#0e7a0e" },
  { id: "arcade", name: "Arcade", color: "#c026d3" },
  { id: "mame", name: "MAME (Arcade)", color: "#a21caf" },
  { id: "multi", name: "RetroArch / Çok Sistemli", color: "#3f4756" },
];

const SYSTEM_BY_ID = new Map(SYSTEMS.map((s) => [s.id, s]));

export function getSystem(id: string | undefined): GameSystem | undefined {
  return id ? SYSTEM_BY_ID.get(id) : undefined;
}

export function systemLogo(id: string | undefined): string | undefined {
  return id ? LOGOS[id] : undefined;
}

export interface EmulatorDef {
  /** Görünen ad — otomatik ekleme/algılamada kullanılır. */
  name: string;
  systemId: string;
  /** Küçük harf alt dizeler; exe adı/klasör/emülatör adında aranır. */
  patterns: string[];
}

// Bilinen emülatörler. Klasör taramasında ve otomatik sistem algılamada
// kullanılır. Daha spesifik/benzersiz adlar önce; ilk eşleşen kazanır.
export const EMULATORS: EmulatorDef[] = [
  { name: "PCSX2", systemId: "ps2", patterns: ["pcsx2"] },
  { name: "DuckStation", systemId: "ps1", patterns: ["duckstation"] },
  { name: "ePSXe", systemId: "ps1", patterns: ["epsxe"] },
  { name: "PCSX-Reloaded", systemId: "ps1", patterns: ["pcsxr"] },
  { name: "XEBRA", systemId: "ps1", patterns: ["xebra"] },
  { name: "RPCS3", systemId: "ps3", patterns: ["rpcs3"] },
  { name: "PPSSPP", systemId: "psp", patterns: ["ppsspp"] },
  { name: "Vita3K", systemId: "psvita", patterns: ["vita3k"] },
  { name: "Dolphin", systemId: "gamecube", patterns: ["dolphin"] },
  { name: "Cemu", systemId: "wiiu", patterns: ["cemu"] },
  { name: "Ryujinx", systemId: "switch", patterns: ["ryujinx"] },
  { name: "yuzu", systemId: "switch", patterns: ["yuzu"] },
  { name: "Eden", systemId: "switch", patterns: ["eden"] },
  { name: "Suyu", systemId: "switch", patterns: ["suyu"] },
  { name: "Sudachi", systemId: "switch", patterns: ["sudachi"] },
  { name: "Citra", systemId: "3ds", patterns: ["citra"] },
  { name: "Azahar", systemId: "3ds", patterns: ["azahar"] },
  { name: "Lime3DS", systemId: "3ds", patterns: ["lime3ds"] },
  { name: "Panda3DS", systemId: "3ds", patterns: ["panda3ds"] },
  { name: "DeSmuME", systemId: "nds", patterns: ["desmume"] },
  { name: "melonDS", systemId: "nds", patterns: ["melonds"] },
  { name: "mGBA", systemId: "gba", patterns: ["mgba"] },
  { name: "VisualBoyAdvance", systemId: "gba", patterns: ["visualboy"] },
  { name: "Snes9x", systemId: "snes", patterns: ["snes9x"] },
  { name: "bsnes", systemId: "snes", patterns: ["bsnes"] },
  { name: "higan", systemId: "snes", patterns: ["higan"] },
  { name: "Mesen", systemId: "nes", patterns: ["mesen"] },
  { name: "FCEUX", systemId: "nes", patterns: ["fceux"] },
  { name: "Nestopia", systemId: "nes", patterns: ["nestopia"] },
  { name: "Project64", systemId: "n64", patterns: ["project64"] },
  { name: "Mupen64Plus", systemId: "n64", patterns: ["mupen"] },
  { name: "simple64", systemId: "n64", patterns: ["simple64"] },
  { name: "Flycast", systemId: "dreamcast", patterns: ["flycast"] },
  { name: "Redream", systemId: "dreamcast", patterns: ["redream"] },
  { name: "Reicast", systemId: "dreamcast", patterns: ["reicast"] },
  { name: "Yabause", systemId: "saturn", patterns: ["yabause"] },
  { name: "Kega Fusion", systemId: "genesis", patterns: ["kega"] },
  { name: "BlastEm", systemId: "genesis", patterns: ["blastem"] },
  { name: "xemu", systemId: "xbox", patterns: ["xemu"] },
  { name: "Xenia", systemId: "xbox360", patterns: ["xenia"] },
  { name: "Cxbx-Reloaded", systemId: "xbox", patterns: ["cxbx"] },
  { name: "Mednafen", systemId: "multi", patterns: ["mednafen"] },
  { name: "RetroArch", systemId: "multi", patterns: ["retroarch"] },
  { name: "MAME", systemId: "arcade", patterns: ["mame"] },
];

/** Verilen metinde (exe adı/klasör) bilinen bir emülatör arar. */
export function identifyEmulator(haystack: string): EmulatorDef | undefined {
  const h = haystack.toLowerCase();
  return EMULATORS.find((def) => def.patterns.some((p) => h.includes(p)));
}

/** Emülatör adı/exe'sinden emüle edilen sistemi tahmin eder. */
export function detectSystem(name: string, exePath: string): string | undefined {
  const file = exePath.split(/[\\/]/).pop() ?? "";
  return identifyEmulator(`${name} ${file}`)?.systemId;
}
