const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
]

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
]

function convertChunk(num: number): string {
  if (num === 0) return ''
  if (num < 20) return ones[num]
  if (num < 100) {
    const ten = Math.floor(num / 10)
    const one = num % 10
    return tens[ten] + (one ? ' ' + ones[one] : '')
  }
  const hundred = Math.floor(num / 100)
  const remainder = num % 100
  return (
    ones[hundred] + ' Hundred' + (remainder ? ' and ' + convertChunk(remainder) : '')
  )
}

// Indian numbering system converter
function convertIndian(num: number): string {
  if (num === 0) return ''
  let remaining = num
  let result = ''

  // Handle hundreds (first 3 digits)
  const hundreds = remaining % 1000
  if (hundreds > 0) {
    result = convertChunk(hundreds)
  }
  remaining = Math.floor(remaining / 1000)

  // Thousands
  if (remaining > 0) {
    const thousands = remaining % 100
    if (thousands > 0) {
      result = convertChunk(thousands) + ' Thousand' + (result ? ' ' + result : '')
    }
    remaining = Math.floor(remaining / 100)
  }

  // Lakhs
  if (remaining > 0) {
    const lakhs = remaining % 100
    if (lakhs > 0) {
      result = convertChunk(lakhs) + ' Lakh' + (result ? ' ' + result : '')
    }
    remaining = Math.floor(remaining / 100)
  }

  // Crores
  if (remaining > 0) {
    const crores = remaining % 100
    if (crores > 0) {
      result = convertChunk(crores) + ' Crore' + (result ? ' ' + result : '')
    }
    remaining = Math.floor(remaining / 100)
  }

  return result
}

// Western numbering system converter
function convertWestern(num: number): string {
  if (num === 0) return ''
  const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion']
  let result = ''
  let scaleIndex = 0
  let remaining = num

  while (remaining > 0) {
    const chunk = remaining % 1000
    if (chunk > 0) {
      const chunkStr = convertChunk(chunk)
      const scaleStr = scales[scaleIndex] ? ' ' + scales[scaleIndex] : ''
      result = chunkStr + scaleStr + (result ? ' ' + result : '')
    }
    remaining = Math.floor(remaining / 1000)
    scaleIndex++
  }

  return result
}

// Currency configurations
interface CurrencyConfig {
  name: string          // Full name: "Indian Rupees"
  singularName: string  // Singular: "Indian Rupee"
  subunitName: string   // Subunit: "Paise" / "Cents"
  useIndianSystem: boolean // Use Lakh/Crore vs Million/Billion
}

const CURRENCY_CONFIG: Record<string, CurrencyConfig> = {
  INR: { name: 'Indian Rupees', singularName: 'Indian Rupee', subunitName: 'Paise', useIndianSystem: true },
  USD: { name: 'US Dollars', singularName: 'US Dollar', subunitName: 'Cents', useIndianSystem: false },
  EUR: { name: 'Euros', singularName: 'Euro', subunitName: 'Cents', useIndianSystem: false },
  GBP: { name: 'British Pounds', singularName: 'British Pound', subunitName: 'Pence', useIndianSystem: false },
  AED: { name: 'UAE Dirhams', singularName: 'UAE Dirham', subunitName: 'Fils', useIndianSystem: false },
  SGD: { name: 'Singapore Dollars', singularName: 'Singapore Dollar', subunitName: 'Cents', useIndianSystem: false },
  AUD: { name: 'Australian Dollars', singularName: 'Australian Dollar', subunitName: 'Cents', useIndianSystem: false },
  CAD: { name: 'Canadian Dollars', singularName: 'Canadian Dollar', subunitName: 'Cents', useIndianSystem: false },
}

export function numberToWords(amount: number, currency: string = 'INR'): string {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.INR

  if (amount === 0) return `Zero ${config.name}`

  const isNegative = amount < 0
  const absAmount = Math.abs(amount)

  const mainUnit = Math.floor(absAmount)
  const subUnit = Math.round((absAmount - mainUnit) * 100)

  let result = ''

  if (mainUnit > 0) {
    const converted = config.useIndianSystem ? convertIndian(mainUnit) : convertWestern(mainUnit)
    result = converted + (mainUnit === 1 ? ` ${config.singularName}` : ` ${config.name}`)
  }

  if (subUnit > 0) {
    if (mainUnit > 0) {
      result += ' and '
    }
    const subConverted = convertChunk(subUnit)
    result += subConverted + (subUnit === 1 ? ` ${config.subunitName.slice(0, -1)}` : ` ${config.subunitName}`)
  }

  if (isNegative) {
    result = 'Minus ' + result
  }

  return result || `Zero ${config.name}`
}
