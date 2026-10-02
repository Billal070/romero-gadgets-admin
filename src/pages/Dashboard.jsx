import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, StatCard, Badge, StatusBadge, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Skeleton, EmptyState, Select, Button } from '../components/ui'
import { fmt, fmtDateTime, getRangeDates } from '../lib/utils'
import { ORDER_STATUSES, DATE_RANGES } from '../lib/constants'
import { ShoppingCart, Users, Package, AlertTriangle, TrendingUp, DollarSign, Star, PackageX, Clock } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [recentOrders, setRecentOrders] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [recentReviews, setRecentReviews] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [chartData, setChartData] = useState([])
  const [range, setRange] = useState('7d')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    const { start, end } = getRangeDates(range)

    const [
      orderStats,
      recentOrdersRes,
      topProductsRes,
      reviewsRes,
      lowStockRes,
      chartRes
    ] = await Promise.all([
      supabase.rpc('get_order_stats', { start_date: start.toISOString(), end_date: end.toISOString() }),
      supabase.from('orders').select('*, customers(full_name)').order('created_at', { ascending: false }).limit(8),
      supabase.rpc('get_top_products', { start_date: start.toISOString(), end_date: end.toISOString(), limit: 5 }),
      supabase.from('reviews').select('*, products(name), customers(full_name)').order('created_at', { ascending: false }).limit(5),
      supabase.from('products').select('name, stock_quantity, low_stock_threshold').lte('stock_quantity', 5).order('stock_quantity').limit(5),
      supabase.rpc('get_sales_chart', { start_date: start.toISOString(), end_date: end.toISOString() })
    ])

    setStats(orderStats.data || {})
    setRecentOrders(recentOrdersRes.data || [])
    setTopProducts(topProductsRes.data || [])
    setRecentReviews(reviewsRes.data || [])
    setLowStock(lowStockRes.data || [])
    setChartData(chartRes.data?.series ?? [])
    setLoading(false)
  }, [range])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  const statusCounts = stats.status_counts || {}

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back. Here's what's happening.</p>
        </div>
        <Select value={range} onChange={(e) => setRange(e.target.value)} className="w-40">
          {DATE_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={fmt(stats.total_revenue)} color="green" />
        <StatCard icon={ShoppingCart} label="Total Orders" value={stats.total_orders || 0} color="blue" />
        <StatCard icon={Users} label="Total Customers" value={stats.total_customers || 0} color="purple" />
        <StatCard icon={Package} label="Total Products" value={stats.total_products || 0} color="navy" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {ORDER_STATUSES.map((s) => (
          <Card key={s.value} className="p-4 text-center">
            <p className="text-2xl font-extrabold text-navy-900">{statusCounts[s.value] || 0}</p>
            <p className="text-xs font-medium text-gray-500 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue Overview" subtitle="Sales performance over time" />
          <div className="p-4 h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => fmt(v)} labelFormatter={(v) => fmtDateTime(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={TrendingUp} title="No data" message="No sales data for this period." />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Top Products" subtitle="Best sellers" />
          <div className="p-4 space-y-4">
            {topProducts.length > 0 ? topProducts.map((p, i) => (
              <div key={p.product_id} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-900 truncate">{p.product_name}</p>
                  <p className="text-xs text-gray-400">{p.units_sold} sold</p>
                </div>
                <p className="text-sm font-bold text-navy-900">{fmt(p.revenue)}</p>
              </div>
            )) : <EmptyState icon={Package} title="No data" message="No product sales yet." />}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Recent Orders" subtitle="Latest orders" action={<Button variant="ghost" size="sm" onClick={() => window.location.href = '/orders'}>View all</Button>} />
          <Table>
            <TableHeader>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id} onClick={() => window.location.href = `/orders/${order.id}`}>
                  <TableCell><span className="font-semibold text-navy-900">{order.order_number}</span></TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell><span className="font-bold">{fmt(order.total_amount)}</span></TableCell>
                  <TableCell><StatusBadge status={order.order_status} statuses={ORDER_STATUSES} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {recentOrders.length === 0 && <EmptyState icon={ShoppingCart} title="No orders" message="No orders yet." />}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Recent Reviews" subtitle="Latest customer reviews" />
            <div className="p-4 space-y-4">
              {recentReviews.length > 0 ? recentReviews.map((r) => (
                <div key={r.id} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                    <span className="text-brand-600 text-xs font-bold">{r.customers?.full_name?.[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-navy-900 truncate">{r.customers?.full_name}</p>
                      <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />)}</div>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{r.products?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{r.comment}</p>
                  </div>
                  <Badge color={r.is_approved ? 'green' : 'amber'}>{r.is_approved ? 'Approved' : 'Pending'}</Badge>
                </div>
              )) : <EmptyState icon={Star} title="No reviews" message="No reviews yet." />}
            </div>
          </Card>

          <Card>
            <CardHeader title="Low Stock Alerts" subtitle="Products running low" />
            <div className="p-4 space-y-3">
              {lowStock.length > 0 ? lowStock.map((p) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${p.stock_quantity === 0 ? 'bg-red-100' : 'bg-amber-100'}`}>
                      {p.stock_quantity === 0 ? <PackageX className="w-4 h-4 text-red-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    </div>
                    <p className="text-sm font-semibold text-navy-900">{p.name}</p>
                  </div>
                  <Badge color={p.stock_quantity === 0 ? 'red' : 'amber'}>
                    {p.stock_quantity === 0 ? 'Out of stock' : `${p.stock_quantity} left`}
                  </Badge>
                </div>
              )) : <EmptyState icon={Package} title="All good" message="No low stock alerts." />}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
