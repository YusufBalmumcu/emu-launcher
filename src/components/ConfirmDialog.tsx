interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-stroke bg-surface-raised p-6 shadow-2xl">
        <h2 className="mb-2 text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-white/60">{message}</p>
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            autoFocus
            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            className="cursor-pointer rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
