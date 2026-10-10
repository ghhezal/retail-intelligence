import React from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200 shadow-xs">
        <AlertCircle className="w-8 h-8 text-slate-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Page Not Found</h2>
      <p className="text-sm text-slate-500 max-w-sm mt-1.5 mb-6 leading-relaxed">
        The destination you are looking for does not exist or may have been moved.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" size="md" icon={ArrowLeft}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  )
}

export default NotFound
