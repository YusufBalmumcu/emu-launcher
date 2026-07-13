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

export type Brand = "Nintendo" | "Sony" | "Microsoft" | "Sega" | "Diğer";

/** Marka bölümlerinin görünüm sırası. */
export const BRAND_ORDER: Brand[] = ["Nintendo", "Sony", "Microsoft", "Sega", "Diğer"];

export interface GameSystem {
  id: string;
  /** Tam ad — açılır listede ve erişilebilirlik metninde kullanılır. */
  name: string;
  /** Kapak arka planı için marka rengi. */
  color: string;
  /** Konsol markası — marka gruplaması için. */
  brand: Brand;
  /** Yaklaşık çıkış yılı — marka içinde sıralama için. */
  release: number;
}

// Marka + çıkış yılına göre sıralı. Bu sıra hem açılır listede hem de
// varsayılan (elle sıralanmamış) düzende kullanılır.
export const SYSTEMS: GameSystem[] = [
  // Nintendo
  { id: "nes", name: "Nintendo NES", color: "#b0121a", brand: "Nintendo", release: 1983 },
  { id: "gb", name: "Game Boy", color: "#6d7b2e", brand: "Nintendo", release: 1989 },
  { id: "snes", name: "Super Nintendo (SNES)", color: "#4c469b", brand: "Nintendo", release: 1990 },
  { id: "n64", name: "Nintendo 64", color: "#0a9e46", brand: "Nintendo", release: 1996 },
  { id: "gbc", name: "Game Boy Color", color: "#c0398f", brand: "Nintendo", release: 1998 },
  { id: "gba", name: "Game Boy Advance", color: "#4b3fce", brand: "Nintendo", release: 2001 },
  { id: "gamecube", name: "Nintendo GameCube", color: "#5c4b9e", brand: "Nintendo", release: 2001 },
  { id: "nds", name: "Nintendo DS", color: "#6b7075", brand: "Nintendo", release: 2004 },
  { id: "wii", name: "Nintendo Wii", color: "#0a9bd6", brand: "Nintendo", release: 2006 },
  { id: "3ds", name: "Nintendo 3DS", color: "#d1232a", brand: "Nintendo", release: 2011 },
  { id: "wiiu", name: "Nintendo Wii U", color: "#0aa3e0", brand: "Nintendo", release: 2012 },
  { id: "switch", name: "Nintendo Switch", color: "#e60012", brand: "Nintendo", release: 2017 },
  // Sony
  { id: "ps1", name: "PlayStation", color: "#2b6cb0", brand: "Sony", release: 1994 },
  { id: "ps2", name: "PlayStation 2", color: "#1d3fa0", brand: "Sony", release: 2000 },
  { id: "psp", name: "PlayStation Portable", color: "#20242b", brand: "Sony", release: 2004 },
  { id: "ps3", name: "PlayStation 3", color: "#2d3436", brand: "Sony", release: 2006 },
  { id: "psvita", name: "PlayStation Vita", color: "#1f6feb", brand: "Sony", release: 2011 },
  { id: "ps4", name: "PlayStation 4", color: "#0a4bd0", brand: "Sony", release: 2013 },
  { id: "ps5", name: "PlayStation 5", color: "#1a1a2e", brand: "Sony", release: 2020 },
  // Microsoft
  { id: "xbox", name: "Xbox", color: "#107c10", brand: "Microsoft", release: 2001 },
  { id: "xbox360", name: "Xbox 360", color: "#0e7a0e", brand: "Microsoft", release: 2005 },
  // Sega
  { id: "mastersystem", name: "Sega Master System", color: "#b01018", brand: "Sega", release: 1985 },
  { id: "genesis", name: "Sega Genesis", color: "#17559e", brand: "Sega", release: 1988 },
  { id: "megadrive", name: "Sega Mega Drive", color: "#1a1a1a", brand: "Sega", release: 1988 },
  { id: "gamegear", name: "Sega Game Gear", color: "#1f2429", brand: "Sega", release: 1990 },
  { id: "saturn", name: "Sega Saturn", color: "#26262b", brand: "Sega", release: 1994 },
  { id: "dreamcast", name: "Sega Dreamcast", color: "#d9640c", brand: "Sega", release: 1998 },
  // Diğer
  { id: "arcade", name: "Arcade", color: "#c026d3", brand: "Diğer", release: 9990 },
  { id: "mame", name: "MAME (Arcade)", color: "#a21caf", brand: "Diğer", release: 9991 },
  { id: "multi", name: "RetroArch / Çok Sistemli", color: "#3f4756", brand: "Diğer", release: 9999 },
];

const SYSTEM_BY_ID = new Map(SYSTEMS.map((s) => [s.id, s]));

export function getSystem(id: string | undefined): GameSystem | undefined {
  return id ? SYSTEM_BY_ID.get(id) : undefined;
}

/** Sistemi bilinmeyen emülatörler "Diğer" markasına düşer. */
export function brandOf(systemId: string | undefined): Brand {
  return getSystem(systemId)?.brand ?? "Diğer";
}

function brandRank(brand: Brand): number {
  const i = BRAND_ORDER.indexOf(brand);
  return i === -1 ? BRAND_ORDER.length : i;
}

/**
 * Varsayılan sıralama karşılaştırıcısı: önce marka, sonra çıkış yılı, sonra ad.
 * (ör. PS1 → PS2 → PS3; GameCube → 3DS → Switch)
 */
export function compareByBrandRelease(
  a: { systemId?: string; name: string },
  b: { systemId?: string; name: string },
): number {
  const sa = getSystem(a.systemId);
  const sb = getSystem(b.systemId);
  const br = brandRank(sa?.brand ?? "Diğer") - brandRank(sb?.brand ?? "Diğer");
  if (br !== 0) return br;
  const ra = sa?.release ?? 100000;
  const rb = sb?.release ?? 100000;
  if (ra !== rb) return ra - rb;
  return a.name.localeCompare(b.name, "tr");
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
