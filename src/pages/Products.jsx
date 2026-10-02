import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Badge, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Modal, ConfirmDialog, SearchInput, Select, EmptyState, Skeleton, Input, Textarea, Pagination } from '../components/ui'
import { fmt, slugify } from '../lib/utils'
import { useToast } from '../hooks/useToast'
import { Package, Plus, Edit, Trash2, Star, Eye, EyeOff, Check, X } from 'lucide-react'

function ProductForm({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    category_id: product?.category_id || '',
    price: product?.price || '',
    old_price: product?.old_price || '',
    cost_price: product?.cost_price || '',
    sku: product?.sku || '',
    stock_quantity: product?.stock_quantity || 0,
    low_stock_threshold: product?.low_stock_threshold || 5,
    weight_grams: product?.weight_grams || '',
    short_description: product?.short_description || '',
    description: product?.description || '',
    features: product?.features?.join('\n') || '',
    specifications: product?.specifications ? JSON.stringify(product.specifications, null, 2) : '{}',
    meta_title: product?.meta_title || '',
    meta_description: product?.meta_description || '',
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured ?? false,
    is_best_seller: product?.is_best_seller ?? false,
    is_new_arrival: product?.is_new_arrival ?? false,
    is_trending: product?.is_trending ?? false
  })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { addToast } = useToast()

  useEffect(() => {
    supabase.from('categories').select('id, name').eq('is_active', true).then(({ data }) => setCategories(data || []))
  }, [])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.slug.trim()) e.slug = 'Slug is required'
    if (!form.category_id) e.category_id = 'Category is required'
    if (!form.price || Number(form.price) <= 0) e.price = 'Valid price is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        old_price: form.old_price ? Number(form.old_price) : null,
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        stock_quantity: Number(form.stock_quantity),
        low_stock_threshold: Number(form.low_stock_threshold),
        weight_grams: form.weight_grams ? Number(form.weight_grams) : null,
        features: form.features.split('\n').filter(Boolean),
        specifications: JSON.parse(form.specifications || '{}')
      }
      const { error } = product
        ? await supabase.from('products').update(payload).eq('id', product.id)
        : await supabase.from('products').insert(payload)
      if (error) throw error
      addToast(product ? 'Product updated' : 'Product created')
      onSave()
      onClose()
    } catch (err) {
      addToast(err.message || 'Failed to save product', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={product ? 'Edit Product' : 'Add Product'} size="xl">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Product Name" value={form.name} onChange={(e) => { set('name', e.target.value); set('slug', slugify(e.target.value)) }} error={errors.name} required />
          <Input label="Slug" value={form.slug} onChange={(e) => set('slug', e.target.value)} error={errors.slug} required />
          <Select label="Category" value={form.category_id} onChange={(e) => set('category_id', e.target.value)} error={errors.category_id} required>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="SKU" value={form.sku} onChange={(e) => set('sku', e.target.value)} />
          <Input label="Price (৳)" type="number" value={form.price} onChange={(e) => set('price', e.target.value)} error={errors.price} required />
          <Input label="Old Price (৳)" type="number" value={form.old_price} onChange={(e) => set('old_price', e.target.value)} />
          <Input label="Cost Price (৳)" type="number" value={form.cost_price} onChange={(e) => set('cost_price', e.target.value)} />
          <Input label="Stock Quantity" type="number" value={form.stock_quantity} onChange={(e) => set('stock_quantity', e.target.value)} />
          <Input label="Low Stock Threshold" type="number" value={form.low_stock_threshold} onChange={(e) => set('low_stock_threshold', e.target.value)} />
          <Input label="Weight (grams)" type="number" value={form.weight_grams} onChange={(e) => set('weight_grams', e.target.value)} />
        </div>
        <Textarea label="Short Description" value={form.short_description} onChange={(e) => set('short_description', e.target.value)} rows={2} />
        <Textarea label="Full Description" value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} />
        <Textarea label="Features (one per line)" value={form.features} onChange={(e) => set('features', e.target.value)} rows={4} />
        <Textarea label="Specifications (JSON)" value={form.specifications} onChange={(e) => set('specifications', e.target.value)} rows={4} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Meta Title" value={form.meta_title} onChange={(e) => set('meta_title', e.target.value)} />
          <Input label="Meta Description" value={form.meta_description} onChange={(e) => set('meta_description', e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-4">
          {[
            { key: 'is_active', label: 'Active' },
            { key: 'is_featured', label: 'Featured' },
            { key: 'is_best_seller', label: 'Best Seller' },
            { key: 'is_new_arrival', label: 'New Arrival' },
            { key: 'is_trending', label: 'Trending' }
          ].map((flag) => (
            <label key={flag.key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form[flag.key]} onChange={(e) => set(flag.key, e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
              <span className="text-sm font-medium text-gray-700">{flag.label}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={loading}>{product ? 'Update Product' : 'Create Product'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const perPage = 15
  const { addToast } = useToast()

  const loadProducts = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('products').select('*, categories(name)', { count: 'exact' }).order('created_at', { ascending: false })
    if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
    if (categoryFilter) query = query.eq('category_id', categoryFilter)
    if (statusFilter === 'active') query = query.eq('is_active', true)
    if (statusFilter === 'inactive') query = query.eq('is_active', false)
    const { data, count } = await query.range((page - 1) * perPage, page * perPage - 1)
    setProducts(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [page, search, categoryFilter, statusFilter])

  useEffect(() => { loadProducts() }, [loadProducts])

  useEffect(() => {
    supabase.from('categories').select('id, name').eq('is_active', true).then(({ data }) => setCategories(data || []))
  }, [])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const { error } = await supabase.from('products').delete().eq('id', deleteConfirm.id)
    if (error) addToast('Failed to delete product', 'error')
    else { addToast('Product deleted'); loadProducts() }
    setDeleteConfirm(null)
  }

  const toggleFlag = async (product, flag) => {
    const { error } = await supabase.from('products').update({ [flag]: !product[flag] }).eq('id', product.id)
    if (error) {
      addToast('Failed to update', 'error')
    } else {
      addToast('Updated')
      loadProducts()
    }
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total products</p>
        </div>
        <div className="flex gap-3">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-56" />
          <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }} className="w-40">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="w-32">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Button onClick={() => { setSelectedProduct(null); setShowForm(true) }}><Plus className="w-4 h-4" /> Add Product</Button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : products.length === 0 ? (
          <EmptyState icon={Package} title="No products found" message="Try adjusting your filters or add a new product." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-navy-900 truncate">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.sku || '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{p.categories?.name || '—'}</TableCell>
                      <TableCell><span className="font-bold">{fmt(p.price)}</span>{p.old_price && <span className="text-xs text-gray-400 line-through ml-1">{fmt(p.old_price)}</span>}</TableCell>
                      <TableCell>
                        <Badge color={p.stock_quantity === 0 ? 'red' : p.stock_quantity <= p.low_stock_threshold ? 'amber' : 'green'}>
                          {p.stock_quantity === 0 ? 'Out' : p.stock_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button onClick={() => toggleFlag(p, 'is_active')} className="flex items-center gap-1">
                          {p.is_active ? <Badge color="green">Active</Badge> : <Badge color="gray">Inactive</Badge>}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {p.is_featured && <Badge color="purple">F</Badge>}
                          {p.is_best_seller && <Badge color="amber">B</Badge>}
                          {p.is_new_arrival && <Badge color="blue">N</Badge>}
                          {p.is_trending && <Badge color="navy">T</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setSelectedProduct(p); setShowForm(true) }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-500"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteConfirm(p)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={total} perPage={perPage} />}
          </>
        )}
      </Card>

      {showForm && <ProductForm product={selectedProduct} onClose={() => setShowForm(false)} onSave={loadProducts} />}

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        danger
      />
    </div>
  )
}
