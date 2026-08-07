import { createPortal } from 'react-dom'
import { Button } from './Button'

/** Reemplazo con estilo propio para window.confirm() — nada de diálogos nativos del navegador. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <button aria-label="Cancelar" className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]" onClick={onCancel} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="animate-fade-in relative w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-lg)]"
      >
        <h2 className="text-base font-bold text-ink">{title}</h2>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
