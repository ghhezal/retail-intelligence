import React from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Clock, Check, HelpCircle } from 'lucide-react'

export function StatusBadge({ status, type = 'stock', text, size = 'sm' }) {
  const s = String(status || '').toLowerCase()

  let config = {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: HelpCircle,
    label: text || s || 'Unknown',
  }

  if (type === 'stock') {
    if (s === 'out_of_stock' || s === '0') {
      config = {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        icon: XCircle,
        label: text || 'Out of Stock',
      }
    } else if (s === 'low_stock' || s === 'true') {
      config = {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: AlertTriangle,
        label: text || 'Low Stock',
      }
    } else if (s === 'in_stock' || s === 'false') {
      config = {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: CheckCircle2,
        label: text || 'In Stock',
      }
    } else if (s === 'not_stocked') {
      config = {
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200',
        icon: HelpCircle,
        label: text || 'Not Stocked',
      }
    }
  } else if (type === 'order' || type === 'transfer') {
    if (s === 'draft') {
      config = {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: Clock,
        label: text || 'Draft',
      }
    } else if (s === 'received') {
      config = {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: Check,
        label: text || 'Received',
      }
    } else if (s === 'completed') {
      config = {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: CheckCircle2,
        label: text || 'Completed',
      }
    }
  } else if (type === 'product') {
    if (s === 'true' || s === 'active') {
      config = {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: CheckCircle2,
        label: text || 'Active',
      }
    } else {
      config = {
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200',
        icon: XCircle,
        label: text || 'Inactive',
      }
    }
  } else if (type === 'payment') {
    if (s === 'cash') {
      config = {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: null,
        label: 'Cash',
      }
    } else if (s === 'card') {
      config = {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: null,
        label: 'Card',
      }
    } else if (s === 'bank_transfer') {
      config = {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        icon: null,
        label: 'Bank Transfer',
      }
    }
  }

  const IconComponent = config.icon

  const sizeClasses =
    size === 'xs'
      ? 'px-2 py-0.5 text-[11px] gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5'

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      {IconComponent && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      {config.label}
    </span>
  )
}

export default StatusBadge
