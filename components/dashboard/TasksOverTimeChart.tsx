'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useTheme } from '@/components/theme/ThemeProvider'
import { getChartColor, getThemeColor } from '@/lib/chart-colors'

interface TasksOverTimeChartProps {
  data: Array<{ date: string; count: number }>
}

export function TasksOverTimeChart({ data }: TasksOverTimeChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const gridColor = getThemeColor('--border', isDark, isDark ? 'hsl(228 50% 20%)' : 'hsl(228 60% 75%)')
  const axisColor = getThemeColor('--muted-foreground', isDark, isDark ? 'hsl(228 30% 70%)' : 'hsl(228 30% 40%)')
  const lineColor = getChartColor(0, isDark) // Use chart-1 (Royal Blue)
  const tooltipBg = getThemeColor('--card', isDark, isDark ? 'hsl(228 50% 12%)' : 'hsl(0 0% 100%)')
  const tooltipBorder = getThemeColor('--border', isDark, isDark ? 'hsl(228 50% 20%)' : 'hsl(228 60% 75%)')
  const tooltipText = getThemeColor('--card-foreground', isDark, isDark ? 'hsl(228 30% 95%)' : 'hsl(228 76% 20%)')

  // Always show chart even if all values are 0
  const chartData = data && data.length > 0 ? data : []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Tasks Created Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis 
              dataKey="date" 
              stroke={axisColor}
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke={axisColor}
              style={{ fontSize: '12px' }}
              domain={[0, 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: '0.5rem',
                color: tooltipText,
              }}
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke={lineColor} 
              strokeWidth={2}
              dot={{ fill: lineColor, r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
