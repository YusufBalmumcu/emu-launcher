import { useEffect, useState } from "react";

interface Props {
  title: string;
  initial?: string;
  placeholder?: string;
  confirmLabel: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}

export default function TextPromptModal({
  title,
  initial = "",
  placeholder,
  confirmLabel,
  onSubmit,
  onClose,
}: Props) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit() {
    const v = value.trim();
    if (v) onSubmit(v);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-stroke bg-surface-raised p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={placeholder}
          className="w-full rounded-lg border border-stroke bg-surface px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-accent"
        />
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            İptal
          </button>
          <button
            onClick={submit}
            disabled={!value.trim()}
            className="cursor-pointer rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
