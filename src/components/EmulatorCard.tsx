import { resolveArtworkSync } from "../artwork";
import { getSystem } from "../systems";
import type { Emulator } from "../types";

interface Props {
  emulator: Emulator;
  onLaunch: (emulator: Emulator) => void;
  onEdit: (emulator: Emulator) => void;
  onDelete: (emulator: Emulator) => void;
}

// Sistemi bilinmeyen emülatörler için isimden deterministik gradyan.
const GRADIENTS = [
  "from-indigo-500/80 to-blue-700/80",
  "from-fuchsia-500/80 to-purple-800/80",
  "from-emerald-500/80 to-teal-800/80",
  "from-orange-500/80 to-rose-700/80",
  "from-cyan-500/80 to-sky-800/80",
  "from-violet-500/80 to-indigo-800/80",
  "from-rose-500/80 to-red-800/80",
  "from-amber-500/80 to-orange-800/80",
];

function gradientFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function monogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function fileName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

// Marka renginden açık/koyu ton üretir (f>1 açar, f<1 koyultur).
function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) * f);
  const g = clamp(((n >> 8) & 255) * f);
  const b = clamp((n & 255) * f);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function EmulatorCard({ emulator, onLaunch, onEdit, onDelete }: Props) {
  const system = getSystem(emulator.systemId);
  const logo = resolveArtworkSync({ kind: "system-icon", systemId: emulator.systemId });

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl border border-stroke bg-surface-raised transition-all duration-200 hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_8px_30px_rgba(109,141,255,0.15)]"
      onDoubleClick={() => onLaunch(emulator)}
      title={emulator.exePath}
    >
      {/* Kapak alanı */}
      <div
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden"
        style={
          system
            ? {
                backgroundImage: `linear-gradient(135deg, ${shade(system.color, 1.25)}, ${shade(system.color, 0.55)})`,
              }
            : undefined
        }
      >
        {logo ? (
          <img
            src={logo}
            alt={system?.name ?? emulator.name}
            draggable={false}
            className="max-h-[46%] max-w-[80%] object-contain drop-shadow-md"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(emulator.name)}`}>
            <span className="text-5xl font-bold tracking-wide text-white/90 drop-shadow-lg">
              {monogram(emulator.name)}
            </span>
          </div>
        )}

        {/* Hover'da başlat butonu */}
        <button
          onClick={() => onLaunch(emulator)}
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/45 group-hover:opacity-100"
          aria-label={`${emulator.name} başlat`}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-black shadow-xl transition-transform duration-200 hover:scale-110">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>

        {/* Düzenle / Sil */}
        <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(emulator);
            }}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-black/60 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-white"
            aria-label="Düzenle"
            title="Düzenle"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(emulator);
            }}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-black/60 text-white/80 backdrop-blur-sm transition-colors hover:bg-red-600/90 hover:text-white"
            aria-label="Sil"
            title="Sil"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bilgi alanı */}
      <div className="flex flex-col gap-0.5 px-3.5 py-3">
        <span className="truncate text-sm font-semibold text-white/95">{emulator.name}</span>
        <span className="truncate text-xs text-white/40">
          {system ? system.name : fileName(emulator.exePath)}
        </span>
      </div>
    </div>
  );
}
