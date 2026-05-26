export interface CurrencyOption {
  code: string
  symbol: string
  name: string
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
]

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.symbol || '₹'
}

export function getCurrencyName(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.name || 'Indian Rupee'
}

export function formatCurrencyAmount(amount: number, currency: string = 'INR'): string {
  const symbol = getCurrencySymbol(currency)
  const locale = currency === 'INR' ? 'en-IN' : 'en-US'
  return `${symbol}${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
