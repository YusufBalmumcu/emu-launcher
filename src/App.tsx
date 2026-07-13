import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  launchEmulator,
  loadState,
  pickDirectory,
  saveState,
  scanDirectory,
} from "./backend";
import ConfirmDialog from "./components/ConfirmDialog";
import EmulatorCard from "./components/EmulatorCard";
import EmulatorModal from "./components/EmulatorModal";
import GroupPickerModal from "./components/GroupPickerModal";
import ScanReviewModal, { type DetectedEmulator } from "./components/ScanReviewModal";
import TextPromptModal from "./components/TextPromptModal";
import { buildSections, orderedEmulators, reorder, sectionKeyOf } from "./grouping";
import { identifyEmulator } from "./systems";
import logoUrl from "./assets/logo.svg";
import type { AppState, CustomGroup, Emulator, GroupingMode } from "./types";

interface Toast {
  message: string;
  kind: "error" | "success";
}

interface ScanState {
  dir: string;
  found: DetectedEmulator[];
}

type GroupPrompt =
  | { kind: "create" }
  | { kind: "create-assign"; emulator: Emulator }
  | { kind: "rename"; group: CustomGroup };

const MODE_LABEL: Record<GroupingMode, string> = {
  flat: "Liste",
  brand: "Marka",
  custom: "Gruplar",
};

