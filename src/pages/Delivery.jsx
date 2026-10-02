import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Badge, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Modal, ConfirmDialog, Input, EmptyState, Skeleton } from '../components/ui'
import { fmt } from '../lib/utils'
import { useToast } from '../hooks/useToast'
import { Truck, Plus, Edit, Trash2 } from 'lucide-react'

function ZoneForm({ zone, onClose, onSave }) {
  const [form, setForm] = useState({
    name: zone?.name || '',
    fee: zone?.fee || 60,
    free_above: zone?.free_above || 5000,
    estimated_days: zone?.estimated_days || '',
    is_active: zone?.is_active ?? true
  })
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const handleSave = async () => {
    if (!form.name.trim()) { addToast('Name is required', 'error'); return }
    setLoading(true)
    const { error } = zone
      ? await supabase.from('delivery_zones').update(form).eq('id', zone.id)
      : await supabase.from('delivery_zones').insert(form)
    setLoading(false)
    if (error) addToast('Failed to save', 'error')
    else { addToast('Zone saved'); onSave(); onClose() }
  }

  return (
    <Modal open onClose={onClose} title={zone ? 'Edit Zone' : 'Add Zone'} size="sm">
      <div className="space-y-4">
        <Input label="Zone Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Delivery Fee (৳)" type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })} />
        <Input label="Free Shipping Above (৳)" type="number" value={form.free_above} onChange={(e) => setForm({ ...form, free_above: Number(e.target.value) })} />
        <Input label="Estimated Days" value={form.estimated_days} onChange={(e) => setForm({ ...form, estimated_days: e.target.value })} placeholder="e.g. 1-2 days" />
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

export default function Delivery() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const { addToast } = useToast()

  const loadZones = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('delivery_zones').select('*').order('created_at')
    setZones(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadZones() }, [loadZones])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const { error } = await supabase.from('delivery_zones').delete().eq('id', deleteConfirm.id)
    if (error) { addToast('Failed to delete', 'error') } else { addToast('Zone deleted'); loadZones() }
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Delivery Zones</h1>
          <p className="text-sm text-gray-500 mt-0.5">{zones.length} zones</p>
        </div>
        <Button onClick={() => { setSelected(null); setShowForm(true) }}><Plus className="w-4 h-4" /> Add Zone</Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : zones.length === 0 ? (
          <EmptyState icon={Truck} title="No zones" message="Add delivery zones." />
        ) : (
          <Table>
            <TableHeader><TableHead>Zone</TableHead><TableHead>Fee</TableHead><TableHead>Free Above</TableHead><TableHead>Est. Days</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableHeader>
            <TableBody>
              {zones.map((z) => (
                <TableRow key={z.id}>
                  <TableCell><span className="font-semibold text-navy-900">{z.name}</span></TableCell>
                  <TableCell><span className="font-bold">{fmt(z.fee)}</span></TableCell>
                  <TableCell>{fmt(z.free_above)}</TableCell>
                  <TableCell>{z.estimated_days || '—'}</TableCell>
                  <TableCell><Badge color={z.is_active ? 'green' : 'gray'}>{z.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setSelected(z); setShowForm(true) }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-500"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteConfirm(z)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {showForm && <ZoneForm zone={selected} onClose={() => setShowForm(false)} onSave={loadZones} />}
      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Delete Zone" message={`Delete "${deleteConfirm?.name}"?`} confirmText="Delete" danger />
    </div>
  )
}
