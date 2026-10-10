import React from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react'

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  iconType = 'danger',
}) {
  const icons = {
    danger: <AlertTriangle className="w-6 h-6 text-rose-600" />,
    warning: <AlertCircle className="w-6 h-6 text-amber-600" />,
    info: <HelpCircle className="w-6 h-6 text-blue-600" />,
  }

  const iconBg = {
    danger: 'bg-rose-100',
    warning: 'bg-amber-100',
    info: 'bg-blue-100',
  }

  return (
    <Modal isOpen={isOpen} onClose={isLoading ? undefined : onClose} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl shrink-0 ${iconBg[iconType] || iconBg.danger}`}>
          {icons[iconType] || icons.danger}
        </div>
        <div className="flex-1">
          <h4 className="text-base font-semibold text-slate-900">{title}</h4>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
        <Button variant="outline" size="md" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant={variant}
          size="md"
          isLoading={isLoading}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
