'use client'

import { useState, useMemo, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as PieTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip } from 'recharts'
import { currency } from '@/lib/muse-data'
import { Loader2 } from 'lucide-react'

export function ReportsTab() {
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchLedger() {
      try {
        const res = await fetch('/api/ledger')
        const data = await res.json()
        if (data.data) {
          setDocuments(data.data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLedger()
  }, [])

  // Aggregate expenses by category
  const pieData = useMemo(() => {
    const totals = documents.reduce((acc, doc) => {
      const cat = doc.category || 'Uncategorized'
      const amount = Number(doc.amount) || 0
      acc[cat] = (acc[cat] || 0) + amount
      return acc
    }, {} as Record<string, number>)

    return Object.entries(totals)
      .map(([category, amount]) => ({
        name: category,
        value: amount,
        category,
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [documents])

  const totalSpend = useMemo(() => {
    return pieData.reduce((sum, item) => sum + item.value, 0)
  }, [pieData])

  // Aggregate expenses by date for BarChart
  const barData = useMemo(() => {
    const dates = documents.reduce((acc, doc) => {
      const date = new Date(doc.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      const amount = Number(doc.amount) || 0
      acc[date] = (acc[date] || 0) + amount
      return acc
    }, {} as Record<string, number>)

    return Object.entries(dates)
      .map(([date, amount]) => ({
        date,
        amount,
      }))
      .reverse() // Chronological order
  }, [documents])

  // Custom colors
  const COLORS = ['#a9823f', '#8ba699', '#e6cf9c', '#a1a1aa', '#e0736f', '#b23a3a', '#6b5222', '#3d5245', '#cdae76', '#d9be86']

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto pb-10">
      <div className="flex flex-col items-center justify-center space-y-1 mt-4">
        <p className="text-sm font-medium text-muted-foreground">Total Spend (All Time)</p>
        <h2 className="text-3xl font-serif font-bold text-foreground tracking-tight">
          {currency(totalSpend)}
        </h2>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
        <h3 className="text-sm font-semibold tracking-tight text-foreground mb-4">
          Expense Distribution by Category
        </h3>
        {pieData.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No expenses logged yet.</p>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <PieTooltip
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
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
        <h3 className="text-sm font-semibold tracking-tight text-foreground mb-4">
          Expense Trend
        </h3>
        {barData.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No expenses logged yet.</p>
        ) : (
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <BarTooltip
                  cursor={{ fill: 'var(--muted)' }}
                  formatter={(value: number) => currency(value)}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '0.5rem',
                    color: 'var(--foreground)',
                  }}
                />
                <Bar dataKey="amount" fill="#a9823f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
