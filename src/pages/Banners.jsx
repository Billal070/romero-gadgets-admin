import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Badge, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Modal, ConfirmDialog, Input, Textarea, Select, EmptyState, Skeleton } from '../components/ui'
import { fmtDate } from '../lib/utils'
import { useToast } from '../hooks/useToast'
import { Image, Plus, Edit, Trash2 } from 'lucide-react'

function BannerForm({ banner, onClose, onSave }) {
  const [form, setForm] = useState({
    title: banner?.title || '',
    subtitle: banner?.subtitle || '',
    image_url: banner?.image_url || '',
    link_url: banner?.link_url || '',
    placement: banner?.placement || 'hero',
    sort_order: banner?.sort_order || 0,
    is_active: banner?.is_active ?? true,
    starts_at: banner?.starts_at?.slice(0, 10) || '',
    expires_at: banner?.expires_at?.slice(0, 10) || ''
  })
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const handleSave = async () => {
    if (!form.title.trim()) { addToast('Title is required', 'error'); return }
    setLoading(true)
    const { error } = banner
      ? await supabase.from('banners').update(form).eq('id', banner.id)
      : await supabase.from('banners').insert(form)
    setLoading(false)
    if (error) addToast('Failed to save', 'error')
    else { addToast('Banner saved'); onSave(); onClose() }
  }

  return (
    <Modal open onClose={onClose} title={banner ? 'Edit Banner' : 'Add Banner'} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Select label="Placement" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
            <option value="hero">Hero</option>
            <option value="promo">Promo</option>
            <option value="collection">Collection</option>
          </Select>
        </div>
        <Textarea label="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} rows={2} />
        <Input label="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
        <Input label="Link URL" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
        <div className="grid grid-cols-3 gap-4">
          <Input label="Sort Order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          <Input label="Start Date" type="date" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          <Input label="Expiry Date" type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
        </div>
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

export default function Banners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const { addToast } = useToast()

  const loadBanners = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('banners').select('*').order('sort_order')
    setBanners(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadBanners() }, [loadBanners])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const { error } = await supabase.from('banners').delete().eq('id', deleteConfirm.id)
    if (error) { addToast('Failed to delete', 'error') } else { addToast('Banner deleted'); loadBanners() }
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Banners</h1>
          <p className="text-sm text-gray-500 mt-0.5">{banners.length} banners</p>
        </div>
        <Button onClick={() => { setSelected(null); setShowForm(true) }}><Plus className="w-4 h-4" /> Add Banner</Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : banners.length === 0 ? (
          <EmptyState icon={Image} title="No banners" message="Create your first banner." />
        ) : (
          <div className="divide-y divide-gray-50">
            {banners.map((b) => (
              <div key={b.id} className="p-4 flex items-center gap-4">
                <div className="w-20 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {b.image_url ? <img src={b.image_url} alt="" className="w-full h-full object-cover" /> : <Image className="w-5 h-5 text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy-900">{b.title}</p>
                  <p className="text-xs text-gray-400">{b.placement} • {b.link_url || 'No link'}</p>
                </div>
                <Badge color={b.is_active ? 'green' : 'gray'}>{b.is_active ? 'Active' : 'Inactive'}</Badge>
                <div className="flex gap-1">
                  <button onClick={() => { setSelected(b); setShowForm(true) }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-500"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteConfirm(b)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showForm && <BannerForm banner={selected} onClose={() => setShowForm(false)} onSave={loadBanners} />}
      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Delete Banner" message={`Delete "${deleteConfirm?.title}"?`} confirmText="Delete" danger />
    </div>
  )
}
