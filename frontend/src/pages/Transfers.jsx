import React, { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeftRight,
  Plus,
  RotateCcw,
  CheckCircle2,
  Store,
  ArrowRight,
  Info,
} from 'lucide-react'
import api from '../services/api'
import { useBranches } from '../context/BranchContext'
import { formatDateTime, formatNumber } from '../utils/format'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { StatusBadge } from '../components/ui/StatusBadge'
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { useToast } from '../components/ui/Toast'

export function Transfers() {
  const { branches } = useBranches()
  const { addToast } = useToast()

  const [transfers, setTransfers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Catalog products for adding items
  const [activeProducts, setActiveProducts] = useState([])

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState(null)
  const [transferDetail, setTransferDetail] = useState(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [completeConfirmTransfer, setCompleteConfirmTransfer] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch Transfers List
  const fetchTransfers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await api.get('/stock-transfers/')
      setTransfers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load stock transfers')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTransfers()
  }, [fetchTransfers])

  // Fetch Active Products for Item Selection
  useEffect(() => {
    async function loadProducts() {
      try {
        const prods = await api.get('/products/', { limit: 500, include_inactive: false })
        setActiveProducts(Array.isArray(prods) ? prods : [])
      } catch (err) {
        console.error('Failed to load active products:', err)
      }
    }
    loadProducts()
  }, [])

  // Handle Create Draft Transfer
  const handleCreateTransfer = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.target)
    const fromId = Number(formData.get('from_branch_id'))
    const toId = Number(formData.get('to_branch_id'))

    if (fromId === toId) {
      addToast('Source and destination branches must be different', 'error')
      setIsSubmitting(false)
      return
    }

    try {
      const newTransfer = await api.post('/stock-transfers/', {
        from_branch_id: fromId,
        to_branch_id: toId,
      })
      addToast(`Draft Stock Transfer #${newTransfer.transfer_id} created`, 'success')
      setIsCreateOpen(false)
      await fetchTransfers()
      // Open detail view for the newly created transfer
      handleViewTransfer(newTransfer)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open Transfer Detail Modal & fetch items
  const handleViewTransfer = async (transfer) => {
    setSelectedTransfer(transfer)
    try {
      setIsLoadingDetail(true)
      const detail = await api.get(`/stock-transfers/${transfer.transfer_id}`)
      setTransferDetail(detail)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setIsLoadingDetail(false)
    }
  }

  // Handle Complete Transfer
  const handleCompleteTransfer = async () => {
    if (!completeConfirmTransfer) return
    setIsSubmitting(true)

    try {
      await api.post(`/stock-transfers/${completeConfirmTransfer.transfer_id}/complete`)
      addToast(
        `Stock Transfer #${completeConfirmTransfer.transfer_id} completed! Quantities moved.`,
        'success'
      )
      setCompleteConfirmTransfer(null)
      if (selectedTransfer?.transfer_id === completeConfirmTransfer.transfer_id) {
        setSelectedTransfer(null)
      }
      fetchTransfers()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Transfers"
        subtitle="Move computer hardware inventory securely between retail branch locations"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={fetchTransfers}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsCreateOpen(true)}
            >
              New Transfer
            </Button>
          </div>
        }
      />

      {/* Info notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 flex items-start gap-2.5 shadow-xs">
        <ArrowLeftRight className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span>
          Stock transfers enable balancing inventory among <strong className="font-semibold text-slate-900">Algiers Central</strong>,{' '}
          <strong className="font-semibold text-slate-900">Oran West</strong>, and{' '}
          <strong className="font-semibold text-slate-900">Constantine East</strong>. Completing a transfer atomically deducts from the origin branch and adds to the destination in a single database transaction.
        </span>
      </div>

      {/* Transfers Table */}
      {error ? (
        <ErrorState
          title="Failed to load stock transfers"
          message={error}
          onRetry={fetchTransfers}
        />
      ) : isLoading ? (
        <LoadingSkeleton variant="table" count={6} />
      ) : transfers.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No stock transfers found"
          description="Create a draft transfer to rebalance inventory between store branches."
          actionLabel="Create Transfer"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Transfer ID</th>
                  <th className="py-3 px-4">Origin (From)</th>
                  <th className="py-3 px-4">Destination (To)</th>
                  <th className="py-3 px-4 text-center">Items Count</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Completed Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transfers.map((st) => {
                  const isDraft = st.status === 'draft'

                  return (
                    <tr key={st.transfer_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        TR #{st.transfer_id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          <span>{st.from_branch}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-blue-500" />
                          <span>{st.to_branch}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800 font-tabular">
                        {formatNumber(st.product_count)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={st.status} type="transfer" />
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {formatDateTime(st.created_at)}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {st.completed_at ? formatDateTime(st.completed_at) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTransfer(st)}
                          >
                            {isDraft ? 'Manage Items' : 'View Transfer'}
                          </Button>
                          {isDraft && (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={CheckCircle2}
                              onClick={() => setCompleteConfirmTransfer(st)}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal: Create Stock Transfer (Draft) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Stock Transfer"
        subtitle="Initiate a draft transfer between two distinct branches"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          <Select label="Origin Branch (Source of Stock)" name="from_branch_id" required>
            <option value="">Select Origin Branch...</option>
            {branches.map((b) => (
              <option key={b.branch_id} value={b.branch_id}>
                {b.name} ({b.city})
              </option>
            ))}
          </Select>

          <Select label="Destination Branch (Target Stock)" name="to_branch_id" required>
            <option value="">Select Destination Branch...</option>
            {branches.map((b) => (
              <option key={b.branch_id} value={b.branch_id}>
                {b.name} ({b.city})
              </option>
            ))}
          </Select>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              The transfer will be created in <strong>Draft</strong> status. You can add one or more hardware products and verify source branch inventory before completing.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
              Create Draft Transfer
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* Modal: Transfer Details & Items */}
      {/* ========================================================================= */}
      {selectedTransfer && (
        <TransferDetailModal
          transferSummary={selectedTransfer}
          transferDetail={transferDetail}
          isLoading={isLoadingDetail}
          activeProducts={activeProducts}
          branches={branches}
          onClose={() => {
            setSelectedTransfer(null)
            fetchTransfers()
          }}
          onRefreshDetail={() => handleViewTransfer(selectedTransfer)}
          onCompleteRequest={() => setCompleteConfirmTransfer(selectedTransfer)}
        />
      )}

      {/* ========================================================================= */}
      {/* Confirm Complete Transfer Dialog */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={Boolean(completeConfirmTransfer)}
        onClose={() => setCompleteConfirmTransfer(null)}
        onConfirm={handleCompleteTransfer}
        isLoading={isSubmitting}
        title={`Complete Transfer #${completeConfirmTransfer?.transfer_id}`}
        message={`Are you sure you want to finalize this transfer from ${completeConfirmTransfer?.from_branch} to ${completeConfirmTransfer?.to_branch}? The backend will atomically deduct the items from origin inventory and credit them to destination inventory. This cannot be undone.`}
        confirmText="Confirm & Complete Transfer"
        variant="primary"
        iconType="info"
      />
    </div>
  )
}

/**
 * Transfer Detail & Items Modal
 */
function TransferDetailModal({
  transferSummary,
  transferDetail,
  isLoading,
  activeProducts,
  branches,
  onClose,
  onRefreshDetail,
  onCompleteRequest,
}) {
  const { addToast } = useToast()
  const isDraft = transferSummary.status === 'draft'

  // Source branch inventory lookup for stock guidance
  const [sourceStockMap, setSourceStockMap] = useState({})
  const [isAddingItem, setIsAddingItem] = useState(false)

  // Get source and destination branch objects
  const fromBranchId = transferDetail?.from_branch_id
  const fromBranchName =
    transferSummary.from_branch || branches.find((b) => b.branch_id === fromBranchId)?.name || `Branch #${fromBranchId}`
  const toBranchId = transferDetail?.to_branch_id
  const toBranchName =
    transferSummary.to_branch || branches.find((b) => b.branch_id === toBranchId)?.name || `Branch #${toBranchId}`

  // Fetch source branch inventory to verify available quantities
  useEffect(() => {
    async function loadSourceInventory() {
      if (!fromBranchId) return
      try {
        const inv = await api.get('/inventory/', { branch_id: fromBranchId })
        const map = {}
        if (Array.isArray(inv)) {
          inv.forEach((item) => {
            map[item.product_id] = Number(item.quantity) || 0
          })
        }
        setSourceStockMap(map)
      } catch (err) {
        console.error('Failed to load source inventory for transfer:', err)
      }
    }
    if (isDraft && fromBranchId) {
      loadSourceInventory()
    }
  }, [fromBranchId, isDraft])

  // Handle Add Item to Transfer
  const handleAddItem = async (e) => {
    e.preventDefault()
    setIsAddingItem(true)

    const formData = new FormData(e.target)
    const payload = {
      product_id: Number(formData.get('product_id')),
      quantity: parseInt(formData.get('quantity'), 10),
    }

    try {
      await api.post(`/stock-transfers/${transferSummary.transfer_id}/items`, payload)
      addToast('Product added to transfer', 'success')
      e.target.reset()
      onRefreshDetail()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setIsAddingItem(false)
    }
  }

  const items = transferDetail?.items || []

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Stock Transfer #${transferSummary.transfer_id}`}
      subtitle={`${fromBranchName} → ${toBranchName}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Transfer Header Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">From Origin</p>
              <p className="font-bold text-slate-900">{fromBranchName}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">To Destination</p>
              <p className="font-bold text-blue-700">{toBranchName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Status:</span>
            <StatusBadge status={transferSummary.status} type="transfer" />
          </div>
        </div>

        {/* If Draft: Add Product Form */}
        {isDraft && (
          <form onSubmit={handleAddItem} className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              Add Product Line to Transfer
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-8">
                <Select label="Hardware Product" name="product_id" required>
                  <option value="">Select Product...</option>
                  {activeProducts.map((p) => {
                    const avail = sourceStockMap[p.product_id] || 0
                    return (
                      <option key={p.product_id} value={p.product_id} disabled={avail <= 0}>
                        {p.name} [{p.sku}] — Avail at origin: {avail} pcs
                      </option>
                    )
                  })}
                </Select>
              </div>
              <div className="sm:col-span-4">
                <Input
                  label="Quantity to Move"
                  name="quantity"
                  type="number"
                  min="1"
                  defaultValue="2"
                  required
                />
              </div>
            </div>

            <div className="text-right">
              <Button variant="primary" size="sm" type="submit" isLoading={isAddingItem}>
                Add to Transfer
              </Button>
            </div>
          </form>
        )}

        {/* Items List */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Transfer Products ({items.length})
          </h4>

          {isLoading ? (
            <LoadingSkeleton variant="table" count={3} />
          ) : items.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-500">
              No products added to this transfer yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3 text-center">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Origin Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {items.map((item, idx) => {
                    const originAvail = sourceStockMap[item.product_id]

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {item.product}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-blue-700 font-tabular text-sm">
                          {formatNumber(item.quantity)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-tabular text-slate-500">
                          {originAvail !== undefined ? `${originAvail} units` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <Button variant="outline" size="md" onClick={onClose}>
            Close
          </Button>

          {isDraft && items.length > 0 && (
            <Button
              variant="primary"
              size="md"
              icon={CheckCircle2}
              onClick={onCompleteRequest}
            >
              Complete Stock Movement
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default Transfers
