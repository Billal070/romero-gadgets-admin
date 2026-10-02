import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Badge, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Modal, ConfirmDialog, Input, Select, EmptyState, Skeleton } from '../components/ui'
import { fmt, fmtDate, toDhakaDateInput, dhakaDayStart, dhakaDayEnd } from '../lib/utils'
import { useToast } from '../hooks/useToast'
import { Tag, Plus, Edit, Trash2 } from 'lucide-react'

function CouponForm({ coupon, onClose, onSave }) {
  const [form, setForm] = useState({
    code: coupon?.code || '',
    description: coupon?.description || '',
    discount_type: coupon?.discount_type || 'percentage',
    discount_value: coupon?.discount_value ?? '',
    min_order_amount: coupon?.min_order_amount ?? 0,
    max_discount_amount: coupon?.max_discount_amount ?? '',
    usage_limit: coupon?.usage_limit ?? '',
    starts_at: toDhakaDateInput(coupon?.starts_at),
    expires_at: toDhakaDateInput(coupon?.expires_at),
    is_active: coupon?.is_active ?? true
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { addToast } = useToast()

  const isPercentage = form.discount_type === 'percentage'

  const previewText = () => {
    const v = Number(form.discount_value)
    if (!form.discount_value || !(v > 0)) return ''
    if (isPercentage) {
      if (v > 100) return ''
      return `${v}% OFF${form.max_discount_amount ? ` (capped at ৳${Number(form.max_discount_amount)})` : ''}${Number(form.min_order_amount) > 0 ? ` · min order ৳${Number(form.min_order_amount)}` : ''}`
    }
    return `৳${v} OFF${Number(form.min_order_amount) > 0 ? ` · min order ৳${Number(form.min_order_amount)}` : ''}`
  }

  const handleSave = async () => {
    const e = {}
    if (!form.code.trim()) e.code = 'Code is required'
    const toInt = (value, { min = 0, allowEmpty = true } = {}) => {
      if ((value === '' || value === null || value === undefined) && allowEmpty) return null
      const n = Number(value)
      if (!Number.isInteger(n) || n < min) return undefined
      return n
    }
    const discountValue = toInt(form.discount_value, { allowEmpty: false, min: 1 })
    if (discountValue === undefined) e.discount_value = isPercentage ? 'Whole number 1–100' : 'Whole BDT amount (min ৳1)'
    else if (isPercentage && discountValue > 100) e.discount_value = 'Percentage cannot exceed 100'
    const minOrder = toInt(form.min_order_amount, { allowEmpty: false, min: 0 })
    if (minOrder === undefined) e.min_order_amount = 'Whole BDT amount (min ৳0)'
    const maxDiscount = toInt(form.max_discount_amount, { allowEmpty: true, min: 1 })
    if (maxDiscount === undefined) e.max_discount_amount = 'Whole BDT amount or empty'
    const usageLimit = toInt(form.usage_limit, { allowEmpty: true, min: 1 })
    if (usageLimit === undefined) e.usage_limit = 'Whole number or empty'
    setErrors(e)
    if (Object.keys(e).length) return
    setLoading(true)
    const payload = {
      ...form,
      discount_value: discountValue,
      min_order_amount: minOrder ?? 0,
      max_discount_amount: isPercentage ? maxDiscount : null,
      usage_limit: usageLimit,
      // Date-only inputs are Bangladesh calendar days: start of day
      // for starts_at, end of day for expires_at (Asia/Dhaka).
      starts_at: dhakaDayStart(form.starts_at),
      expires_at: dhakaDayEnd(form.expires_at)
    }
    const { error } = coupon
      ? await supabase.from('coupons').update(payload).eq('id', coupon.id)
      : await supabase.from('coupons').insert(payload)
    setLoading(false)
    if (error) addToast('Failed to save', 'error')
    else { addToast('Coupon saved'); onSave(); onClose() }
  }

  return (
    <Modal open onClose={onClose} title={coupon ? 'Edit Coupon' : 'Add Coupon'} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} error={errors.code} required />
          <Select label="Discount Type" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (৳)</option>
          </Select>
          <Input label={isPercentage ? 'Discount Value (%)' : 'Discount Value (৳)'} type="number" min="1" max={isPercentage ? 100 : undefined} step="1" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} error={errors.discount_value} required />
          <Input label="Min Order Amount (৳)" type="number" min="0" step="1" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} error={errors.min_order_amount} />
          <Input label={isPercentage ? 'Max Discount (৳, optional cap)' : 'Max Discount (not used for fixed)'} type="number" min="1" step="1" value={form.max_discount_amount} onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })} error={errors.max_discount_amount} disabled={!isPercentage} />
          <Input label="Usage Limit (optional)" type="number" min="1" step="1" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} error={errors.usage_limit} />
          <Input label="Start Date" type="date" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          <Input label="Expiry Date" type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
        </div>
        <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        {previewText() && (
          <div className="rounded-lg bg-brand-100 text-navy-900 text-sm font-semibold px-4 py-2.5">
            Preview: {previewText()}
          </div>
        )}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-brand-500" />
          <span className="text-sm font-medium text-gray-700">Active</span>
        </label>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={loading}>Save</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function Coupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const { addToast } = useToast()

  const loadCoupons = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    setCoupons(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadCoupons() }, [loadCoupons])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const { error } = await supabase.from('coupons').delete().eq('id', deleteConfirm.id)
    if (error) { addToast('Failed to delete', 'error') } else { addToast('Coupon deleted'); loadCoupons() }
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Coupons</h1>
          <p className="text-sm text-gray-500 mt-0.5">{coupons.length} coupons</p>
        </div>
        <Button onClick={() => { setSelected(null); setShowForm(true) }}><Plus className="w-4 h-4" /> Add Coupon</Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : coupons.length === 0 ? (
          <EmptyState icon={Tag} title="No coupons" message="Create your first coupon." />
        ) : (
          <Table>
            <TableHeader><TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead>Value</TableHead><TableHead>Usage</TableHead><TableHead>Expires</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><span className="font-bold text-navy-900">{c.code}</span></TableCell>
                  <TableCell><Badge color="blue">{c.discount_type}</Badge></TableCell>
                  <TableCell><span className="font-bold">{c.discount_type === 'percentage' ? `${c.discount_value}%` : fmt(c.discount_value)}</span></TableCell>
                  <TableCell>{c.usage_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</TableCell>
                  <TableCell>{c.expires_at ? fmtDate(c.expires_at) : '—'}</TableCell>
                  <TableCell><Badge color={c.is_active ? 'green' : 'gray'}>{c.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setSelected(c); setShowForm(true) }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-500"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteConfirm(c)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {showForm && <CouponForm coupon={selected} onClose={() => setShowForm(false)} onSave={loadCoupons} />}
      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Delete Coupon" message={`Delete coupon "${deleteConfirm?.code}"?`} confirmText="Delete" danger />
    </div>
  )
}
