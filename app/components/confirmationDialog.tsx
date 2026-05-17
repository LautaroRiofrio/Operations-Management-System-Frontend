'use client'

type ConfirmationDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  isConfirming?: boolean;
  isOpen: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  tone?: 'danger' | 'neutral';
};

export default function ConfirmationDialog({
  cancelLabel = 'Cancelar',
  confirmLabel = 'Confirmar',
  isConfirming = false,
  isOpen,
  message,
  onCancel,
  onConfirm,
  title = 'Confirmar accion',
  tone = 'neutral',
}: ConfirmationDialogProps) {
  if (!isOpen) {
    return null;
  }

  const confirmButtonClass =
    tone === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300'
      : 'bg-neutral-900 text-white hover:bg-neutral-700 disabled:bg-neutral-400';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-6"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-message"
      >
        <div className="space-y-3">
          <h2 id="confirmation-dialog-title" className="text-2xl font-semibold text-neutral-900">
            {title}
          </h2>
          <p id="confirmation-dialog-message" className="text-sm leading-6 text-neutral-600">
            {message}
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${confirmButtonClass}`}
          >
            {isConfirming ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
