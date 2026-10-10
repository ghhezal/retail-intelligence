import React from 'react'

export function LoadingSkeleton({ className = '', variant = 'line', count = 1 }) {
  const items = Array.from({ length: count }, (_, i) => i)

  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-xl p-5 border border-slate-200 shadow-xs animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-slate-200 rounded-md w-28" />
          <div className="w-8 h-8 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-8 bg-slate-200 rounded-md w-36 mb-2" />
        <div className="h-3 bg-slate-100 rounded-md w-20" />
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-4">
          <div className="h-4 bg-slate-200 rounded-md w-32 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded-md w-24 animate-pulse" />
        </div>
        <div className="divide-y divide-slate-100">
          {items.map((key) => (
            <div key={key} className="p-4 flex items-center justify-between gap-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded-md w-1/4" />
              <div className="h-4 bg-slate-100 rounded-md w-1/6" />
              <div className="h-4 bg-slate-100 rounded-md w-1/6" />
              <div className="h-4 bg-slate-200 rounded-md w-1/8" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {items.map((key) => (
        <div key={key} className={`h-4 bg-slate-200 rounded-md animate-pulse ${className}`} />
      ))}
    </div>
  )
}

export default LoadingSkeleton
