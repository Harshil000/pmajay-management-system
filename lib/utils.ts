import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency for Indian context
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format numbers with Indian numbering system
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num)
}

// Get status color - Dark theme optimized
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'approved':
      return 'bg-green-900/50 text-green-300 border border-green-700'
    case 'in progress':
    case 'ongoing':
      return 'bg-blue-900/50 text-blue-300 border border-blue-700'
    case 'pending':
    case 'under review':
      return 'bg-amber-900/50 text-amber-300 border border-amber-700'
    case 'delayed':
    case 'rejected':
      return 'bg-red-900/50 text-red-300 border border-red-700'
    default:
      return 'bg-gray-800/50 text-gray-300 border border-gray-600'
  }
}