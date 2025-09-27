import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { toast } from 'sonner';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format numbers with K, M, B, T suffixes
export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  
  const number = parseFloat(num);
  
  if (number === 0) return '0.00';
  
  const absNumber = Math.abs(number);
  
  if (absNumber >= 1e12) {
    return (number / 1e12).toFixed(decimals) + 'T';
  } else if (absNumber >= 1e9) {
    return (number / 1e9).toFixed(decimals) + 'B';
  } else if (absNumber >= 1e6) {
    return (number / 1e6).toFixed(decimals) + 'M';
  } else if (absNumber >= 1e3) {
    return (number / 1e3).toFixed(decimals) + 'K';
  } else {
    return number.toFixed(decimals);
  }
}

// Format currency with fUSD
export function formatCurrency(amount, decimals = 2) {
  return `${formatNumber(amount, decimals)} fUSD`;
}

// Format balance display
export function formatBalance(balance, decimals = 2) {
  const num = parseFloat(balance);
  if (isNaN(num)) return '0.00';
  return num.toFixed(decimals);
}