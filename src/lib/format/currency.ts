export default function formatCurrency(
  amount: number,
  options?: { locale?: string; currency?: string }
): string {
  const { locale = 'id-ID', currency = 'IDR' } = options ?? {}

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
