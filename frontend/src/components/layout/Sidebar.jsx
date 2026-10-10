import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Truck,
  ArrowLeftRight,
  Cpu,
  Store,
  X,
} from 'lucide-react'

export const navItems = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: 'Products',
    path: '/products',
    icon: Package,
    badge: null,
  },
  {
    name: 'Inventory',
    path: '/inventory',
    icon: Boxes,
    badge: null,
  },
  {
    name: 'Sales / POS',
    path: '/sales',
    icon: ShoppingCart,
    badge: null,
  },
  {
    name: 'Suppliers & Purchases',
    path: '/suppliers',
    icon: Truck,
    badge: null,
  },
  {
    name: 'Stock Transfers',
    path: '/transfers',
    icon: ArrowLeftRight,
    badge: null,
  },
]

export function Sidebar({ mobileOpen = false, setMobileOpen }) {
  const content = (
    <div className="flex flex-col h-full bg-[#111B2C] text-slate-300 w-64 select-none">
      {/* Brand Header */}
      <div className="px-6 py-5.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
              Retail Intelligence
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Hardware Multi-Branch</p>
          </div>
        </div>
        {setMobileOpen && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Branch Network Indicator */}
      <div className="mx-4 my-3 px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-200 truncate">3 Hardware Branches</p>
          <p className="text-[10px] text-slate-400 truncate">Algiers · Oran · Constantine</p>
        </div>
        <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Operations
        </p>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0 transition-colors" />
                <span>{item.name}</span>
              </div>
            </NavLink>
          )
        })}
      </nav>

      {/* System Footer info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="text-[11px] text-slate-400 space-y-0.5">
          <p className="font-medium text-slate-300">FastAPI & Neon Engine</p>
          <p className="text-[10px] text-slate-400">PostgreSQL Operational Store</p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar (Persistent) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 shadow-xl border-r border-slate-800">
        {content}
      </aside>

      {/* Mobile Drawer (Collapsible) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#111B2C] shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar
