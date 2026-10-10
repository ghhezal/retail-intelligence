import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import { BranchProvider } from './context/BranchContext'
import { AppShell } from './components/layout/AppShell'

// Pages
import { Dashboard } from './pages/Dashboard'
import { Products } from './pages/Products'
import { Inventory } from './pages/Inventory'
import { Sales } from './pages/Sales'
import { Suppliers } from './pages/Suppliers'
import { Transfers } from './pages/Transfers'
import { NotFound } from './pages/NotFound'

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <BranchProvider>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="sales" element={<Sales />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="transfers" element={<Transfers />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BranchProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
