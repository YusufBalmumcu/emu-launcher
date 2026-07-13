import { useEffect } from "react";
import type { CustomGroup, Emulator } from "../types";

interface Props {
  emulator: Emulator;
  groups: CustomGroup[];
  onPick: (groupId: string | undefined) => void;
  onCreateNew: () => void;
  onClose: () => void;
}

export default function GroupPickerModal({
  emulator,
  groups,
  onPick,
  onCreateNew,
  onClose,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-sm flex-col rounded-2xl border border-stroke bg-surface-raised p-5 shadow-2xl">
        <h2 className="mb-1 text-base font-semibold text-white">Gruba Taşı</h2>
        <p className="mb-4 truncate text-xs text-white/40">{emulator.name}</p>

        <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
          {groups.length === 0 && (
            <p className="px-1 py-2 text-sm text-white/40">Henüz grup yok.</p>
          )}
          {groups.map((g) => {
            const active = emulator.groupId === g.id;
            return (
              <button
                key={g.id}
                onClick={() => onPick(g.id)}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  active
                    ? "bg-accent/15 text-white"
                    : "cursor-pointer text-white/80 hover:bg-surface-hover"
                }`}
              >
                <span className="truncate">{g.name}</span>
                {active && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-accent">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex flex-col gap-1 border-t border-stroke pt-2">
          <button
            onClick={onCreateNew}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-accent transition-colors hover:bg-surface-hover"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Yeni grup oluştur…
          </button>
          {emulator.groupId && (
            <button
              onClick={() => onPick(undefined)}
              className="cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm text-white/60 transition-colors hover:bg-surface-hover hover:text-white"
            >
              Gruptan çıkar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
