import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, StatCard, Badge, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Select, EmptyState, Skeleton } from '../components/ui'
import { fmt, getRangeDates } from '../lib/utils'
import { DATE_RANGES, MARKETING_SOURCES } from '../lib/constants'
import { BarChart3, TrendingUp, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Marketing() {
  const [range, setRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [sourceData, setSourceData] = useState([])
  const [campaignData, setCampaignData] = useState([])

  const loadData = useCallback(async () => {
    setLoading(true)
    const { start, end } = getRangeDates(range)

    const [sourceRes, campaignRes] = await Promise.all([
      supabase.rpc('get_marketing_attribution', { start_date: start.toISOString(), end_date: end.toISOString() }),
      supabase.rpc('get_campaign_performance', { start_date: start.toISOString(), end_date: end.toISOString() })
    ])

    setSourceData(sourceRes.data || [])
    setCampaignData(campaignRes.data || [])
    setLoading(false)
  }, [range])

  useEffect(() => { loadData() }, [loadData])

  const totalOrders = sourceData.reduce((s, x) => s + (x.orders || 0), 0)
  const totalRevenue = sourceData.reduce((s, x) => s + (x.revenue || 0), 0)

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Marketing Attribution</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track where your orders come from</p>
        </div>
        <Select value={range} onChange={(e) => setRange(e.target.value)} className="w-40">
          {DATE_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Target} label="Total Orders" value={totalOrders} color="blue" />
        <StatCard icon={TrendingUp} label="Total Revenue" value={fmt(totalRevenue)} color="green" />
        <StatCard icon={BarChart3} label="Active Sources" value={sourceData.length} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Orders by Source" subtitle="Which channels drive orders" />
          <div className="p-4 h-72">
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={BarChart3} title="No data" message="No marketing data for this period." />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Revenue by Source" subtitle="Which channels drive revenue" />
          <div className="p-4 h-72">
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={TrendingUp} title="No data" message="No marketing data for this period." />
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Campaign Performance" subtitle="Detailed campaign breakdown" />
        <Table>
          <TableHeader><TableHead>Source</TableHead><TableHead>Campaign</TableHead><TableHead>Medium</TableHead><TableHead>Orders</TableHead><TableHead className="text-right">Revenue</TableHead></TableHeader>
          <TableBody>
            {campaignData.map((c, i) => (
              <TableRow key={i}>
                <TableCell><Badge color="blue">{c.utm_source || c.source || 'Direct'}</Badge></TableCell>
                <TableCell>{c.utm_campaign || '—'}</TableCell>
                <TableCell>{c.utm_medium || '—'}</TableCell>
                <TableCell>{c.orders}</TableCell>
                <TableCell className="text-right"><span className="font-bold">{fmt(c.revenue)}</span></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {campaignData.length === 0 && <EmptyState icon={Target} title="No campaigns" message="No campaign data available." />}
      </Card>
    </div>
  )
}
