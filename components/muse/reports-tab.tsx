'use client'

import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { LEDGER, CATEGORY_META, currency, Category } from '@/lib/muse-data'

export function ReportsTab() {
  // Aggregate expenses by category
  const data = useMemo(() => {
    const totals = LEDGER.reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + entry.amount
      return acc
    }, {} as Record<string, number>)

    return Object.entries(totals)
      .map(([category, amount]) => ({
        name: CATEGORY_META[category as Category].label,
        value: amount,
        category,
      }))
      .sort((a, b) => b.value - a.value)
  }, [])

  const totalSpend = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0)
  }, [data])

  // Custom colors matching the brand
  const COLORS: Record<string, string> = {
    backbar: '#a9823f', // gold
    utilities: '#8ba699', // sage
    marketing: '#e6cf9c', // accent-foreground
    supplies: '#a1a1aa', // muted-foreground
    personal: '#e0736f', // destructive (or a nice red/pink)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center justify-center space-y-1 mt-4">
        <p className="text-sm font-medium text-muted-foreground">Total Spend (June)</p>
        <h2 className="text-3xl font-serif font-bold text-foreground tracking-tight">
          {currency(totalSpend)}
        </h2>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
        <h3 className="text-sm font-semibold tracking-tight text-foreground mb-4">
          Expense Distribution
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.category] || '#d9be86'} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => currency(value)}
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)',
                  borderRadius: '0.5rem',
                  color: 'var(--foreground)',
                }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
