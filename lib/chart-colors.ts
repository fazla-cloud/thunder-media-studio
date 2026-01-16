/**
 * Chart color utilities using theme CSS variables
 */

export function getChartColors(isDark: boolean = false): string[] {
  if (typeof window === 'undefined') {
    // Default colors for SSR
    return isDark
      ? ['hsl(228 76% 55%)', 'hsl(228 58% 60%)', 'hsl(228 60% 65%)', 'hsl(110 99% 60%)', 'hsl(228 50% 25%)']
      : ['hsl(228 76% 44%)', 'hsl(228 58% 51%)', 'hsl(228 60% 64%)', 'hsl(110 99% 54%)', 'hsl(228 58% 80%)']
  }

  const root = document.documentElement
  return [
    getComputedStyle(root).getPropertyValue('--chart-1').trim() || (isDark ? 'hsl(228 76% 55%)' : 'hsl(228 76% 44%)'),
    getComputedStyle(root).getPropertyValue('--chart-2').trim() || (isDark ? 'hsl(228 58% 60%)' : 'hsl(228 58% 51%)'),
    getComputedStyle(root).getPropertyValue('--chart-3').trim() || (isDark ? 'hsl(228 60% 65%)' : 'hsl(228 60% 64%)'),
    getComputedStyle(root).getPropertyValue('--chart-4').trim() || (isDark ? 'hsl(110 99% 60%)' : 'hsl(110 99% 54%)'),
    getComputedStyle(root).getPropertyValue('--chart-5').trim() || (isDark ? 'hsl(228 50% 25%)' : 'hsl(228 58% 80%)'),
  ]
}

export function getChartColor(index: number, isDark: boolean = false): string {
  const colors = getChartColors(isDark)
  return colors[index % colors.length]
}

export function getThemeColor(variable: string, isDark: boolean = false, fallback: string = ''): string {
  if (typeof window === 'undefined') return fallback
  const root = document.documentElement
  const value = getComputedStyle(root).getPropertyValue(variable).trim()
  return value || fallback
}