const INITIAL_STATE: AppState = {
  emulators: [],
  groups: [],
  settings: { grouping: "flat", manualSort: false },
};

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; editing: Emulator | null }>({
    open: false,
    editing: null,
  });
  const [deleting, setDeleting] = useState<Emulator | null>(null);
  const [scan, setScan] = useState<ScanState | null>(null);
  const [scanning, setScanning] = useState(false);
  const [groupPicker, setGroupPicker] = useState<Emulator | null>(null);
  const [groupPrompt, setGroupPrompt] = useState<GroupPrompt | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  // Sürükle-bırak durumu
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Üzerine gelinen emülatörün konsol rengi — uygulama arka planını yumuşakça boyar.
  const [hoverColor, setHoverColor] = useState<string | null>(null);

  const showToast = useCallback((message: string, kind: Toast["kind"]) => {
    setToast({ message, kind });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    loadState()
      .then(setState)
      .catch((e) => showToast(String(e), "error"))
      .finally(() => setLoaded(true));
  }, [showToast]);

  // Tek yazma noktası: state'i güncelle ve diske kaydet.
  const commit = useCallback(
    (next: AppState) => {
      setState(next);
      saveState(next).catch((e) => showToast(String(e), "error"));
    },
    [showToast],
  );

  const { emulators, groups, settings } = state;

  const ordered = useMemo(() => orderedEmulators(state), [state]);
  const sections = useMemo(
    () => buildSections(ordered, settings.grouping, groups),
    [ordered, settings.grouping, groups],
  );

  // ---- emülatör CRUD ----
  function handleSave(name: string, exePath: string, systemId?: string) {
    const nextEmulators = modal.editing
      ? emulators.map((em) =>
          em.id === modal.editing!.id ? { ...em, name, exePath, systemId } : em,
        )
      : [...emulators, { id: crypto.randomUUID(), name, exePath, systemId }];
    commit({ ...state, emulators: nextEmulators });
    setModal({ open: false, editing: null });
  }

  function handleDelete() {
    if (!deleting) return;
    commit({ ...state, emulators: emulators.filter((em) => em.id !== deleting.id) });
    setDeleting(null);
  }

  async function handleLaunch(emulator: Emulator) {
    try {
      await launchEmulator(emulator.exePath);
      showToast(`${emulator.name} başlatıldı`, "success");
    } catch (e) {
      showToast(String(e), "error");
    }
  }

  // ---- klasör tarama ----
  async function handleScan() {
    const dir = await pickDirectory();
    if (!dir) return;
    setScanning(true);
    try {
      const exes = await scanDirectory(dir);
      const existing = new Set(emulators.map((e) => e.exePath.toLowerCase()));

      // Aynı klasördeki aynı emülatörün birden çok exe'sini tekilleştir:
      // (klasör yolu + emülatör adı) başına en kısa dosya adını seç.
      const found_groups = new Map<
        string,
        { def: ReturnType<typeof identifyEmulator>; best: (typeof exes)[number] }
      >();
      for (const ex of exes) {
        const def = identifyEmulator(ex.fileName);
        if (!def) continue;
        const parent = ex.path.slice(0, ex.path.length - ex.fileName.length).toLowerCase();
        const key = `${parent}|${def.name}`;
        const g = found_groups.get(key);
        if (!g) found_groups.set(key, { def, best: ex });
        else if (ex.fileName.length < g.best.fileName.length) g.best = ex;
      }

      const found: DetectedEmulator[] = [];
      for (const { def, best } of found_groups.values()) {
        if (!def) continue;
        found.push({
          name: def.name,
          systemId: def.systemId,
          exePath: best.path,
          already: existing.has(best.path.toLowerCase()),
        });
      }
      found.sort((a, b) => a.name.localeCompare(b.name, "tr"));

      if (found.length === 0) {
        showToast("Bu klasörde tanınan emülatör bulunamadı.", "error");
        return;
      }
      setScan({ dir, found });
    } catch (e) {
      showToast(String(e), "error");
    } finally {
      setScanning(false);
    }
  }

  function handleImport(selected: DetectedEmulator[]) {
    const existing = new Set(emulators.map((e) => e.exePath.toLowerCase()));
    const additions = selected
      .filter((s) => !existing.has(s.exePath.toLowerCase()))
      .map((s) => ({
        id: crypto.randomUUID(),
        name: s.name,
        exePath: s.exePath,
        systemId: s.systemId,
      }));
    if (additions.length > 0) {
      commit({ ...state, emulators: [...emulators, ...additions] });
      showToast(`${additions.length} emülatör eklendi`, "success");
    }
    setScan(null);
  }

  // ---- görünüm / sıralama ----
  function setGrouping(mode: GroupingMode) {
    commit({ ...state, settings: { ...settings, grouping: mode } });
  }
  function resetOrder() {
    commit({ ...state, settings: { ...settings, manualSort: false } });
  }

  // ---- gruplar ----
  function assignToGroup(emulator: Emulator, groupId: string | undefined) {
    commit({
      ...state,
      emulators: emulators.map((e) => (e.id === emulator.id ? { ...e, groupId } : e)),
    });
  }
  function deleteGroup(group: CustomGroup) {
    commit({
      ...state,
      groups: groups.filter((g) => g.id !== group.id),
      emulators: emulators.map((e) =>
        e.groupId === group.id ? { ...e, groupId: undefined } : e,
      ),
    });
  }
  function handleGroupPromptSubmit(name: string) {
    if (!groupPrompt) return;
    if (groupPrompt.kind === "rename") {
      commit({
        ...state,
        groups: groups.map((g) =>
          g.id === groupPrompt.group.id ? { ...g, name } : g,
        ),
      });
    } else if (groupPrompt.kind === "create") {
      commit({ ...state, groups: [...groups, { id: crypto.randomUUID(), name }] });
    } else {
      // create-assign: grubu oluştur ve emülatörü ata
      const g = { id: crypto.randomUUID(), name };
      commit({
        ...state,
        groups: [...groups, g],
        emulators: emulators.map((e) =>
          e.id === groupPrompt.emulator.id ? { ...e, groupId: g.id } : e,
        ),
      });
    }
    setGroupPrompt(null);
  }

  // ---- sürükle-bırak ----
  const dragSectionKey = (id: string): string => {
    const e = emulators.find((x) => x.id === id);
    return e ? sectionKeyOf(e, settings.grouping, groups) : "";
  };

  function onCardDragOver(target: Emulator) {
    if (!dragId || target.id === dragId) return;
    if (dragSectionKey(dragId) !== sectionKeyOf(target, settings.grouping, groups)) return;
    if (overId !== target.id) setOverId(target.id);
  }
  function onCardDrop(target: Emulator) {
    if (dragId && target.id !== dragId) {
      const sec = dragSectionKey(dragId);
      if (sec === sectionKeyOf(target, settings.grouping, groups)) {
        commit({
          ...state,
          emulators: reorder(state, dragId, target.id, sec),
          settings: { ...settings, manualSort: true },
        });
      }
    }
    setDragId(null);
    setOverId(null);
  }
  function onSectionDrop(sectionKey: string) {
    if (dragId && dragSectionKey(dragId) === sectionKey) {
      commit({
        ...state,
        emulators: reorder(state, dragId, null, sectionKey),
        settings: { ...settings, manualSort: true },
      });
    }
    setDragId(null);
    setOverId(null);
  }

  const showToolbar = loaded && emulators.length > 0;

  return (
    <div className="flex h-screen flex-col">
      {/* Üst çubuk */}
      <header className="flex shrink-0 items-center justify-between border-b border-stroke px-8 py-5">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Emu Launcher" draggable={false} className="h-11 w-auto" />
          {emulators.length > 0 && (
            <span className="text-sm text-white/35">{emulators.length} emülatör</span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-stroke bg-surface-hover px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:border-accent/60 hover:text-white disabled:cursor-wait disabled:opacity-60"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
            </svg>
            {scanning ? "Taranıyor…" : "Klasör Tara"}
          </button>
          <button
            onClick={() => setModal({ open: true, editing: null })}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Emülatör Ekle
          </button>
        </div>
      </header>

      {/* Görünüm çubuğu */}
      {showToolbar && (
        <div className="flex shrink-0 items-center justify-between border-b border-stroke px-8 py-2.5">
          <div className="flex items-center rounded-lg border border-stroke bg-surface p-0.5">
            {(Object.keys(MODE_LABEL) as GroupingMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setGrouping(m)}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  settings.grouping === m
                    ? "bg-accent text-white"
                    : "text-white/55 hover:text-white"
                }`}
              >
                {MODE_LABEL[m]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {settings.manualSort && (
              <button
                onClick={resetOrder}
                title="Elle sürükleme sırasını temizle, varsayılana dön"
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-stroke px-3 py-1.5 text-sm font-medium text-white/60 transition-colors hover:border-accent/60 hover:text-white"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.4 2.6L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Sıralamayı sıfırla
              </button>
            )}
            {settings.grouping === "custom" && (
              <button
                onClick={() => setGroupPrompt({ kind: "create" })}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-stroke px-3 py-1.5 text-sm font-medium text-white/80 transition-colors hover:border-accent/60 hover:text-white"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Yeni Grup
              </button>
            )}
          </div>
        </div>
      )}

      {/* İçerik */}
      <main
        className="flex-1 overflow-y-auto px-8 py-6 transition-colors duration-500"
        onMouseLeave={() => setHoverColor(null)}
        style={{
          backgroundColor: hoverColor
            ? `color-mix(in srgb, ${hoverColor} 14%, var(--color-surface))`
            : undefined,
        }}
      >
        {loaded && emulators.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-stroke bg-surface-raised">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
                <line x1="6" y1="11" x2="10" y2="11" />
                <line x1="8" y1="9" x2="8" y2="13" />
                <line x1="15" y1="12" x2="15.01" y2="12" />
                <line x1="18" y1="10" x2="18.01" y2="10" />
                <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-medium text-white/70">Henüz emülatör eklenmedi</p>
              <p className="mt-1 text-sm text-white/40">
                Tek tek eklemek için "Emülatör Ekle", bir klasördeki tüm
                emülatörleri otomatik bulmak için "Klasör Tara" butonunu kullan.
              </p>
            </div>
          </div>
        ) : (
          sections.map((section) => (
            <section
              key={section.key}
              className="mb-8 last:mb-0"
              onDragOver={(e) => {
                if (dragId && dragSectionKey(dragId) === section.key) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                onSectionDrop(section.key);
              }}
            >
              {section.title !== null && (
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70">
                    {section.title}
                  </h2>
                  <span className="text-xs text-white/30">{section.items.length}</span>
                  {section.group && (
                    <div className="ml-1 flex gap-1">
                      <button
                        onClick={() =>
                          setGroupPrompt({ kind: "rename", group: section.group! })
                        }
                        aria-label="Grubu yeniden adlandır"
                        title="Yeniden adlandır"
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-white/40 transition-colors hover:bg-surface-hover hover:text-white"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteGroup(section.group!)}
                        aria-label="Grubu sil"
                        title="Grubu sil (emülatörler silinmez)"
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-white/40 transition-colors hover:bg-red-600/80 hover:text-white"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
                {section.items.map((em) => (
                  <EmulatorCard
                    key={em.id}
                    emulator={em}
                    onLaunch={handleLaunch}
                    onEdit={(target) => setModal({ open: true, editing: target })}
                    onDelete={setDeleting}
                    onGroup={
                      settings.grouping === "custom" ? (e) => setGroupPicker(e) : undefined
                    }
                    onDragStartCard={(e) => {
                      setDragId(e.id);
                      setOverId(null);
                    }}
                    onDragOverCard={onCardDragOver}
                    onDropCard={onCardDrop}
                    onDragEndCard={() => {
                      setDragId(null);
                      setOverId(null);
                    }}
                    dragging={dragId === em.id}
                    dropTarget={overId === em.id}
                    onHover={setHoverColor}
                  />
                ))}
                {section.items.length === 0 && (
                  <div className="col-span-full rounded-xl border border-dashed border-stroke/70 px-4 py-8 text-center text-sm text-white/30">
                    Bu grup boş — bir karttaki klasör simgesine tıklayıp emülatörü buraya taşı.
                  </div>
                )}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Modallar */}
      {modal.open && (
        <EmulatorModal
          initial={modal.editing}
          onSave={handleSave}
          onClose={() => setModal({ open: false, editing: null })}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Emülatörü Sil"
          message={`"${deleting.name}" listeden kaldırılacak. Bu işlem dosyaları silmez, sadece kaydı kaldırır.`}
          confirmLabel="Sil"
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
      {scan && (
        <ScanReviewModal
          dir={scan.dir}
          found={scan.found}
          onConfirm={handleImport}
          onClose={() => setScan(null)}
        />
      )}
      {groupPicker && (
        <GroupPickerModal
          emulator={groupPicker}
          groups={groups}
          onPick={(groupId) => {
            assignToGroup(groupPicker, groupId);
            setGroupPicker(null);
          }}
          onCreateNew={() => {
            setGroupPrompt({ kind: "create-assign", emulator: groupPicker });
            setGroupPicker(null);
          }}
          onClose={() => setGroupPicker(null)}
        />
      )}
      {groupPrompt && (
        <TextPromptModal
          title={groupPrompt.kind === "rename" ? "Grubu Yeniden Adlandır" : "Yeni Grup"}
          initial={groupPrompt.kind === "rename" ? groupPrompt.group.name : ""}
          placeholder="Grup adı, ör. Favoriler"
          confirmLabel={groupPrompt.kind === "rename" ? "Kaydet" : "Oluştur"}
          onSubmit={handleGroupPromptSubmit}
          onClose={() => setGroupPrompt(null)}
        />
      )}

      {/* Bildirim */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-xl backdrop-blur-md ${
            toast.kind === "error"
              ? "border-red-500/40 bg-red-950/80 text-red-200"
              : "border-emerald-500/40 bg-emerald-950/80 text-emerald-200"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
