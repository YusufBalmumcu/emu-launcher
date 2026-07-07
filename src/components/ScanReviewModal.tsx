import { useEffect, useState } from "react";
import { getSystem, systemLogo } from "../systems";

export interface DetectedEmulator {
  name: string;
  systemId: string;
  exePath: string;
  /** Bu yol zaten listede ekli mi? */
  already: boolean;
}

interface Props {
  dir: string;
  found: DetectedEmulator[];
  onConfirm: (selected: DetectedEmulator[]) => void;
  onClose: () => void;
}

export default function ScanReviewModal({ dir, found, onConfirm, onClose }: Props) {
  // Başlangıçta ekli olmayanların hepsi seçili.
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(found.filter((f) => !f.already).map((f) => f.exePath)),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggle(path: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  const addable = found.filter((f) => !f.already);
  const allSelected = addable.length > 0 && addable.every((f) => selected.has(f.exePath));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(addable.map((f) => f.exePath)));
  }

  function confirm() {
    onConfirm(found.filter((f) => selected.has(f.exePath)));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-full w-full max-w-lg flex-col rounded-2xl border border-stroke bg-surface-raised shadow-2xl">
        <div className="border-b border-stroke px-6 py-5">
          <h2 className="text-lg font-semibold text-white">Bulunan Emülatörler</h2>
          <p className="mt-1 truncate text-xs text-white/40" title={dir}>
            {dir}
          </p>
        </div>

        {/* Tümünü seç */}
        <div className="flex items-center justify-between px-6 py-2.5 text-sm">
          <span className="text-white/50">
            {found.length} sonuç · {selected.size} seçili
          </span>
          {addable.length > 0 && (
            <button
              onClick={toggleAll}
              className="cursor-pointer font-medium text-accent transition-colors hover:brightness-110"
            >
              {allSelected ? "Seçimi kaldır" : "Tümünü seç"}
            </button>
          )}
        </div>

        {/* Liste */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
          {found.map((f) => {
            const system = getSystem(f.systemId);
            const logo = systemLogo(f.systemId);
            const isChecked = selected.has(f.exePath);
            return (
              <label
                key={f.exePath}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  f.already ? "opacity-45" : "cursor-pointer hover:bg-surface-hover"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={f.already}
                  onChange={() => toggle(f.exePath)}
                  className="h-4 w-4 shrink-0 accent-[var(--color-accent)]"
                />
                <div
                  className="flex h-9 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-stroke"
                  style={system ? { backgroundColor: system.color } : undefined}
                >
                  {logo ? (
                    <img src={logo} alt="" className="max-h-[55%] max-w-[80%] object-contain" />
                  ) : (
                    <span className="text-[10px] text-white/40">?</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-white/95">{f.name}</span>
                    {f.already && (
                      <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
                        zaten ekli
                      </span>
                    )}
                  </div>
                  <span className="block truncate text-xs text-white/40" title={f.exePath}>
                    {system?.name ?? "Bilinmeyen sistem"} · {f.exePath}
                  </span>
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-stroke px-6 py-4">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            İptal
          </button>
          <button
            onClick={confirm}
            disabled={selected.size === 0}
            className="cursor-pointer rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ekle ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}
