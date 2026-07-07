import { useCallback, useEffect, useRef, useState } from "react";
import { launchEmulator, loadEmulators, pickDirectory, saveEmulators, scanDirectory } from "./backend";
import ConfirmDialog from "./components/ConfirmDialog";
import EmulatorCard from "./components/EmulatorCard";
import EmulatorModal from "./components/EmulatorModal";
import ScanReviewModal, { type DetectedEmulator } from "./components/ScanReviewModal";
import { identifyEmulator } from "./systems";
import logoUrl from "./assets/logo.svg";
import type { Emulator } from "./types";

interface Toast {
  message: string;
  kind: "error" | "success";
}

interface ScanState {
  dir: string;
  found: DetectedEmulator[];
}

export default function App() {
  const [emulators, setEmulators] = useState<Emulator[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; editing: Emulator | null }>({
    open: false,
    editing: null,
  });
  const [deleting, setDeleting] = useState<Emulator | null>(null);
  const [scan, setScan] = useState<ScanState | null>(null);
  const [scanning, setScanning] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const showToast = useCallback((message: string, kind: Toast["kind"]) => {
    setToast({ message, kind });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    loadEmulators()
      .then(setEmulators)
      .catch((e) => showToast(String(e), "error"))
      .finally(() => setLoaded(true));
  }, [showToast]);

  async function persist(next: Emulator[]) {
    setEmulators(next);
    try {
      await saveEmulators(next);
    } catch (e) {
      showToast(String(e), "error");
    }
  }

  function handleSave(name: string, exePath: string, systemId?: string) {
    if (modal.editing) {
      persist(
        emulators.map((em) =>
          em.id === modal.editing!.id ? { ...em, name, exePath, systemId } : em,
        ),
      );
    } else {
      persist([...emulators, { id: crypto.randomUUID(), name, exePath, systemId }]);
    }
    setModal({ open: false, editing: null });
  }

  function handleDelete() {
    if (!deleting) return;
    persist(emulators.filter((em) => em.id !== deleting.id));
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

  async function handleScan() {
    const dir = await pickDirectory();
    if (!dir) return;
    setScanning(true);
    try {
      const exes = await scanDirectory(dir);
      const existing = new Set(emulators.map((e) => e.exePath.toLowerCase()));

      // Aynı klasördeki aynı emülatöre ait birden çok exe'yi tekilleştir:
      // (klasör yolu + emülatör adı) başına en kısa dosya adını (genelde ana
      // başlatıcı) seç.
      const groups = new Map<string, { def: ReturnType<typeof identifyEmulator>; best: (typeof exes)[number] }>();
      for (const ex of exes) {
        // Tanımayı yalnızca exe dosya adına göre yap; klasör adına bakmak,
        // emülatör klasöründeki updater/uninstaller gibi çöp exe'lerin de o
        // emülatör sanılmasına yol açar.
        const def = identifyEmulator(ex.fileName);
        if (!def) continue;
        const parent = ex.path.slice(0, ex.path.length - ex.fileName.length).toLowerCase();
        const key = `${parent}|${def.name}`;
        const group = groups.get(key);
        if (!group) {
          groups.set(key, { def, best: ex });
        } else if (ex.fileName.length < group.best.fileName.length) {
          group.best = ex;
        }
      }

      const found: DetectedEmulator[] = [];
      for (const { def, best } of groups.values()) {
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
      persist([...emulators, ...additions]);
      showToast(`${additions.length} emülatör eklendi`, "success");
    }
    setScan(null);
  }

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

      {/* İçerik */}
      <main className="flex-1 overflow-y-auto px-8 py-6">
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
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
            {emulators.map((em) => (
              <EmulatorCard
                key={em.id}
                emulator={em}
                onLaunch={handleLaunch}
                onEdit={(target) => setModal({ open: true, editing: target })}
                onDelete={setDeleting}
              />
            ))}
          </div>
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
