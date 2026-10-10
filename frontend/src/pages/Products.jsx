import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Tag,
  Bookmark,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react'
import api from '../services/api'
import { formatUSD } from '../utils/format'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { StatusBadge } from '../components/ui/StatusBadge'
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { useToast } from '../components/ui/Toast'

const PAGE_SIZE = 50

export function Products() {
  const { addToast } = useToast()

  // State: catalog list
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter state
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [offset, setOffset] = useState(0)

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [deactivateProduct, setDeactivateProduct] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Category & Brand management modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)

  // Fetch Lookups (Categories & Brands)
  const fetchLookups = useCallback(async () => {
    try {
      const [cats, brs] = await Promise.all([api.get('/categories/'), api.get('/brands/')])
      setCategories(Array.isArray(cats) ? cats : [])
      setBrands(Array.isArray(brs) ? brs : [])
    } catch (err) {
      console.error('Failed to load categories/brands:', err)
    }
  }, [])

  useEffect(() => {
    fetchLookups()
  }, [fetchLookups])

  // Fetch Catalog
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = {
        limit: PAGE_SIZE,
        offset: offset,
        include_inactive: includeInactive,
      }
      if (search.trim()) params.search = search.trim()
      if (categoryId) params.category_id = categoryId
      if (brandId) params.brand_id = brandId

      const data = await api.get('/products/', params)
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }, [search, categoryId, brandId, includeInactive, offset])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Handle Add Product submit
  const handleCreateProduct = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.target)
    const payload = {
      category_id: Number(formData.get('category_id')),
      brand_id: Number(formData.get('brand_id')),
      sku: formData.get('sku')?.trim(),
      name: formData.get('name')?.trim(),
      description: formData.get('description')?.trim() || null,
      cost_price: parseFloat(formData.get('cost_price')),
      selling_price: parseFloat(formData.get('selling_price')),
    }

    try {
      await api.post('/products/', payload)
      addToast(`Product "${payload.name}" created successfully`, 'success')
      setIsAddOpen(false)
      fetchProducts()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Edit Product submit
  const handleUpdateProduct = async (e) => {
    e.preventDefault()
    if (!editProduct) return
    setIsSubmitting(true)

    const formData = new FormData(e.target)
    const payload = {
      category_id: Number(formData.get('category_id')),
      brand_id: Number(formData.get('brand_id')),
      sku: formData.get('sku')?.trim(),
      name: formData.get('name')?.trim(),
      description: formData.get('description')?.trim() || null,
      cost_price: parseFloat(formData.get('cost_price')),
      selling_price: parseFloat(formData.get('selling_price')),
    }

    try {
      await api.put(`/products/${editProduct.product_id}`, payload)
      addToast(`Product updated successfully`, 'success')
      setEditProduct(null)
      fetchProducts()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Soft Deactivate
  const handleDeactivate = async () => {
    if (!deactivateProduct) return
    setIsSubmitting(true)

    try {
      await api.delete(`/products/${deactivateProduct.product_id}`)
      addToast(`Product "${deactivateProduct.name}" deactivated`, 'success')
      setDeactivateProduct(null)
      fetchProducts()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products Catalog"
        subtitle="Hardware catalog with multi-category classification, pricing, and active status tracking"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Tag}
              onClick={() => setIsCategoryModalOpen(true)}
            >
              Categories
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Bookmark}
              onClick={() => setIsBrandModalOpen(true)}
            >
              Brands
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsAddOpen(true)}
            >
              Add Product
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-1">
            <Input
              placeholder="Search product name or SKU..."
              icon={Search}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setOffset(0)
              }}
            />
          </div>

          {/* Category Filter */}
          <div>
            <Select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value)
                setOffset(0)
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Brand Filter */}
          <div>
            <Select
              value={brandId}
              onChange={(e) => {
                setBrandId(e.target.value)
                setOffset(0)
              }}
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b.brand_id} value={b.brand_id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Inactive Toggle & Reset */}
          <div className="flex items-center justify-between gap-2 px-1">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => {
                  setIncludeInactive(e.target.checked)
                  setOffset(0)
                }}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              Show Inactive
            </label>

            {(search || categoryId || brandId || includeInactive) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setCategoryId('')
                  setBrandId('')
                  setIncludeInactive(false)
                  setOffset(0)
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      {error ? (
        <ErrorState title="Failed to load catalog" message={error} onRetry={fetchProducts} />
      ) : isLoading ? (
        <LoadingSkeleton variant="table" count={8} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No products found"
          description="Try adjusting your search terms or filter selections."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('')
            setCategoryId('')
            setBrandId('')
            setIncludeInactive(false)
          }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Product / SKU</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-center">Margin</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map((p) => {
                  const cost = Number(p.cost_price) || 0
                  const sell = Number(p.selling_price) || 0
                  const marginPercent = sell > 0 ? (((sell - cost) / sell) * 100).toFixed(1) : '0'

                  return (
                    <tr
                      key={p.product_id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !p.is_active ? 'bg-slate-50/40 opacity-75' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 leading-tight">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku}</p>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {p.brand || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {p.category || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 font-tabular">
                        {formatUSD(p.cost_price)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-tabular">
                        {formatUSD(p.selling_price)}
                      </td>
                      <td className="py-3 px-4 text-center font-tabular">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                            Number(marginPercent) > 20
                              ? 'text-teal-700 bg-teal-50'
                              : 'text-amber-700 bg-amber-50'
                          }`}
                        >
                          {marginPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge
                          status={p.is_active ? 'active' : 'inactive'}
                          type="product"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/inventory?search=${encodeURIComponent(p.sku)}`}
                            title="Manage stock in Inventory"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Boxes className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setEditProduct(p)}
                            title="Edit product"
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {p.is_active && (
                            <button
                              type="button"
                              onClick={() => setDeactivateProduct(p)}
                              title="Soft deactivate"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Simple Pagination Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {products.length} products (offset {offset})
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                disabled={offset === 0}
                onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={products.length < PAGE_SIZE}
                onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1 inline" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal: Add Product */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create New Product"
        subtitle="Define hardware catalog item with SKU, manufacturer, and pricing"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Creating a product registers it in the catalog. Branch-specific inventory must be initialized on the{' '}
              <strong className="font-semibold">Inventory</strong> page.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Category" name="category_id" required>
              <option value="">Select Category...</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select label="Brand / Manufacturer" name="brand_id" required>
              <option value="">Select Brand...</option>
              {brands.map((b) => (
                <option key={b.brand_id} value={b.brand_id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <Input
                label="SKU"
                name="sku"
                placeholder="e.g. CPU-AMD-7800X"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Product Name"
                name="name"
                placeholder="e.g. AMD Ryzen 7 7800X3D Processor"
                required
              />
            </div>
          </div>

          <Textarea
            label="Description (Optional)"
            name="description"
            placeholder="Specifications, socket, architecture, or bundle info..."
            rows={2}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Cost Price (USD)"
              name="cost_price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
            />
            <Input
              label="Selling Price (USD)"
              name="selling_price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
              Save Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* Modal: Edit Product */}
      {/* ========================================================================= */}
      {editProduct && (
        <Modal
          isOpen={true}
          onClose={() => setEditProduct(null)}
          title={`Edit Product #${editProduct.product_id}`}
          subtitle="Update catalog specifications or prices"
        >
          <form onSubmit={handleUpdateProduct} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Category"
                name="category_id"
                defaultValue={editProduct.category_id}
                required
              >
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Brand / Manufacturer"
                name="brand_id"
                defaultValue={editProduct.brand_id}
                required
              >
                {brands.map((b) => (
                  <option key={b.brand_id} value={b.brand_id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <Input
                  label="SKU"
                  name="sku"
                  defaultValue={editProduct.sku}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Product Name"
                  name="name"
                  defaultValue={editProduct.name}
                  required
                />
              </div>
            </div>

            <Textarea
              label="Description (Optional)"
              name="description"
              defaultValue={editProduct.description || ''}
              rows={2}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Cost Price (USD)"
                name="cost_price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editProduct.cost_price}
                required
              />
              <Input
                label="Selling Price (USD)"
                name="selling_price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editProduct.selling_price}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" size="md" onClick={() => setEditProduct(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* Confirm Deactivate Dialog */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={Boolean(deactivateProduct)}
        onClose={() => setDeactivateProduct(null)}
        onConfirm={handleDeactivate}
        isLoading={isSubmitting}
        title="Soft Deactivate Product"
        message={`Are you sure you want to deactivate "${deactivateProduct?.name}" (SKU: ${deactivateProduct?.sku})? This product will be marked inactive and hidden from active POS and purchase orders, while keeping all historical sales intact.`}
        confirmText="Deactivate Product"
        variant="danger"
        iconType="warning"
      />

      {/* ========================================================================= */}
      {/* Modal: Manage Categories */}
      {/* ========================================================================= */}
      <ManageCategoriesModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false)
          fetchLookups()
          fetchProducts()
        }}
        categories={categories}
        onRefreshLookups={fetchLookups}
      />

      {/* ========================================================================= */}
      {/* Modal: Manage Brands */}
      {/* ========================================================================= */}
      <ManageBrandsModal
        isOpen={isBrandModalOpen}
        onClose={() => {
          setIsBrandModalOpen(false)
          fetchLookups()
          fetchProducts()
        }}
        brands={brands}
        onRefreshLookups={fetchLookups}
      />
    </div>
  )
}

/**
 * Manage Categories sub-modal
 */
function ManageCategoriesModal({ isOpen, onClose, categories, onRefreshLookups }) {
  const { addToast } = useToast()
  const [newCatName, setNewCatName] = useState('')
  const [newCatDesc, setNewCatDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    setIsSubmitting(true)

    try {
      await api.post('/categories/', {
        name: newCatName.trim(),
        description: newCatDesc.trim() || null,
      })
      addToast(`Category "${newCatName}" created`, 'success')
      setNewCatName('')
      setNewCatDesc('')
      onRefreshLookups()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (catId, catName) => {
    try {
      await api.delete(`/categories/${catId}`)
      addToast(`Category "${catName}" deleted`, 'success')
      onRefreshLookups()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Product Categories">
      <div className="space-y-5">
        {/* Create form */}
        <form onSubmit={handleAddCategory} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add New Category</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Category name..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              required
            />
            <Input
              placeholder="Description (optional)..."
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
            />
          </div>
          <div className="text-right">
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              Add Category
            </Button>
          </div>
        </form>

        {/* Existing categories list */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Existing Categories</h4>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
            {categories.map((c) => (
              <div key={c.category_id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                <div>
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  {c.description && <p className="text-[11px] text-slate-500">{c.description}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(c.category_id, c.name)}
                  title="Delete category (fails if products reference it)"
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

/**
 * Manage Brands sub-modal
 */
function ManageBrandsModal({ isOpen, onClose, brands, onRefreshLookups }) {
  const { addToast } = useToast()
  const [newBrandName, setNewBrandName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddBrand = async (e) => {
    e.preventDefault()
    if (!newBrandName.trim()) return
    setIsSubmitting(true)

    try {
      await api.post('/brands/', { name: newBrandName.trim() })
      addToast(`Brand "${newBrandName}" added`, 'success')
      setNewBrandName('')
      onRefreshLookups()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Hardware Brands / Vendors">
      <div className="space-y-5">
        <form onSubmit={handleAddBrand} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add New Brand</h4>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Brand name (e.g. ASUS, Corsair, Intel)..."
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                required
              />
            </div>
            <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
              Add Brand
            </Button>
          </div>
        </form>

        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Registered Brands</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
            {brands.map((b) => (
              <div
                key={b.brand_id}
                className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 flex items-center justify-between"
              >
                <span>{b.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">#{b.brand_id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default Products
