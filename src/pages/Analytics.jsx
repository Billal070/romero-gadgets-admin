import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, StatCard, Badge, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Select, EmptyState, Skeleton, Button } from '../components/ui'
import { fmt, fmtDate, getRangeDates, downloadCSV } from '../lib/utils'
import { DATE_RANGES } from '../lib/constants'
import { BarChart3, TrendingUp, Users, ShoppingCart, Package, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316']

export default function Analytics() {
  const [range, setRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState({})
  const [topProducts, setTopProducts] = useState([])
  const [statusDist, setStatusDist] = useState([])
  const [customerStats, setCustomerStats] = useState({})

  const loadData = useCallback(async () => {
    setLoading(true)
    const { start, end } = getRangeDates(range)

    const [salesRes, productsRes, statusRes, customerRes] = await Promise.all([
      supabase.rpc('get_sales_chart', { start_date: start.toISOString(), end_date: end.toISOString() }),
      supabase.rpc('get_top_products', { start_date: start.toISOString(), end_date: end.toISOString(), limit: 10 }),
      supabase.rpc('get_order_status_distribution', { start_date: start.toISOString(), end_date: end.toISOString() }),
      supabase.rpc('get_customer_stats', { start_date: start.toISOString(), end_date: end.toISOString() })
    ])

    setSalesData(salesRes.data || {})
    setTopProducts(productsRes.data || [])
    setStatusDist(statusRes.data || [])
    setCustomerStats(customerRes.data || {})
    setLoading(false)
  }, [range])

  useEffect(() => { loadData() }, [loadData])

  const handleExport = () => {
    const data = topProducts.map((p) => ({
      product: p.product_name,
      units_sold: p.units_sold,
      revenue: p.revenue
    }))
    downloadCSV(data, 'analytics_top_products.csv')
  }

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Business performance overview</p>
        </div>
        <div className="flex gap-3">
          <Select value={range} onChange={(e) => setRange(e.target.value)} className="w-40">
            {DATE_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
          <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4" /> Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Revenue" value={fmt(salesData.total_revenue)} color="green" />
        <StatCard icon={ShoppingCart} label="Orders" value={salesData.total_orders || 0} color="blue" />
        <StatCard icon={Users} label="New Customers" value={customerStats.new_customers || 0} color="purple" />
        <StatCard icon={Package} label="Products Sold" value={salesData.total_products_sold || 0} color="navy" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Revenue by Product" subtitle="Top performing products" />
          <div className="p-4 h-80">
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="product_name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Bar dataKey="revenue" fill="#2563EB" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={BarChart3} title="No data" message="No sales data for this period." />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Order Status Distribution" subtitle="Current order breakdown" />
          <div className="p-4 h-80">
            {statusDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDist} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label={({ status, count }) => `${status}: ${count}`}>
                    {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={ShoppingCart} title="No data" message="No orders in this period." />
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Top Products" subtitle="Best sellers by revenue" />
        <Table>
          <TableHeader><TableHead>#</TableHead><TableHead>Product</TableHead><TableHead>Units Sold</TableHead><TableHead className="text-right">Revenue</TableHead></TableHeader>
          <TableBody>
            {topProducts.map((p, i) => (
              <TableRow key={p.product_id}>
                <TableCell><span className="font-bold text-navy-900">{i + 1}</span></TableCell>
                <TableCell><span className="font-semibold">{p.product_name}</span></TableCell>
                <TableCell>{p.units_sold}</TableCell>
                <TableCell className="text-right"><span className="font-bold">{fmt(p.revenue)}</span></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {topProducts.length === 0 && <EmptyState icon={Package} title="No data" message="No product sales yet." />}
      </Card>
    </div>
  )
}
