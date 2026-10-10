import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Truck,
  FileText,
  Plus,
  Edit2,
  Package,
  CheckCircle2,
  RotateCcw,
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  Info,
} from 'lucide-react'
import api from '../services/api'
import { useBranches } from '../context/BranchContext'
import { formatUSD, formatDateTime, formatNumber } from '../utils/format'
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

export function Suppliers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { branches } = useBranches()
  const { addToast } = useToast()

  const currentTab = searchParams.get('tab') === 'purchases' ? 'purchases' : 'suppliers'

  const setTab = (tab) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    setSearchParams(next)
  }

  // =========================================================================
  // Suppliers State
  // =========================================================================
  const [suppliers, setSuppliers] = useState([])
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true)
  const [suppliersError, setSuppliersError] = useState(null)

  // Supplier Modals
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false)
  const [editSupplier, setEditSupplier] = useState(null)
  const [selectedSupplierForProducts, setSelectedSupplierForProducts] = useState(null)
  const [isSubmittingSupplier, setIsSubmittingSupplier] = useState(false)

  // =========================================================================
  // Purchase Orders State
  // =========================================================================
  const [orders, setOrders] = useState([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [ordersError, setOrdersError] = useState(null)

  // Purchase Order Modals
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [receiveConfirmOrder, setReceiveConfirmOrder] = useState(null)
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)

  // Global catalog for linking products to suppliers
  const [allProducts, setAllProducts] = useState([])

  // Fetch Suppliers List
  const fetchSuppliers = useCallback(async () => {
    try {
      setIsLoadingSuppliers(true)
      setSuppliersError(null)
      const data = await api.get('/suppliers/')
      setSuppliers(Array.isArray(data) ? data : [])
    } catch (err) {
      setSuppliersError(err.message || 'Failed to load suppliers')
    } finally {
      setIsLoadingSuppliers(false)
    }
  }, [])

  // Fetch Purchase Orders List
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoadingOrders(true)
      setOrdersError(null)
      const data = await api.get('/purchase-orders/')
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      setOrdersError(err.message || 'Failed to load purchase orders')
    } finally {
      setIsLoadingOrders(false)
    }
  }, [])

  // Fetch Catalog products
  useEffect(() => {
    async function loadCatalog() {
      try {
        const data = await api.get('/products/', { limit: 500, include_inactive: false })
        setAllProducts(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to load catalog:', err)
      }
    }
    loadCatalog()
  }, [])

  useEffect(() => {
    if (currentTab === 'suppliers') {
      fetchSuppliers()
    } else {
      fetchOrders()
    }
  }, [currentTab, fetchSuppliers, fetchOrders])

  // Handle Create Supplier
  const handleCreateSupplier = async (e) => {
    e.preventDefault()
    setIsSubmittingSupplier(true)

    const formData = new FormData(e.target)
    const payload = {
      name: formData.get('name')?.trim(),
      email: formData.get('email')?.trim() || null,
      phone: formData.get('phone')?.trim() || null,
      address: formData.get('address')?.trim() || null,
    }

    try {
      await api.post('/suppliers/', payload)
      addToast(`Supplier "${payload.name}" created`, 'success')
      setIsAddSupplierOpen(false)
      fetchSuppliers()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setIsSubmittingSupplier(false)
    }
  }

  // Handle Update Supplier
  const handleUpdateSupplier = async (e) => {
    e.preventDefault()
    if (!editSupplier) return
    setIsSubmittingSupplier(true)

    const formData = new FormData(e.target)
    const payload = {
      name: formData.get('name')?.trim(),
      email: formData.get('email')?.trim() || null,
      phone: formData.get('phone')?.trim() || null,
      address: formData.get('address')?.trim() || null,
    }

    try {
      await api.put(`/suppliers/${editSupplier.supplier_id}`, payload)
      addToast(`Supplier updated`, 'success')
      setEditSupplier(null)
      fetchSuppliers()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setIsSubmittingSupplier(false)
    }
  }

  // Handle Create Purchase Order (Draft)
  const handleCreateOrder = async (e) => {
    e.preventDefault()
    setIsSubmittingOrder(true)

    const formData = new FormData(e.target)
    const payload = {
      supplier_id: Number(formData.get('supplier_id')),
      branch_id: Number(formData.get('branch_id')),
    }

    try {
      const newOrder = await api.post('/purchase-orders/', payload)
      addToast(`Draft Purchase Order #${newOrder.purchase_order_id} created`, 'success')
      setIsCreateOrderOpen(false)
      await fetchOrders()
      // Open order items modal
      handleOpenOrderDetail(newOrder)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  // Open Order Detail & load its items
  const handleOpenOrderDetail = async (order) => {
    setSelectedOrder(order)
    try {
      setIsLoadingItems(true)
      const items = await api.get(`/purchase-orders/${order.purchase_order_id}/items`)
      setOrderItems(Array.isArray(items) ? items : [])
    } catch (err) {
      addToast(err.message, 'error')
      setOrderItems([])
    } finally {
      setIsLoadingItems(false)
    }
  }

  // Receive Purchase Order
  const handleReceiveOrder = async () => {
    if (!receiveConfirmOrder) return
    setIsSubmittingOrder(true)

    try {
      await api.post(`/purchase-orders/${receiveConfirmOrder.purchase_order_id}/receive`)
      addToast(
        `Purchase Order #${receiveConfirmOrder.purchase_order_id} received! Stock added to branch.`,
        'success'
      )
      setReceiveConfirmOrder(null)
      if (selectedOrder?.purchase_order_id === receiveConfirmOrder.purchase_order_id) {
        setSelectedOrder(null)
      }
      fetchOrders()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers & Purchases"
        subtitle="Manage hardware distributors, supplier product catalogs, and purchase order inventory restocks"
        actions={
          <div className="flex bg-slate-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTab('suppliers')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'suppliers'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Suppliers Directory
            </button>
            <button
              type="button"
              onClick={() => setTab('purchases')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'purchases'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Purchase Orders
            </button>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* TAB 1: SUPPLIERS DIRECTORY */}
      {/* ========================================================================= */}
      {currentTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Registered vendors supplying computer components and laptops
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsAddSupplierOpen(true)}
            >
              Add Supplier
            </Button>
          </div>

          {suppliersError ? (
            <ErrorState
              title="Failed to load suppliers"
              message={suppliersError}
              onRetry={fetchSuppliers}
            />
          ) : isLoadingSuppliers ? (
            <LoadingSkeleton variant="table" count={6} />
          ) : suppliers.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No suppliers found"
              description="No vendor distributors have been added to the system."
              actionLabel="Add First Supplier"
              onAction={() => setIsAddSupplierOpen(true)}
            />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Supplier Name</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4">Address</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {suppliers.map((sup) => (
                      <tr key={sup.supplier_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900 text-sm leading-tight">
                            {sup.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ID: #{sup.supplier_id}
                          </p>
                        </td>
                        <td className="py-3 px-4 space-y-1">
                          {sup.email && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <a href={`mailto:${sup.email}`} className="hover:underline">
                                {sup.email}
                              </a>
                            </div>
                          )}
                          {sup.phone && (
                            <div className="flex items-center gap-1.5 text-slate-600 font-tabular">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{sup.phone}</span>
                            </div>
                          )}
                          {!sup.email && !sup.phone && <span className="text-slate-400">—</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {sup.address ? (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-xs">{sup.address}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Package}
                              onClick={() => setSelectedSupplierForProducts(sup)}
                            >
                              Catalog
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Edit2}
                              onClick={() => setEditSupplier(sup)}
                            >
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PURCHASE ORDERS */}
      {/* ========================================================================= */}
      {currentTab === 'purchases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Restock orders sent to suppliers. Receiving an order increments branch inventory.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={RotateCcw}
                onClick={fetchOrders}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setIsCreateOrderOpen(true)}
              >
                Create Purchase Order
              </Button>
            </div>
          </div>

          {ordersError ? (
            <ErrorState
              title="Failed to load purchase orders"
              message={ordersError}
              onRetry={fetchOrders}
            />
          ) : isLoadingOrders ? (
            <LoadingSkeleton variant="table" count={6} />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No purchase orders created"
              description="Create a draft purchase order to order hardware items from an approved vendor."
              actionLabel="Create Purchase Order"
              onAction={() => setIsCreateOrderOpen(true)}
            />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4">Destination Branch</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Created Date</th>
                      <th className="py-3 px-4">Received Date</th>
                      <th className="py-3 px-4 text-right">Total Cost</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {orders.map((po) => {
                      const isDraft = po.status === 'draft'

                      return (
                        <tr key={po.purchase_order_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            PO #{po.purchase_order_id}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {po.supplier}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">
                            {po.branch}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusBadge status={po.status} type="order" />
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {formatDateTime(po.created_at)}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {po.received_at ? formatDateTime(po.received_at) : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 font-tabular text-sm">
                            {formatUSD(po.total_cost)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenOrderDetail(po)}
                              >
                                {isDraft ? 'Manage Items' : 'View Details'}
                              </Button>
                              {isDraft && (
                                <Button
                                  variant="teal"
                                  size="sm"
                                  icon={CheckCircle2}
                                  onClick={() => setReceiveConfirmOrder(po)}
                                >
                                  Receive
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal: Add Supplier */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddSupplierOpen}
        onClose={() => setIsAddSupplierOpen(false)}
        title="Add Vendor Supplier"
        subtitle="Register new computer hardware distributor or component manufacturer"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <Input label="Supplier Name" name="name" placeholder="e.g. Algiers Tech Distribution" required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email" name="email" type="email" placeholder="vendor@example.com" />
            <Input label="Phone" name="phone" placeholder="0550000000" />
          </div>
          <Input label="Business Address" name="address" placeholder="Store address or industrial zone..." />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setIsAddSupplierOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isSubmittingSupplier}>
              Save Supplier
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* Modal: Edit Supplier */}
      {/* ========================================================================= */}
      {editSupplier && (
        <Modal
          isOpen={true}
          onClose={() => setEditSupplier(null)}
          title={`Edit Supplier #${editSupplier.supplier_id}`}
          subtitle="Update distributor contact and location details"
        >
          <form onSubmit={handleUpdateSupplier} className="space-y-4">
            <Input
              label="Supplier Name"
              name="name"
              defaultValue={editSupplier.name}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email"
                name="email"
                type="email"
                defaultValue={editSupplier.email || ''}
              />
              <Input
                label="Phone"
                name="phone"
                defaultValue={editSupplier.phone || ''}
              />
            </div>
            <Input
              label="Business Address"
              name="address"
              defaultValue={editSupplier.address || ''}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" size="md" onClick={() => setEditSupplier(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" isLoading={isSubmittingSupplier}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* Modal: Supplier Products Catalog & Link Product */}
      {/* ========================================================================= */}
      {selectedSupplierForProducts && (
        <SupplierCatalogModal
          supplier={selectedSupplierForProducts}
          allProducts={allProducts}
          onClose={() => setSelectedSupplierForProducts(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* Modal: Create Purchase Order (Draft) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        title="Create Purchase Order"
        subtitle="Initiate a draft purchase order for a supplier and destination branch"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <Select label="Supplier / Vendor" name="supplier_id" required>
            <option value="">Select Supplier...</option>
            {suppliers.map((s) => (
              <option key={s.supplier_id} value={s.supplier_id}>
                {s.name}
              </option>
            ))}
          </Select>

          <Select label="Destination Branch (Receiving Stock)" name="branch_id" required>
            <option value="">Select Branch...</option>
            {branches.map((b) => (
              <option key={b.branch_id} value={b.branch_id}>
                {b.name} ({b.city})
              </option>
            ))}
          </Select>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Orders start as <strong>Draft</strong>. You can add items offered by the selected supplier, and receive them to increment branch stock atomically.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setIsCreateOrderOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isSubmittingOrder}>
              Create Draft Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* Modal: Order Items & Receive Order */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          items={orderItems}
          isLoadingItems={isLoadingItems}
          onClose={() => {
            setSelectedOrder(null)
            fetchOrders()
          }}
          onRefreshItems={() => handleOpenOrderDetail(selectedOrder)}
          onReceiveRequest={() => setReceiveConfirmOrder(selectedOrder)}
        />
      )}

      {/* ========================================================================= */}
      {/* Confirm Receive Order Dialog */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={Boolean(receiveConfirmOrder)}
        onClose={() => setReceiveConfirmOrder(null)}
        onConfirm={handleReceiveOrder}
        isLoading={isSubmittingOrder}
        title={`Receive Purchase Order #${receiveConfirmOrder?.purchase_order_id}`}
        message={`Are you sure you want to mark this order as received? The backend will atomically add the ordered product quantities to ${receiveConfirmOrder?.branch} inventory. This action cannot be reversed.`}
        confirmText="Confirm & Receive Stock"
        variant="teal"
        iconType="info"
      />
    </div>
  )
}

/**
 * Supplier Catalog Modal: View & Link products offered by supplier
 */
function SupplierCatalogModal({ supplier, allProducts, onClose }) {
  const { addToast } = useToast()
  const [supplierProducts, setSupplierProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLinking, setIsLinking] = useState(false)

  const fetchSupplierProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await api.get(`/suppliers/${supplier.supplier_id}/products`)
      setSupplierProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }, [supplier.supplier_id, addToast])

  useEffect(() => {
    fetchSupplierProducts()
  }, [fetchSupplierProducts])

  const handleLinkProduct = async (e) => {
    e.preventDefault()
    setIsLinking(true)

    const formData = new FormData(e.target)
    const payload = {
      product_id: Number(formData.get('product_id')),
      supplier_sku: formData.get('supplier_sku')?.trim() || null,
      supplier_price: parseFloat(formData.get('supplier_price')),
    }

    try {
      await api.post(`/suppliers/${supplier.supplier_id}/products`, payload)
      addToast('Product linked to supplier successfully', 'success')
      e.target.reset()
      fetchSupplierProducts()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setIsLinking(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`${supplier.name} — Catalog`}
      subtitle="Products offered by this supplier with wholesale vendor pricing"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Link Form */}
        <form onSubmit={handleLinkProduct} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
            Link Product to Supplier
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <Select label="Select Product" name="product_id" required>
                <option value="">Select Catalog Product...</option>
                {allProducts.map((p) => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.name} [{p.sku}]
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-3">
              <Input label="Supplier SKU" name="supplier_sku" placeholder="SUP-001" />
            </div>
            <div className="sm:col-span-3">
              <Input
                label="Vendor Price ($)"
                name="supplier_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="text-right">
            <Button variant="primary" size="sm" type="submit" isLoading={isLinking}>
              Link Product
            </Button>
          </div>
        </form>

        {/* Supplier Products List */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Offered Products ({supplierProducts.length})
          </h4>

          {isLoading ? (
            <LoadingSkeleton variant="line" count={4} />
          ) : supplierProducts.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-500">
              This supplier does not have any products linked yet. Use the form above to link products.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              {supplierProducts.map((p) => (
                <div key={p.product_id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div>
                    <p className="font-semibold text-slate-900">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Catalog SKU: {p.sku}</p>
                  </div>
                  <div className="text-right font-tabular">
                    <span className="font-bold text-slate-900 text-sm">{formatUSD(p.supplier_price)}</span>
                    <span className="text-slate-400 text-[10px] block">supplier unit cost</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

/**
 * Order Detail & Items Modal
 */
function OrderDetailModal({
  order,
  items,
  isLoadingItems,
  onClose,
  onRefreshItems,
  onReceiveRequest,
}) {
  const { addToast } = useToast()
  const isDraft = order.status === 'draft'

  // Load products offered by this supplier to populate item add selector
  const [supplierProducts, setSupplierProducts] = useState([])
  const [isAddingItem, setIsAddingItem] = useState(false)

  useEffect(() => {
    async function loadOffered() {
      // Find supplier ID from suppliers or order
      try {
        const suppliersList = await api.get('/suppliers/')
        const matched = suppliersList.find((s) => s.name === order.supplier)
        if (matched) {
          const prods = await api.get(`/suppliers/${matched.supplier_id}/products`)
          setSupplierProducts(Array.isArray(prods) ? prods : [])
        }
      } catch (err) {
        console.error('Failed to load supplier products for order:', err)
      }
    }
    if (isDraft) {
      loadOffered()
    }
  }, [order.supplier, isDraft])

  // Handle Add Item to Order
  const handleAddItem = async (e) => {
    e.preventDefault()
    setIsAddingItem(true)

    const formData = new FormData(e.target)
    const payload = {
      product_id: Number(formData.get('product_id')),
      quantity: parseInt(formData.get('quantity'), 10),
    }

    try {
      await api.post(`/purchase-orders/${order.purchase_order_id}/items`, payload)
      addToast('Product added to order', 'success')
      e.target.reset()
      onRefreshItems()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setIsAddingItem(false)
    }
  }

  const orderCalculatedTotal = items.reduce((acc, item) => acc + (Number(item.total) || 0), 0)

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Purchase Order #${order.purchase_order_id}`}
      subtitle={`Supplier: ${order.supplier} · Receiving Branch: ${order.branch}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Status banner */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Order Status:</span>
            <StatusBadge status={order.status} type="order" />
          </div>
          <div className="text-right">
            <span className="text-slate-500">Created: </span>
            <span className="font-semibold text-slate-800">{formatDateTime(order.created_at)}</span>
          </div>
        </div>

        {/* If draft: add item form */}
        {isDraft && (
          <form onSubmit={handleAddItem} className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              Add Product Line (Supplier Catalog)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-8">
                <Select label="Hardware Product" name="product_id" required>
                  <option value="">Select from supplier catalog...</option>
                  {supplierProducts.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.name} [{p.sku}] — {formatUSD(p.supplier_price)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-4">
                <Input
                  label="Quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  defaultValue="10"
                  required
                />
              </div>
            </div>

            <div className="text-right">
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={supplierProducts.length === 0}
                isLoading={isAddingItem}
              >
                Add Item to PO
              </Button>
            </div>
          </form>
        )}

        {/* Order Items Table */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Order Items ({items.length})
          </h4>

          {isLoadingItems ? (
            <LoadingSkeleton variant="table" count={3} />
          ) : items.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-500">
              No items on this purchase order yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3 text-center">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Unit Cost</th>
                    <th className="py-2.5 px-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {items.map((item, idx) => (
                    <tr key={item.purchase_order_item_id || idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {item.product}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800 font-tabular">
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-tabular text-slate-600">
                        {formatUSD(item.unit_cost)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-tabular">
                        {formatUSD(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Total */}
          <div className="pt-3 flex justify-between items-center text-sm font-bold text-slate-900">
            <span>Order Total Cost:</span>
            <span className="text-blue-700 font-tabular text-lg">
              {formatUSD(orderCalculatedTotal || order.total_cost)}
            </span>
          </div>
        </div>

        {/* Modal footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <Button variant="outline" size="md" onClick={onClose}>
            Close
          </Button>

          {isDraft && items.length > 0 && (
            <Button
              variant="teal"
              size="md"
              icon={CheckCircle2}
              onClick={onReceiveRequest}
            >
              Receive Stock into Branch
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default Suppliers
