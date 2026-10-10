import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Boxes,
  Search,
  Plus,
  Edit2,
  AlertTriangle,
  RotateCcw,
  Store,
  Info,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react'
import api from '../services/api'
import { useBranches } from '../context/BranchContext'
import { formatNumber, getStockStatus } from '../utils/format'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { StatusBadge } from '../components/ui/StatusBadge'
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { useToast } from '../components/ui/Toast'

export function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { branches } = useBranches()
  const { addToast } = useToast()

  // Initialize filters from URL params if present
  const initialBranch = searchParams.get('branch_id') ? Number(searchParams.get('branch_id')) : null
  const initialSearch = searchParams.get('search') || ''
  const initialLowStock = searchParams.get('low_stock_only') === 'true'

  const [selectedBranch, setSelectedBranch] = useState(initialBranch)
  const [search, setSearch] = useState(initialSearch)
  const [lowStockOnly, setLowStockOnly] = useState(initialLowStock)

  const [inventory, setInventory] = useState([])
  const [productsList, setProductsList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch active products list for the "Add Stock" modal
  const fetchProductsList = useCallback(async () => {
    try {
      const data = await api.get('/products/', { limit: 500, include_inactive: false })
      setProductsList(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load products list:', err)
    }
  }, [])

  useEffect(() => {
    fetchProductsList()
  }, [fetchProductsList])

  // Fetch Inventory Records
  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = {}
      if (selectedBranch) params.branch_id = selectedBranch
      if (search.trim()) params.search = search.trim()
      if (lowStockOnly) params.low_stock_only = true

      const data = await api.get('/inventory/', params)
      setInventory(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory records')
    } finally {
      setIsLoading(false)
    }
  }, [selectedBranch, search, lowStockOnly])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  // Sync state to URL search parameters for linkability
  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (selectedBranch) nextParams.set('branch_id', String(selectedBranch))
    if (search.trim()) nextParams.set('search', search.trim())
    if (lowStockOnly) nextParams.set('low_stock_only', 'true')
    setSearchParams(nextParams, { replace: true })
  }, [selectedBranch, search, lowStockOnly, setSearchParams])

  // Handle Add Stock record
  const handleAddStock = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.target)
    const payload = {
      branch_id: Number(formData.get('branch_id')),
      product_id: Number(formData.get('product_id')),
      quantity: parseInt(formData.get('quantity'), 10),
      reorder_level: parseInt(formData.get('reorder_level'), 10),
    }

    try {
      await api.post('/inventory/', payload)
      addToast('Inventory record created successfully', 'success')
      setIsAddOpen(false)
      fetchInventory()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Edit Stock (manual correction)
  const handleEditStock = async (e) => {
    e.preventDefault()
    if (!editItem) return
    setIsSubmitting(true)

    const formData = new FormData(e.target)
    const payload = {
      quantity: parseInt(formData.get('quantity'), 10),
      reorder_level: parseInt(formData.get('reorder_level'), 10),
    }

    try {
      await api.put(`/inventory/${editItem.branch_id}/${editItem.product_id}`, payload)
      addToast('Stock quantity & threshold updated', 'success')
      setEditItem(null)
      fetchInventory()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Aggregate stats
  const totalUnits = inventory.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0)
  const lowStockCount = inventory.filter((item) => item.low_stock).length
  const outOfStockCount = inventory.filter((item) => Number(item.quantity) <= 0).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branch Inventory"
        subtitle="Real-time physical stock counts, reorder thresholds, and branch inventory records"
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={fetchInventory}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsAddOpen(true)}
            >
              Add Stock Record
            </Button>
          </div>
        }
      />

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Visible Records</p>
          <p className="text-xl font-bold text-slate-900 mt-1 font-tabular">
            {formatNumber(inventory.length)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Available Units</p>
          <p className="text-xl font-bold text-blue-700 mt-1 font-tabular">
            {formatNumber(totalUnits)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Low Stock</p>
          <p className="text-xl font-bold text-amber-600 mt-1 font-tabular">
            {formatNumber(lowStockCount)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Out of Stock</p>
          <p className="text-xl font-bold text-rose-600 mt-1 font-tabular">
            {formatNumber(outOfStockCount)}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="sm:col-span-5">
            <Input
              placeholder="Search product name or SKU..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Branch Filter */}
          <div className="sm:col-span-4">
            <Select
              value={selectedBranch === null || selectedBranch === undefined ? '' : selectedBranch}
              onChange={(e) => {
                const val = e.target.value
                setSelectedBranch(val === '' ? null : Number(val))
              }}
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.branch_id} value={b.branch_id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </Select>
          </div>

          {/* Low Stock Toggle */}
          <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <span className="flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Low Stock Only
              </span>
            </label>

            {(search || selectedBranch !== null || lowStockOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setSelectedBranch(null)
                  setLowStockOnly(false)
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      {error ? (
        <ErrorState title="Failed to load inventory" message={error} onRetry={fetchInventory} />
      ) : isLoading ? (
        <LoadingSkeleton variant="table" count={8} />
      ) : inventory.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No inventory records found"
          description={
            lowStockOnly
              ? 'No products are currently at or below their reorder threshold.'
              : 'No stock records match the selected branch and search query.'
          }
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('')
            setSelectedBranch(null)
            setLowStockOnly(false)
          }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-center">Available Stock</th>
                  <th className="py-3 px-4 text-center">Reorder Threshold</th>
                  <th className="py-3 px-4 text-center">Stock Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {inventory.map((row) => {
                  const status = getStockStatus(row.quantity, row.reorder_level)
                  const isLow = row.low_stock

                  return (
                    <tr
                      key={`${row.branch_id}-${row.product_id}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isLow ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          <span>{row.branch}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 leading-tight">{row.product}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {row.sku}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-sm font-tabular">
                        <span
                          className={
                            Number(row.quantity) <= 0
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }
                        >
                          {formatNumber(row.quantity)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 font-tabular">
                        {formatNumber(row.reorder_level)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={status} type="stock" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Edit2}
                          onClick={() => setEditItem(row)}
                        >
                          Correct
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {inventory.length} branch stock records
            </span>
            <span className="text-[11px] text-slate-400">
              * Note: Products with no stock record for a branch are not listed. Use "Add Stock Record" to initialize.
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal: Add Stock Record */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Branch Stock Record"
        subtitle="Initialize inventory tracking for a product at a specific retail branch"
      >
        <form onSubmit={handleAddStock} className="space-y-4">
          <Select
            label="Retail Branch"
            name="branch_id"
            defaultValue={selectedBranch || ''}
            required
          >
            <option value="">Select Branch...</option>
            {branches.map((b) => (
              <option key={b.branch_id} value={b.branch_id}>
                {b.name} ({b.city})
              </option>
            ))}
          </Select>

          <Select label="Hardware Product" name="product_id" required>
            <option value="">Select Product...</option>
            {productsList.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.name} [{p.sku}]
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Opening Quantity"
              name="quantity"
              type="number"
              min="0"
              defaultValue="0"
              required
            />
            <Input
              label="Reorder Threshold"
              name="reorder_level"
              type="number"
              min="0"
              defaultValue="5"
              helperText="Alerts trigger when stock falls to or below this level"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
              Create Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* Modal: Edit Stock (Manual Correction) */}
      {/* ========================================================================= */}
      {editItem && (
        <Modal
          isOpen={true}
          onClose={() => setEditItem(null)}
          title="Manual Stock Correction"
          subtitle={`Adjust count for "${editItem.product}" at ${editItem.branch}`}
        >
          <form onSubmit={handleEditStock} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Branch:</span>
                <span className="font-semibold text-slate-800">{editItem.branch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Product:</span>
                <span className="font-semibold text-slate-800">{editItem.product}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SKU:</span>
                <span className="font-mono text-slate-800">{editItem.sku}</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                This performs a direct inventory correction (e.g. for physical inventory audits). Routine stock receipts should use{' '}
                <strong className="font-semibold">Purchase Orders</strong> and inter-branch moves should use{' '}
                <strong className="font-semibold">Stock Transfers</strong>.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Absolute Quantity"
                name="quantity"
                type="number"
                min="0"
                defaultValue={editItem.quantity}
                required
              />
              <Input
                label="Reorder Threshold"
                name="reorder_level"
                type="number"
                min="0"
                defaultValue={editItem.reorder_level}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" size="md" onClick={() => setEditItem(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
                Save Correction
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Inventory
