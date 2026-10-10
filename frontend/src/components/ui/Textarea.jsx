import React, { forwardRef } from 'react'

export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helperText,
    id,
    name,
    rows = 3,
    required = false,
    className = '',
    ...props
  },
  ref
) {
  const textareaId = id || name || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        name={name}
        rows={rows}
        required={required}
        className={`block w-full rounded-lg border text-sm transition-colors py-2 px-3 text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 ${
          error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20' : 'border-slate-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  )
})

export default Textarea
