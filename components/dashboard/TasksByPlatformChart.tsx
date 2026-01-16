'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTheme } from '@/components/theme/ThemeProvider'
import { getChartColors, getThemeColor } from '@/lib/chart-colors'

interface TasksByPlatformChartProps {
  data: Array<{ platform: string; count: number }>
}

export function TasksByPlatformChart({ data }: TasksByPlatformChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const colors = getChartColors(isDark)
  
  const gridColor = getThemeColor('--border', isDark, isDark ? 'hsl(228 50% 20%)' : 'hsl(228 60% 75%)')
  const axisColor = getThemeColor('--muted-foreground', isDark, isDark ? 'hsl(228 30% 70%)' : 'hsl(228 30% 40%)')
  const tooltipBg = getThemeColor('--card', isDark, isDark ? 'hsl(228 50% 12%)' : 'hsl(0 0% 100%)')
  const tooltipBorder = getThemeColor('--border', isDark, isDark ? 'hsl(228 50% 20%)' : 'hsl(228 60% 75%)')
  const tooltipText = getThemeColor('--card-foreground', isDark, isDark ? 'hsl(228 30% 95%)' : 'hsl(228 76% 20%)')

  // Always show chart even if empty - transform data for chart
  const chartData = (data && data.length > 0 ? data : []).map((item, index) => ({
    ...item,
    fill: colors[index % colors.length],
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Tasks by Platform</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                type="number"
                stroke={axisColor}
                style={{ fontSize: '12px' }}
                domain={[0, 'auto']}
              />
              <YAxis 
                type="category"
                dataKey="platform"
                stroke={axisColor}
                style={{ fontSize: '12px' }}
                width={100}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: '0.5rem',
                  color: tooltipText,
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}
