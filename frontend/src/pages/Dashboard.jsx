import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  ArrowRight,
  Package,
  Store,
  RotateCcw,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'
import api from '../services/api'
import { useBranches } from '../context/BranchContext'
import { formatUSD, formatNumber } from '../utils/format'
import { PageHeader } from '../components/layout/PageHeader'
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'

const CATEGORY_COLORS = ['#2563EB', '#0D9488', '#8B5CF6', '#F59E0B', '#EC4899']

export function Dashboard() {
  const { branches } = useBranches()
  const [selectedBranch, setSelectedBranch] = useState(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [summary, setSummary] = useState(null)
  const [monthlySales, setMonthlySales] = useState([])
  const [branchPerformance, setBranchPerformance] = useState([])
  const [categories, setCategories] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [lowStock, setLowStock] = useState([])

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const branchParam = selectedBranch ? { branch_id: selectedBranch } : {}

      // Batch independent requests concurrently
      const [sumRes, monthlyRes, branchRes, catRes, topRes, lowRes] = await Promise.all([
        api.get('/analytics/summary', branchParam),
        api.get('/analytics/monthly-sales', branchParam),
        api.get('/analytics/branches'), // Always all branches
        api.get('/analytics/categories', branchParam),
        api.get('/analytics/top-products', { ...branchParam, limit: 5 }),
        api.get('/analytics/low-stock', branchParam),
      ])

      setSummary(sumRes)
      setMonthlySales(Array.isArray(monthlyRes) ? monthlyRes : [])
      setBranchPerformance(Array.isArray(branchRes) ? branchRes : [])
      setCategories(Array.isArray(catRes) ? catRes : [])
      setTopProducts(Array.isArray(topRes) ? topRes : [])
      setLowStock(Array.isArray(lowRes) ? lowRes : [])
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics')
    } finally {
      setIsLoading(false)
    }
  }, [selectedBranch])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Format month for chart axis (e.g. "2024-03-01" -> "Mar")
  const formatMonthAxis = (dateStr) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', { month: 'short' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Multi-branch retail operations, sales analytics, and stock health monitor"
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        actions={
          <button
            type="button"
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        }
      />

      {error ? (
        <ErrorState
          title="Could not load dashboard data"
          message={error}
          onRetry={fetchDashboardData}
        />
      ) : isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <LoadingSkeleton variant="card" count={4} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80 bg-white rounded-xl border border-slate-200 animate-pulse p-6" />
            <div className="h-80 bg-white rounded-xl border border-slate-200 animate-pulse p-6" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LoadingSkeleton variant="table" count={3} />
            <LoadingSkeleton variant="table" count={3} />
          </div>
        </div>
      ) : (
        <>
          {/* Fictional Data Notice Banner */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-900 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-800 text-[11px]">
                Portfolio Demo
              </span>
              <span>
                Metrics reflect sample computer hardware retail data in USD. Figures are all-time cumulative aggregates from Neon PostgreSQL.
              </span>
            </div>
            {selectedBranch && (
              <span className="shrink-0 font-medium text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                Filtered: {branches.find((b) => b.branch_id === selectedBranch)?.name || `Branch #${selectedBranch}`}
              </span>
            )}
          </div>

          {/* Top KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">All-Time Revenue</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 font-tabular">
                {formatUSD(summary?.revenue)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {formatNumber(summary?.units_sold)} total hardware units sold
              </p>
            </div>

            {/* Gross Profit */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Gross Profit</span>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-teal-700 font-tabular">
                {formatUSD(summary?.gross_profit)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Gross margin:{' '}
                <span className="font-semibold text-slate-700">
                  {summary?.revenue > 0
                    ? `${((Number(summary.gross_profit) / Number(summary.revenue)) * 100).toFixed(1)}%`
                    : '0%'}
                </span>{' '}
                (sales price - unit cost)
              </p>
            </div>

            {/* Total Sales Transactions */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Sales Completed</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 font-tabular">
                {formatNumber(summary?.total_sales)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Avg order value:{' '}
                <span className="font-semibold text-slate-700 font-tabular">
                  {summary?.total_sales > 0
                    ? formatUSD(Number(summary.revenue) / Number(summary.total_sales))
                    : '$0.00'}
                </span>
              </p>
            </div>

            {/* Stock Units & Low Stock Alert */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Stock Units Available</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 font-tabular">
                {formatNumber(summary?.stock_units)}
              </p>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Active product inventory</span>
                {Number(summary?.low_stock_items) > 0 ? (
                  <Link
                    to="/inventory?low_stock_only=true"
                    className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 hover:bg-amber-100 transition-colors"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {summary?.low_stock_items} Low Stock
                  </Link>
                ) : (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                    Stock Healthy
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row: Monthly Revenue & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 12-Month Sales Trend */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Monthly Revenue Trend (Last 12 Calendar Months)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chronological sales revenue across all 12 consecutive months
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  USD Revenue
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlySales}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatMonthAxis}
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-lg border border-slate-700 space-y-1">
                              <p className="font-semibold text-slate-200">{data.month}</p>
                              <p className="text-blue-300 font-tabular font-bold">
                                Revenue: {formatUSD(data.revenue)}
                              </p>
                              <p className="text-slate-400 font-tabular">
                                Orders: {formatNumber(data.total_sales)}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563EB"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales by Category */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Revenue by Category</h3>
                <p className="text-xs text-slate-500">Sales volume per hardware product line</p>
              </div>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categories}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis
                      type="number"
                      stroke="#94A3B8"
                      fontSize={10}
                      tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      stroke="#475569"
                      fontSize={11}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value, name, item) => [
                        formatUSD(value),
                        `Units: ${item.payload.units_sold}`,
                      ]}
                    />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                      {categories.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category Legend list */}
              <div className="mt-auto pt-3 border-t border-slate-100 space-y-2">
                {categories.map((cat, idx) => (
                  <div key={cat.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                      />
                      <span className="font-medium text-slate-700 truncate max-w-[120px]">
                        {cat.category}
                      </span>
                    </div>
                    <div className="text-right font-tabular">
                      <span className="font-semibold text-slate-900">{formatUSD(cat.revenue)}</span>
                      <span className="text-slate-400 text-[10px] ml-1.5">
                        ({formatNumber(cat.units_sold)} pcs)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Branch Performance Comparison */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-600" />
                  Branch Network Performance (All 3 Stores)
                </h3>
                <p className="text-xs text-slate-500">
                  Global comparison across physical branches in Algeria (Algiers, Oran, Constantine)
                </p>
              </div>
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                All-Branches Scope
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {branchPerformance.map((branch) => {
                const totalRev = branchPerformance.reduce((acc, b) => acc + Number(b.revenue), 0)
                const sharePercent =
                  totalRev > 0 ? ((Number(branch.revenue) / totalRev) * 100).toFixed(1) : '0'

                return (
                  <div
                    key={branch.branch_id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-slate-900">{branch.branch}</span>
                        <span className="text-xs font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                          {sharePercent}% share
                        </span>
                      </div>
                      <div className="space-y-1.5 mt-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Revenue:</span>
                          <span className="font-bold text-slate-900 font-tabular">
                            {formatUSD(branch.revenue)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Gross Profit:</span>
                          <span className="font-semibold text-teal-700 font-tabular">
                            {formatUSD(branch.gross_profit)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Sales Transactions:</span>
                          <span className="font-medium text-slate-700 font-tabular">
                            {formatNumber(branch.total_sales)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-4 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, Number(sharePercent)))}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bottom Grid: Top Selling Products & Restock Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    Top Best-Selling Products
                  </h3>
                  <p className="text-xs text-slate-500">Highest volume hardware items</p>
                </div>
                <Link
                  to="/products"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  View Catalog <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {topProducts.length === 0 ? (
                <div className="p-8">
                  <EmptyState title="No sales recorded" description="No products have been sold yet." />
                </div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">#</th>
                        <th className="py-2.5 px-4">Product / SKU</th>
                        <th className="py-2.5 px-4 text-right">Units Sold</th>
                        <th className="py-2.5 px-4 text-right">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {topProducts.map((p, index) => (
                        <tr key={p.product_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-400">
                            #{index + 1}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900 truncate max-w-[200px]">
                              {p.product}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">{p.sku}</p>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-800 font-tabular">
                            {formatNumber(p.units_sold)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 font-tabular">
                            {formatUSD(p.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Low-Stock Restock Alerts */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Low-Stock Restock Alerts
                  </h3>
                  <p className="text-xs text-slate-500">Products at or below branch reorder threshold</p>
                </div>
                <Link
                  to="/inventory?low_stock_only=true"
                  className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                >
                  Manage Stock <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {lowStock.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={Boxes}
                    title="All products stocked"
                    description="No branch currently has inventory at or below reorder levels."
                  />
                </div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Branch</th>
                        <th className="py-2.5 px-4">Product / SKU</th>
                        <th className="py-2.5 px-4 text-center">Available</th>
                        <th className="py-2.5 px-4 text-center">Reorder Lvl</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {lowStock.slice(0, 6).map((item, idx) => (
                        <tr
                          key={`${item.branch}-${item.product_id}-${idx}`}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="py-2.5 px-4 font-medium text-slate-600">
                            {item.branch}
                          </td>
                          <td className="py-2.5 px-4">
                            <p className="font-semibold text-slate-900 truncate max-w-[180px]">
                              {item.product}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>
                          </td>
                          <td className="py-2.5 px-4 text-center font-bold text-rose-600 font-tabular">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-4 text-center text-slate-500 font-tabular">
                            {item.reorder_level}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <Link
                              to={`/inventory?search=${encodeURIComponent(item.sku)}`}
                              className="inline-flex text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              Restock
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
