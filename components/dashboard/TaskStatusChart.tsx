'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTheme } from '@/components/theme/ThemeProvider'
import { getChartColor, getThemeColor } from '@/lib/chart-colors'

interface TaskStatusChartProps {
  data: Array<{ status: string; count: number }>
}

const statusLabels: Record<string, string> = {
  new: 'New',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
}

// Map statuses to chart color indices
const statusColorMap: Record<string, number> = {
  new: 0,           // chart-1 (Royal Blue)
  accepted: 1,      // chart-2 (Medium Blue)
  in_progress: 2,   // chart-3 (Muted Periwinkle)
  completed: 3,     // chart-4 (Vivid Lime Green)
}

export function TaskStatusChart({ data }: TaskStatusChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const gridColor = getThemeColor('--border', isDark, isDark ? 'hsl(228 50% 20%)' : 'hsl(228 60% 75%)')
  const axisColor = getThemeColor('--muted-foreground', isDark, isDark ? 'hsl(228 30% 70%)' : 'hsl(228 30% 40%)')
  const tooltipBg = getThemeColor('--card', isDark, isDark ? 'hsl(228 50% 12%)' : 'hsl(0 0% 100%)')
  const tooltipBorder = getThemeColor('--border', isDark, isDark ? 'hsl(228 50% 20%)' : 'hsl(228 60% 75%)')
  const tooltipText = getThemeColor('--card-foreground', isDark, isDark ? 'hsl(228 30% 95%)' : 'hsl(228 76% 20%)')

  // Always show chart even if all values are 0 - transform data for chart
  const chartData = (data && data.length > 0 ? data : []).map(item => ({
    ...item,
    name: statusLabels[item.status] || item.status,
    fill: getChartColor(statusColorMap[item.status] ?? 0, isDark),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Task Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis 
              dataKey="name" 
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
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
