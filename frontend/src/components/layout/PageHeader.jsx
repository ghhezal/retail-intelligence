import React from 'react'
import { Store } from 'lucide-react'

export function PageHeader({
  title,
  subtitle,
  branches = [],
  selectedBranch,
  onBranchChange,
  branchLabel = 'Filter Branch:',
  showAllBranchesOption = true,
  actions,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80 mb-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {branches && branches.length > 0 && onBranchChange && (
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-xs">
            <Store className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">{branchLabel}</span>
            <select
              value={selectedBranch === null || selectedBranch === undefined ? '' : selectedBranch}
              onChange={(e) => {
                const val = e.target.value
                onBranchChange(val === '' ? null : Number(val))
              }}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer pr-1"
            >
              {showAllBranchesOption && <option value="">All Branches</option>}
              {branches.map((b) => (
                <option key={b.branch_id} value={b.branch_id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </select>
          </div>
        )}

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export default PageHeader
