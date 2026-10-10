/**
 * Formatting utilities for Retail Intelligence
 * Handles USD currency, numbers, timestamps, and retail status determinations.
 */

/**
 * Format a number or numeric string as USD ($X,XXX.XX)
 */
export function formatUSD(value) {
  if (value === null || value === undefined || value === '') return '$0.00'
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  if (isNaN(num)) return '$0.00'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Format integer or quantity with thousand separators
 */
export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '0'
  const num = typeof value === 'number' ? value : parseInt(String(value), 10)
  if (isNaN(num)) return '0'

  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Format ISO timestamp into short date (e.g., Oct 10, 2024)
 */
export function formatDate(isoStr) {
  if (!isoStr) return '—'
  const date = new Date(isoStr)
  if (isNaN(date.getTime())) return String(isoStr)

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

/**
 * Format ISO timestamp into human-readable date & time (e.g., Oct 10, 2024 14:30)
 */
export function formatDateTime(isoStr) {
  if (!isoStr) return '—'
  const date = new Date(isoStr)
  if (isNaN(date.getTime())) return String(isoStr)

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

/**
 * Determine stock status badge type
 * returns: 'out_of_stock' | 'low_stock' | 'in_stock'
 */
export function getStockStatus(quantity, reorderLevel) {
  const qty = Number(quantity) || 0
  const threshold = Number(reorderLevel) || 0

  if (qty <= 0) return 'out_of_stock'
  if (qty <= threshold) return 'low_stock'
  return 'in_stock'
}

/**
 * Format payment method into readable string
 */
export function formatPaymentMethod(method) {
  switch (method) {
    case 'cash':
      return 'Cash'
    case 'card':
      return 'Card'
    case 'bank_transfer':
      return 'Bank Transfer'
    default:
      return method ? String(method).toUpperCase() : 'Unknown'
  }
}
