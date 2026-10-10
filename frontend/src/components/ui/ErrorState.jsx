import React from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from './Button'

export function ErrorState({
  title = 'Failed to load data',
  message = 'An error occurred while contacting the server.',
  onRetry,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-rose-200 bg-rose-50/40 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-rose-900">{title}</h4>
      <p className="text-sm text-rose-700 max-w-md mt-1 mb-4 leading-relaxed font-mono text-xs bg-white/70 py-1.5 px-3 rounded-lg border border-rose-200">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={RotateCcw} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}

export default ErrorState
