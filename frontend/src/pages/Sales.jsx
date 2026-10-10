import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ShoppingCart,
  History,
  Store,
  Trash2,
  Receipt,
  RotateCcw,
  Search,
  CreditCard,
  Banknote,
  Building,
  ChevronLeft,
  ChevronRight,
  Printer,
} from 'lucide-react'
import api from '../services/api'
import { useBranches } from '../context/BranchContext'
import { formatUSD, formatDateTime, formatNumber, formatPaymentMethod } from '../utils/format'
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

export function Sales() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { branches } = useBranches()
  const { addToast } = useToast()

  const currentTab = searchParams.get('tab') === 'pos' ? 'pos' : 'history'

  const setTab = (tab) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    setSearchParams(next)
  }

  // Branch filter for history
  const [historyBranch, setHistoryBranch] = useState(null)
  const [salesList, setSalesList] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [historyError, setHistoryError] = useState(null)
  const [historyOffset, setHistoryOffset] = useState(0)

  // Receipt Modal state
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null)

  // =========================================================================
  // POS State
  // =========================================================================
  const [posBranchId, setPosBranchId] = useState('')
  const [posPaymentMethod, setPosPaymentMethod] = useState('cash')
  const [posCustomerId, setPosCustomerId] = useState('')
  const [cart, setCart] = useState([]) // [{ product_id, name, sku, price, quantity, availableStock }]
  const [catalogProducts, setCatalogProducts] = useState([])
  const [branchStockMap, setBranchStockMap] = useState({}) // product_id -> available quantity
  const [productSearch, setProductSearch] = useState('')
  const [isSubmittingSale, setIsSubmittingSale] = useState(false)

  // Set default branch when branches load
  useEffect(() => {
    if (branches.length > 0 && !posBranchId) {
      setPosBranchId(branches[0].branch_id)
    }
  }, [branches, posBranchId])

  // Fetch sales history
  const fetchSalesHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true)
      setHistoryError(null)

      const params = { limit: 50, offset: historyOffset }
      if (historyBranch) params.branch_id = historyBranch

      const data = await api.get('/sales/', params)
      setSalesList(Array.isArray(data) ? data : [])
    } catch (err) {
      setHistoryError(err.message || 'Failed to load sales history')
    } finally {
      setIsLoadingHistory(false)
    }
  }, [historyBranch, historyOffset])

  useEffect(() => {
    if (currentTab === 'history') {
      fetchSalesHistory()
    }
  }, [currentTab, fetchSalesHistory])

  // Fetch Catalog & Branch Stock for POS
  useEffect(() => {
    async function loadCatalog() {
      try {
        const prods = await api.get('/products/', { limit: 500, include_inactive: false })
        setCatalogProducts(Array.isArray(prods) ? prods : [])
      } catch (err) {
        console.error('Failed to load POS catalog:', err)
      }
    }
    loadCatalog()
  }, [])

  // When selected POS branch changes, load its inventory for stock checks
  useEffect(() => {
    async function loadBranchStock() {
      if (!posBranchId) return
      try {
        const inv = await api.get('/inventory/', { branch_id: posBranchId })
        const map = {}
        if (Array.isArray(inv)) {
          inv.forEach((item) => {
            map[item.product_id] = Number(item.quantity) || 0
          })
        }
        setBranchStockMap(map)

        // Update available stock in current cart
        setCart((prevCart) =>
          prevCart.map((item) => ({
            ...item,
            availableStock: map[item.product_id] !== undefined ? map[item.product_id] : 0,
          }))
        )
      } catch (err) {
        console.error('Failed to load branch stock for POS:', err)
      }
    }
    loadBranchStock()
  }, [posBranchId])

  // View Receipt for a Sale
  const handleViewReceipt = async (saleId) => {
    try {
      const detail = await api.get(`/sales/${saleId}`)
      setSelectedSaleDetail(detail)
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  // POS: Add Product to Cart
  const handleAddToCart = (product) => {
    const existing = cart.find((i) => i.product_id === product.product_id)
    const available = branchStockMap[product.product_id] !== undefined ? branchStockMap[product.product_id] : 0

    if (existing) {
      setCart(
        cart.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    } else {
      setCart([
        ...cart,
        {
          product_id: product.product_id,
          name: product.name,
          sku: product.sku,
          price: Number(product.selling_price) || 0,
          quantity: 1,
          availableStock: available,
        },
      ])
    }
  }

  // POS: Update item quantity
  const handleUpdateQuantity = (productId, newQty) => {
    const parsed = parseInt(newQty, 10)
    if (isNaN(parsed) || parsed <= 0) return
    setCart(
      cart.map((item) =>
        item.product_id === productId ? { ...item, quantity: parsed } : item
      )
    )
  }

  // POS: Remove item from cart
  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter((item) => item.product_id !== productId))
  }

  // POS: Submit Checkout
  const handleCheckout = async (e) => {
    e.preventDefault()
    if (cart.length === 0) {
      addToast('Cannot checkout an empty basket', 'error')
      return
    }

    if (!posBranchId) {
      addToast('Please select a retail branch for this sale', 'error')
      return
    }

    // Build SaleData payload (IDs and quantities only, NO prices)
    const payload = {
      branch_id: Number(posBranchId),
      customer_id: posCustomerId ? parseInt(posCustomerId, 10) : null,
      payment_method: posPaymentMethod,
      items: cart.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
      })),
    }

    setIsSubmittingSale(true)
    try {
      const createdSale = await api.post('/sales/', payload)
      addToast(`Sale #${createdSale.sale_id} completed successfully!`, 'success')

      // Authoritative receipt from server
      setSelectedSaleDetail(createdSale)

      // Clear cart
      setCart([])
      setPosCustomerId('')

      // Refetch inventory to reflect stock deduction
      const inv = await api.get('/inventory/', { branch_id: posBranchId })
      const map = {}
      if (Array.isArray(inv)) {
        inv.forEach((item) => {
          map[item.product_id] = Number(item.quantity) || 0
        })
      }
      setBranchStockMap(map)
    } catch (err) {
      // Retain basket on error (e.g. 409 insufficient stock)
      addToast(err.message, 'error')
    } finally {
      setIsSubmittingSale(false)
    }
  }

  // Filter products for POS quick search
  const filteredCatalog = catalogProducts.filter((p) => {
    if (!productSearch.trim()) return true
    const q = productSearch.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
  })

  // Cart totals preview
  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const cartTotalUnits = cart.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales & Point of Sale"
        subtitle="Process walk-in checkouts, record customer transactions, and audit historical receipts"
        actions={
          <div className="flex bg-slate-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTab('history')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'history'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Sales History
            </button>
            <button
              type="button"
              onClick={() => setTab('pos')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'pos'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              New Sale / POS
            </button>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* TAB 1: SALES HISTORY */}
      {/* ========================================================================= */}
      {currentTab === 'history' && (
        <div className="space-y-4">
          {/* History Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">Filter Branch:</span>
              <select
                value={historyBranch || ''}
                onChange={(e) => {
                  setHistoryBranch(e.target.value ? Number(e.target.value) : null)
                  setHistoryOffset(0)
                }}
                className="text-xs font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.branch_id} value={b.branch_id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={fetchSalesHistory}
            >
              Refresh
            </Button>
          </div>

          {/* History Table */}
          {historyError ? (
            <ErrorState
              title="Failed to load sales history"
              message={historyError}
              onRetry={fetchSalesHistory}
            />
          ) : isLoadingHistory ? (
            <LoadingSkeleton variant="table" count={8} />
          ) : salesList.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No sales transactions found"
              description="No sales have been recorded for the selected branch filter."
              actionLabel="Start New Sale"
              onAction={() => setTab('pos')}
            />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Sale ID</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Branch</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4 text-center">Payment Method</th>
                      <th className="py-3 px-4 text-right">Order Total</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {salesList.map((sale) => (
                      <tr key={sale.sale_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                          #{sale.sale_id}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {formatDateTime(sale.sold_at)}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {sale.branch}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {sale.customer || 'Walk-in Customer'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={sale.payment_method} type="payment" />
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 font-tabular text-sm">
                          {formatUSD(sale.total)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Receipt}
                            onClick={() => handleViewReceipt(sale.sale_id)}
                          >
                            Receipt
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* History pagination */}
              <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                <span>Showing {salesList.length} sales</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={ChevronLeft}
                    disabled={historyOffset === 0}
                    onClick={() => setHistoryOffset((p) => Math.max(0, p - 50))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={salesList.length < 50}
                    onClick={() => setHistoryOffset((p) => p + 50)}
                  >
                    Next <ChevronRight className="w-3.5 h-3.5 ml-1 inline" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NEW SALE / POS CHECKOUT */}
      {/* ========================================================================= */}
      {currentTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Product Catalog Picker (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  Select Hardware Products
                </h3>
                <span className="text-xs text-slate-500 font-tabular">
                  {catalogProducts.length} active products
                </span>
              </div>

              <Input
                placeholder="Search catalog by name or SKU..."
                icon={Search}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />

              {/* Products list with live branch stock */}
              <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {filteredCatalog.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No active products match your search.
                  </div>
                ) : (
                  filteredCatalog.map((prod) => {
                    const inStock = branchStockMap[prod.product_id] || 0
                    const inCart = cart.find((i) => i.product_id === prod.product_id)

                    return (
                      <div
                        key={prod.product_id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{prod.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono">{prod.sku}</span>
                            <span>·</span>
                            <span className="text-slate-600 font-medium">{prod.category}</span>
                            <span>·</span>
                            <span
                              className={`font-semibold ${
                                inStock <= 0
                                  ? 'text-rose-600'
                                  : inStock <= 5
                                  ? 'text-amber-600'
                                  : 'text-emerald-700'
                              }`}
                            >
                              Branch Stock: {formatNumber(inStock)} pcs
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-3">
                          <span className="font-bold text-slate-900 text-sm font-tabular">
                            {formatUSD(prod.selling_price)}
                          </span>
                          <Button
                            variant={inCart ? 'secondary' : 'primary'}
                            size="sm"
                            disabled={inStock <= 0}
                            onClick={() => handleAddToCart(prod)}
                          >
                            {inCart ? `Add (${inCart.quantity})` : 'Add to Cart'}
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Basket & Payment (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <form onSubmit={handleCheckout} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Current Order Basket</h3>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  {cartTotalUnits} units
                </span>
              </div>

              {/* Branch Selector (Required) */}
              <Select
                label="Store Branch"
                value={posBranchId}
                onChange={(e) => setPosBranchId(Number(e.target.value))}
                required
              >
                {branches.map((b) => (
                  <option key={b.branch_id} value={b.branch_id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </Select>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Method *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: 'Cash', icon: Banknote },
                    { id: 'card', label: 'Card', icon: CreditCard },
                    { id: 'bank_transfer', label: 'Transfer', icon: Building },
                  ].map((m) => {
                    const Icon = m.icon
                    const isSelected = posPaymentMethod === m.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPosPaymentMethod(m.id)}
                        className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {m.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Customer ID field (Optional - walk-in default) */}
              <Input
                label="Customer ID (Optional · Default: Walk-in)"
                type="number"
                min="1"
                placeholder="Leave blank for Walk-in Customer"
                value={posCustomerId}
                onChange={(e) => setPosCustomerId(e.target.value)}
              />

              {/* Cart Items Table */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Basket Items
                </p>

                {cart.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-xs">
                    Basket is empty. Select products from the catalog to add items.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    {cart.map((item) => {
                      const hasStockIssue = item.quantity > item.availableStock

                      return (
                        <div
                          key={item.product_id}
                          className={`p-2.5 flex items-center justify-between gap-2 text-xs ${
                            hasStockIssue ? 'bg-rose-50/60' : 'bg-white'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                            <p className="text-[11px] text-slate-500 font-tabular">
                              {formatUSD(item.price)} each ·{' '}
                              <span
                                className={hasStockIssue ? 'text-rose-600 font-bold' : 'text-slate-500'}
                              >
                                Max stock: {item.availableStock}
                              </span>
                            </p>
                          </div>

                          {/* Quantity control */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateQuantity(item.product_id, e.target.value)
                              }
                              className="w-12 text-center text-xs font-semibold py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                              className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 cursor-pointer"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(item.product_id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Subtotal Preview */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Catalog Estimated Total:</span>
                  <span className="font-tabular font-semibold text-slate-700">
                    {formatUSD(cartSubtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-1">
                  <span>Grand Total:</span>
                  <span className="font-tabular text-blue-700 text-lg">
                    {formatUSD(cartSubtotal)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  * Note: Unit prices are confirmed server-side at checkout time.
                </p>
              </div>

              {/* Checkout Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full text-sm font-semibold shadow-md py-3"
                disabled={cart.length === 0}
                isLoading={isSubmittingSale}
              >
                Complete Sale ({formatUSD(cartSubtotal)})
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal: Official Sale Receipt */}
      {/* ========================================================================= */}
      {selectedSaleDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedSaleDetail(null)}
          title={`Sale Receipt #${selectedSaleDetail.sale_id}`}
          subtitle="Official transactional customer sales receipt"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            {/* Receipt Header Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <h4 className="font-bold text-slate-900 text-base">Retail Intelligence</h4>
              <p className="text-xs text-slate-600 font-medium">{selectedSaleDetail.branch}</p>
              <p className="text-[11px] text-slate-400">
                {formatDateTime(selectedSaleDetail.sold_at)}
              </p>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Customer</span>
                <span className="font-semibold text-slate-800">
                  {selectedSaleDetail.customer || 'Walk-in Customer'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase">Payment</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {formatPaymentMethod(selectedSaleDetail.payment_method)}
                </span>
              </div>
            </div>

            {/* Line items table */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Line Items</p>
              <div className="divide-y divide-slate-100 text-xs">
                {selectedSaleDetail.items?.map((item, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{item.product}</p>
                      <p className="text-[11px] text-slate-500 font-tabular">
                        {item.quantity} x {formatUSD(item.unit_price)}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900 font-tabular">
                      {formatUSD(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="pt-3 border-t-2 border-dashed border-slate-200 flex justify-between items-center text-base font-bold text-slate-900">
              <span>Server Total:</span>
              <span className="text-blue-700 font-tabular text-xl">
                {formatUSD(selectedSaleDetail.total)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                icon={Printer}
                onClick={() => window.print()}
              >
                Print
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedSaleDetail(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Sales
