import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, Button, Badge, StatusBadge, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Modal, ConfirmDialog, SearchInput, Select, EmptyState, Skeleton, Input, Textarea } from '../components/ui'
import { fmt, fmtDateTime, fmtDate, timeAgo } from '../lib/utils'
import { ORDER_STATUSES, PAYMENT_STATUSES } from '../lib/constants'
import { useToast } from '../hooks/useToast'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { ShoppingCart, Eye, X, Truck, MapPin, Phone, Mail, User, Package, Clock, CheckCircle, XCircle, RotateCcw, Printer, ChevronRight, Copy } from 'lucide-react'

function OrderDetail({ orderId, onClose, onStatusChange }) {
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [updating, setUpdating] = useState(false)
  const { addToast } = useToast()

  const primaryImage = (product) => {
    const images = product?.product_images
    if (!images?.length) return null
    const [first] = [...images].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order
    )
    return first.image_url
  }

  const loadOrder = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    const [orderRes, itemsRes, historyRes] = await Promise.all([
      supabase.from('orders').select('*').eq('id', orderId).single(),
      supabase.from('order_items').select('*, products(name, product_images(image_url, is_primary, sort_order))').eq('order_id', orderId),
      supabase.from('order_status_history').select('*').eq('order_id', orderId).order('created_at', { ascending: false })
    ])
    setOrder(orderRes.data)
    setItems(itemsRes.data || [])
    setHistory(historyRes.data || [])
    setNewStatus(orderRes.data?.order_status || '')
    setLoading(false)
  }, [orderId])

  useEffect(() => { loadOrder() }, [loadOrder])

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === order.order_status) return
    setUpdating(true)
    const { error } = await supabase
      .from('orders')
      .update({ order_status: newStatus, note: note || order.note })
      .eq('id', orderId)
    setUpdating(false)
    if (error) {
      addToast('Failed to update status', 'error')
    } else {
      addToast('Order status updated')
      loadOrder()
      onStatusChange?.()
    }
  }

  const copyText = async (text, label) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        ta.remove()
      }
      addToast(`${label} copied`)
    } catch {
      addToast('Copy failed', 'error')
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html><head><title>Invoice - ${order?.order_number}</title>
      <style>body{font-family:sans-serif;padding:40px;max-width:800px;margin:0 auto}
      h1{color:#0A1F44;font-size:24px}table{width:100%;border-collapse:collapse;margin-top:20px}
      th,td{padding:10px;border:1px solid #e5e7eb;text-align:left}th{background:#f9fafb}
      .total{font-weight:bold;font-size:18px}.header{display:flex;justify-content:space-between}</style></head>
      <body>
      <div class="header"><div><h1>ROMERO GADGETS</h1><p>Where Everyday Meets Smart.</p></div>
      <div style="text-align:right"><h2>INVOICE</h2><p>${order?.order_number}</p><p>${fmtDate(order?.created_at)}</p></div></div>
      <h3>Customer</h3><p>${order?.customer_name}<br>${order?.customer_phone}<br>${order?.address_snapshot?.address_line || ''}, ${order?.address_snapshot?.district || ''}</p>
      <table><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
      <tbody>${items.map(i => `<tr><td>${i.product_name}</td><td>${i.quantity}</td><td>${fmt(i.unit_price)}</td><td>${fmt(i.total_price)}</td></tr>`).join('')}</tbody></table>
      <div style="margin-top:20px;text-align:right">
      <p>Subtotal: ${fmt(order?.subtotal)}</p>
      <p>Discount: -${fmt(order?.discount_amount)}</p>
      <p>Delivery: ${fmt(order?.delivery_fee)}</p>
      <p class="total">Total: ${fmt(order?.total_amount)}</p></div>
      <p style="margin-top:40px;color:#6b7280;font-size:12px">Payment: Cash on Delivery</p>
      </body></html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  if (loading) return <Modal open onClose={onClose} title="Order Details" size="xl"><div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div></Modal>
  if (!order) return null

  return (
    <Modal open onClose={onClose} title={`Order ${order.order_number}`} size="xl">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={order.order_status} statuses={ORDER_STATUSES} />
          <StatusBadge status={order.payment_status} statuses={PAYMENT_STATUSES} />
          <span className="text-sm text-gray-400">{timeAgo(order.created_at)}</span>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="w-4 h-4" /> Print</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-bold text-navy-900 mb-3">Customer Information</h4>
            {(() => {
              const snap = order.address_snapshot || {};
              const fullAddress = [
                snap.address || snap.address_line,
                snap.city,
                snap.district,
                snap.postal_code,
              ].filter(Boolean).join(', ');
              return (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm"><User className="w-4 h-4 text-gray-400" /><span className="font-medium">{order.customer_name}</span></div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" /><span>{order.customer_phone}</span>
                    <button onClick={() => copyText(order.customer_phone, 'Phone')} className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-brand-500" title="Copy phone" aria-label="Copy phone">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {order.customer_email && <div className="flex items-center gap-2.5 text-sm"><Mail className="w-4 h-4 text-gray-400" /><span>{order.customer_email}</span></div>}
                  {(snap.address || snap.address_line) && (
                    <div className="flex items-start gap-2.5 text-sm"><MapPin className="w-4 h-4 text-gray-400 mt-0.5" /><span>{snap.address || snap.address_line}</span></div>
                  )}
                  {snap.district && <div className="flex items-center gap-2.5 text-sm"><span className="w-4" /><span><span className="text-gray-400">District: </span>{snap.district}</span></div>}
                  {snap.city && <div className="flex items-center gap-2.5 text-sm"><span className="w-4" /><span><span className="text-gray-400">City: </span>{snap.city}</span></div>}
                  {snap.postal_code && <div className="flex items-center gap-2.5 text-sm"><span className="w-4" /><span><span className="text-gray-400">Postal code: </span>{snap.postal_code}</span></div>}
                  {(order.note || snap.note) && <div className="flex items-start gap-2.5 text-sm"><span className="w-4" /><span><span className="text-gray-400">Note: </span>{order.note || snap.note}</span></div>}
                  {fullAddress && (
                    <button onClick={() => copyText(`${order.customer_name}, ${order.customer_phone}, ${fullAddress}`, 'Full address')} className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-brand-500">
                      <Copy className="w-3.5 h-3.5" /> Copy full address
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
          <div>
            <h4 className="text-sm font-bold text-navy-900 mb-3">Order Summary</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">{fmt(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="font-semibold text-green-600">-{fmt(order.discount_amount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Delivery Fee</span><span className="font-semibold">{fmt(order.delivery_fee)}</span></div>
              <div className="border-t border-gray-200 pt-2 flex justify-between"><span className="font-bold text-navy-900">Total</span><span className="font-extrabold text-navy-900 text-lg">{fmt(order.total_amount)}</span></div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-navy-900 mb-3">Order Items</h4>
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            <Table>
              <TableHeader><TableHead>Product</TableHead><TableHead>Qty</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Total</TableHead></TableHeader>
              <TableBody>
                {items.map((item) => {
                  const image = primaryImage(item.products)
                  return (
                    <TableRow key={item.id}>
                      <TableCell><div className="flex items-center gap-3">{image && <img src={image} alt="" className="w-10 h-10 rounded-lg object-cover" />}<span className="font-medium">{item.product_name}</span></div></TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{fmt(item.unit_price)}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(item.total_price)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {(order.utm_source || order.fbclid) && (
          <div>
            <h4 className="text-sm font-bold text-navy-900 mb-3">Marketing Attribution</h4>
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {order.utm_source && <div><span className="text-gray-500 text-xs">Source</span><p className="font-semibold capitalize">{order.utm_source}</p></div>}
              {order.utm_medium && <div><span className="text-gray-500 text-xs">Medium</span><p className="font-semibold">{order.utm_medium}</p></div>}
              {order.utm_campaign && <div><span className="text-gray-500 text-xs">Campaign</span><p className="font-semibold">{order.utm_campaign}</p></div>}
              {order.utm_content && <div><span className="text-gray-500 text-xs">Content</span><p className="font-semibold">{order.utm_content}</p></div>}
              {order.fbclid && <div><span className="text-gray-500 text-xs">FBCLID</span><p className="font-semibold text-xs break-all">{order.fbclid}</p></div>}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-bold text-navy-900 mb-3">Status History</h4>
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={h.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-brand-500' : 'bg-gray-300'}`} />
                  {i < history.length - 1 && <div className="w-0.5 h-6 bg-gray-200" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={h.to_status} statuses={ORDER_STATUSES} />
                    <span className="text-xs text-gray-400">{fmtDateTime(h.created_at)}</span>
                  </div>
                  {h.note && <p className="text-xs text-gray-500 mt-0.5">{h.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-bold text-navy-900 mb-3">Update Status</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="flex-1">
              {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
            <Button onClick={handleStatusUpdate} loading={updating} disabled={newStatus === order.order_status}>Update Status</Button>
          </div>
          <Textarea placeholder="Add internal note..." value={note} onChange={(e) => setNote(e.target.value)} className="mt-3" rows={2} />
        </div>
      </div>
    </Modal>
  )
}

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const perPage = 15
  const { addToast } = useToast()

  const debouncedSearch = useDebouncedValue(search)
  const safeSearch = debouncedSearch.replace(/[,()]/g, '').trim()

  const loadOrders = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('orders').select('*', { count: 'exact' }).order('created_at', { ascending: false })

    if (statusFilter) query = query.eq('order_status', statusFilter)
    if (safeSearch) query = query.or(`order_number.ilike.%${safeSearch}%,customer_name.ilike.%${safeSearch}%,customer_phone.ilike.%${safeSearch}%`)

    const { data, count } = await query.range((page - 1) * perPage, page * perPage - 1)
    setOrders(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [page, statusFilter, safeSearch])

  useEffect(() => { loadOrders() }, [loadOrders])
  useEffect(() => { setPage(1) }, [safeSearch])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total orders</p>
        </div>
        <div className="flex gap-3">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="w-64" />
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="w-36">
            <option value="">All Status</option>
            {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : orders.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No orders found" message="Try adjusting your filters or search." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} onClick={() => setSelectedOrder(order.id)}>
                      <TableCell><span className="font-bold text-navy-900">{order.order_number}</span></TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell>{order.customer_phone}</TableCell>
                      <TableCell><span className="font-bold">{fmt(order.total_amount)}</span></TableCell>
                      <TableCell><StatusBadge status={order.payment_status} statuses={PAYMENT_STATUSES} /></TableCell>
                      <TableCell><StatusBadge status={order.order_status} statuses={ORDER_STATUSES} /></TableCell>
                      <TableCell><span className="text-xs text-gray-400">{timeAgo(order.created_at)}</span></TableCell>
                      <TableCell><ChevronRight className="w-4 h-4 text-gray-300" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {selectedOrder && (
        <OrderDetail orderId={selectedOrder} onClose={() => setSelectedOrder(null)} onStatusChange={loadOrders} />
      )}
    </div>
  )
}
