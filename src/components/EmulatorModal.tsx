import { useEffect, useState } from "react";
import { pickExecutable } from "../backend";
import { detectSystem, getSystem, SYSTEMS, systemLogo } from "../systems";
import type { Emulator } from "../types";

interface Props {
  /** null → yeni ekleme, dolu → düzenleme */
  initial: Emulator | null;
  onSave: (name: string, exePath: string, systemId?: string) => void;
  onClose: () => void;
}

function fileStem(path: string): string {
  const file = path.split(/[\\/]/).pop() ?? "";
  return file.replace(/\.exe$/i, "");
}

export default function EmulatorModal({ initial, onSave, onClose }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [exePath, setExePath] = useState(initial?.exePath ?? "");
  const [systemId, setSystemId] = useState(initial?.systemId ?? "");
  // Düzenlemede mevcut seçim korunur; eklemede ad/exe'den otomatik algılanır.
  const [systemTouched, setSystemTouched] = useState(initial != null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Kullanıcı sistemi elle seçmediyse, ad/exe değiştikçe otomatik algıla.
  useEffect(() => {
    if (systemTouched) return;
    setSystemId(detectSystem(name, exePath) ?? "");
  }, [name, exePath, systemTouched]);

  async function browse() {
    const selected = await pickExecutable();
    if (selected) {
      setExePath(selected);
      if (!name.trim()) setName(fileStem(selected));
    }
  }

  function submit() {
    if (!name.trim()) {
      setError("Bir isim gir.");
      return;
    }
    if (!exePath.trim()) {
      setError("Bir .exe dosyası seç.");
      return;
    }
    onSave(name.trim(), exePath.trim(), systemId || undefined);
  }

  const selectedSystem = getSystem(systemId);
  const previewLogo = systemLogo(systemId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-stroke bg-surface-raised p-6 shadow-2xl">
        <h2 className="mb-5 text-lg font-semibold text-white">
          {initial ? "Emülatörü Düzenle" : "Emülatör Ekle"}
        </h2>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-white/50">
              İsim
            </span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="örn. PCSX2"
              className="rounded-lg border border-stroke bg-surface px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-white/50">
              Çalıştırılabilir Dosya (.exe)
            </span>
            <div className="flex gap-2">
              <input
                value={exePath}
                onChange={(e) => setExePath(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="C:\...\pcsx2.exe"
                className="min-w-0 flex-1 rounded-lg border border-stroke bg-surface px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-accent"
              />
              <button
                onClick={browse}
                className="shrink-0 cursor-pointer rounded-lg border border-stroke bg-surface-hover px-3.5 text-sm font-medium text-white/80 transition-colors hover:border-accent/60 hover:text-white"
              >
                Gözat…
              </button>
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-white/50">
              Sistem
            </span>
            <div className="flex items-center gap-2">
              {/* Seçili sistemin logo önizlemesi */}
              <div
                className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stroke bg-surface"
                style={selectedSystem ? { backgroundColor: selectedSystem.color } : undefined}
              >
                {previewLogo ? (
                  <img src={previewLogo} alt="" className="max-h-[60%] max-w-[80%] object-contain" />
                ) : (
                  <span className="text-xs text-white/30">?</span>
                )}
              </div>
              <select
                value={systemId}
                onChange={(e) => {
                  setSystemTouched(true);
                  setSystemId(e.target.value);
                }}
                className="min-w-0 flex-1 cursor-pointer rounded-lg border border-stroke bg-surface px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-accent"
              >
                <option value="">Bilinmiyor</option>
                {SYSTEMS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            {!systemTouched && systemId && (
              <span className="text-xs text-white/40">
                Otomatik algılandı — istersen değiştir.
              </span>
            )}
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            İptal
          </button>
          <button
            onClick={submit}
            className="cursor-pointer rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
          >
            {initial ? "Kaydet" : "Ekle"}
          </button>
        </div>
      </div>
    </div>
  );
}
