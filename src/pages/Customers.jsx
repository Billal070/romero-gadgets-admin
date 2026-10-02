import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Badge, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Modal, SearchInput, Select, EmptyState, Skeleton, ConfirmDialog } from '../components/ui'
import { fmt, fmtDateTime, timeAgo } from '../lib/utils'
import { useToast } from '../hooks/useToast'
import { Users, Eye, AlertTriangle, Shield, ShieldOff, Phone, Mail, MapPin, ShoppingCart, Star } from 'lucide-react'

function CustomerDetail({ customerId, onClose }) {
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState([])
  const [addresses, setAddresses] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})

  useEffect(() => {
    if (!customerId) return
    setLoading(true)
    Promise.all([
      supabase.from('customers').select('*').eq('id', customerId).single(),
      supabase.from('orders').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
      supabase.from('addresses').select('*').eq('customer_id', customerId),
      supabase.from('wishlists').select('*, products(name)').eq('customer_id', customerId),
      supabase.from('reviews').select('*, products(name)').eq('customer_id', customerId)
    ]).then(([c, o, a, w, r]) => {
      setCustomer(c.data)
      setOrders(o.data || [])
      setAddresses(a.data || [])
      setWishlist(w.data || [])
      setReviews(r.data || [])
      const all = o.data || []
      setStats({
        total: all.length,
        delivered: all.filter((x) => x.order_status === 'delivered').length,
        cancelled: all.filter((x) => x.order_status === 'cancelled').length,
        returned: all.filter((x) => x.order_status === 'returned').length,
        spent: all.filter((x) => x.order_status === 'delivered').reduce((s, x) => s + x.total_amount, 0)
      })
      setLoading(false)
    })
  }, [customerId])

  if (loading) return <Modal open onClose={onClose} title="Customer Details" size="xl"><div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div></Modal>
  if (!customer) return null

  const cancelRate = stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0
  const returnRate = stats.total > 0 ? Math.round((stats.returned / stats.total) * 100) : 0
  const isHighRisk = cancelRate > 30 || returnRate > 20

  return (
    <Modal open onClose={onClose} title={customer.full_name} size="xl">
      <div className="space-y-6">
        {isHighRisk && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
            High risk customer — {cancelRate}% cancellation, {returnRate}% return rate
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-xl font-extrabold text-navy-900">{stats.total}</p><p className="text-xs text-gray-500">Orders</p></div>
          <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-xl font-extrabold text-green-600">{stats.delivered}</p><p className="text-xs text-gray-500">Delivered</p></div>
          <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-xl font-extrabold text-red-600">{stats.cancelled}</p><p className="text-xs text-gray-500">Cancelled</p></div>
          <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-xl font-extrabold text-navy-900">{fmt(stats.spent)}</p><p className="text-xs text-gray-500">Total Spent</p></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-bold text-navy-900 mb-3">Contact</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />{customer.phone}</div>
              {customer.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" />{customer.email}</div>}
            </div>
            {addresses.length > 0 && (
              <>
                <h4 className="text-sm font-bold text-navy-900 mb-3 mt-4">Addresses</h4>
                {addresses.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-sm mb-2"><MapPin className="w-4 h-4 text-gray-400 mt-0.5" /><span>{a.address_line}, {a.district}</span></div>
                ))}
              </>
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-navy-900 mb-3">Recent Orders</h4>
            <div className="space-y-2">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <span className="font-semibold">{o.order_number}</span>
                  <span className="font-bold">{fmt(o.total_amount)}</span>
                  <Badge color={o.order_status === 'delivered' ? 'green' : o.order_status === 'cancelled' ? 'red' : 'amber'}>{o.order_status}</Badge>
                </div>
              ))}
              {orders.length === 0 && <p className="text-sm text-gray-400">No orders yet</p>}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('customers').select('*').order('created_at', { ascending: false })
    if (search) query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)
    const { data } = await query.limit(100)
    setCustomers(data || [])
    setLoading(false)
  }, [search])

  useEffect(() => { loadCustomers() }, [loadCustomers])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{customers.length} customers</p>
        </div>
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="w-64" />
      </div>

      <Card>
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : customers.length === 0 ? (
          <EmptyState icon={Users} title="No customers" message="No customers found." />
        ) : (
          <Table>
            <TableHeader><TableHead>Customer</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead><TableHead>Joined</TableHead><TableHead className="text-right">Actions</TableHead></TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center"><span className="text-brand-600 text-xs font-bold">{c.full_name[0]}</span></div>
                      <span className="font-semibold text-navy-900">{c.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell>{c.email || '—'}</TableCell>
                  <TableCell><span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span></TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setSelected(c.id)}><Eye className="w-3.5 h-3.5" /> View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {selected && <CustomerDetail customerId={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
