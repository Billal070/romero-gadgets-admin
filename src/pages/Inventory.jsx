import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, Button, Badge, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Modal, SearchInput, EmptyState, Skeleton, Input, Select } from '../components/ui'
import { fmt, fmtDateTime } from '../lib/utils'
import { useToast } from '../hooks/useToast'
import { Package, AlertTriangle, PackageX, Plus, Minus, History } from 'lucide-react'

function AdjustStock({ product, onClose, onSave }) {
  const [adjustment, setAdjustment] = useState('')
  const [reason, setReason] = useState('restock')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const handleSave = async () => {
    const qty = Number(adjustment)
    if (!qty || qty === 0) { addToast('Enter a valid quantity', 'error'); return }
    setLoading(true)
    const change = reason === 'restock' ? Math.abs(qty) : -Math.abs(qty)
    const { error } = await supabase.rpc('adjust_inventory', {
      p_product_id: product.id,
      p_change_quantity: change,
      p_reason: reason,
      p_note: note
    })
    setLoading(false)
    if (error) addToast('Failed to adjust stock', 'error')
    else { addToast('Stock updated'); onSave(); onClose() }
  }

  return (
    <Modal open onClose={onClose} title={`Adjust Stock — ${product.name}`} size="sm">
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">Current Stock</p>
          <p className="text-3xl font-extrabold text-navy-900">{product.stock_quantity}</p>
        </div>
        <Select label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="restock">Restock (Add)</option>
          <option value="adjustment">Manual Adjustment</option>
          <option value="return">Return</option>
        </Select>
        <Input label="Quantity" type="number" value={adjustment} onChange={(e) => setAdjustment(e.target.value)} placeholder="Enter quantity" />
        <Input label="Note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={loading}>Update Stock</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('stock')
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [productsRes, logsRes] = await Promise.all([
      supabase.from('products').select('*').order('stock_quantity'),
      supabase.from('inventory_logs').select('*, products(name), admin_users(full_name)').order('created_at', { ascending: false }).limit(50)
    ])
    setProducts(productsRes.data || [])
    setLogs(logsRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const lowStock = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold)
  const outOfStock = products.filter((p) => p.stock_quantity === 0)
  const totalValue = products.reduce((sum, p) => sum + (p.cost_price || 0) * p.stock_quantity, 0)

  const filtered = search
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-900">Inventory</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage stock levels and track changes</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-100"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-2xl font-extrabold text-navy-900">{lowStock.length}</p><p className="text-sm text-gray-500">Low Stock</p></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-100"><PackageX className="w-5 h-5 text-red-600" /></div>
            <div><p className="text-2xl font-extrabold text-navy-900">{outOfStock.length}</p><p className="text-sm text-gray-500">Out of Stock</p></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-100"><Package className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-2xl font-extrabold text-navy-900">{fmt(totalValue)}</p><p className="text-sm text-gray-500">Stock Value</p></div>
          </div>
        </Card>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <button onClick={() => setActiveTab('stock')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'stock' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500'}`}>Stock Levels</button>
        <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'history' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500'}`}>History</button>
      </div>

      {activeTab === 'stock' && (
        <Card>
          <CardHeader title="Stock Levels" subtitle={`${products.length} products`} action={<SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-56" />} />
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (
            <Table>
              <TableHeader><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Stock</TableHead><TableHead>Threshold</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><span className="font-semibold text-navy-900">{p.name}</span></TableCell>
                    <TableCell>{p.sku || '—'}</TableCell>
                    <TableCell><span className="font-bold">{p.stock_quantity}</span></TableCell>
                    <TableCell>{p.low_stock_threshold}</TableCell>
                    <TableCell><Badge color={p.stock_quantity === 0 ? 'red' : p.stock_quantity <= p.low_stock_threshold ? 'amber' : 'green'}>{p.stock_quantity === 0 ? 'Out of Stock' : p.stock_quantity <= p.low_stock_threshold ? 'Low' : 'In Stock'}</Badge></TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setSelectedProduct(p)}>Adjust</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader title="Inventory History" subtitle="Recent stock changes" />
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (
            <Table>
              <TableHeader><TableHead>Product</TableHead><TableHead>Change</TableHead><TableHead>Reason</TableHead><TableHead>By</TableHead><TableHead>Date</TableHead></TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell><span className="font-semibold text-navy-900">{log.products?.name}</span></TableCell>
                    <TableCell><Badge color={log.change_quantity > 0 ? 'green' : 'red'}>{log.change_quantity > 0 ? '+' : ''}{log.change_quantity}</Badge></TableCell>
                    <TableCell><Badge color="gray" className="capitalize">{log.reason}</Badge></TableCell>
                    <TableCell>{log.admin_users?.full_name || 'System'}</TableCell>
                    <TableCell><span className="text-xs text-gray-400">{fmtDateTime(log.created_at)}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {selectedProduct && <AdjustStock product={selectedProduct} onClose={() => setSelectedProduct(null)} onSave={loadData} />}
    </div>
  )
}
