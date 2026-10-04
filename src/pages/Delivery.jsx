import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Badge, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Modal, ConfirmDialog, Input, Select, EmptyState, Skeleton } from '../components/ui'
import { fmt } from '../lib/utils'
import { useToast } from '../hooks/useToast'
import { Truck, Plus, Edit, Trash2 } from 'lucide-react'

const BD_DISTRICTS = [
  'Dhaka', 'Chattogram', 'Khulna', 'Rajshahi', 'Sylhet', 'Barishal', 'Rangpur', 'Mymensingh',
  'Cumilla', 'Narayanganj', 'Gazipur', 'Bogura', 'Jashore', 'Dinajpur', 'Tangail', 'Jamalpur',
  'Pabna', 'Noakhali', 'Faridpur', 'Kushtia', 'Patuakhali', 'Cox’s Bazar', 'Narsingdi', 'Brahmanbaria',
];

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
        <Select label="Zone / District" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required>
          <option value="">Select district…</option>
          {BD_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          {form.name && !BD_DISTRICTS.includes(form.name) && (
            <option value={form.name}>{form.name} (custom)</option>
          )}
        </Select>
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
  const [cfgInit, setCfgInit] = useState(false)
  const [insideDistrict, setInsideDistrict] = useState('')
  const [insideFee, setInsideFee] = useState('')
  const [outsideDistrict, setOutsideDistrict] = useState('')
  const [outsideFee, setOutsideFee] = useState('')
  const [savingCfg, setSavingCfg] = useState(null)
  const { addToast } = useToast()

  const catchAllRow = (list) => list.find(z => /outside/i.test(z.name || ''));

  /* Seed the two-zone config from existing rows (read-only mapping). */
  useEffect(() => {
    if (cfgInit || !zones.length) return
    const home = zones.find(z => !/outside/i.test(z.name || '')) || zones[0]
    const away = catchAllRow(zones)
    const homeName = home?.name || 'Dhaka'
    setInsideDistrict(homeName)
    setInsideFee(home?.fee ?? '')
    const anchor = away?.name?.replace(/^outside\s+/i, '') || ''
    const firstOther = BD_DISTRICTS.find(d => d !== homeName) || ''
    setOutsideDistrict(BD_DISTRICTS.includes(anchor) && anchor !== homeName ? anchor : firstOther)
    setOutsideFee(away?.fee ?? '')
    setCfgInit(true)
  }, [zones, cfgInit])

  const loadZones = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('delivery_zones').select('*').order('created_at')
    setZones(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadZones() }, [loadZones])

  const handleInsideChange = (district) => {
    setInsideDistrict(district)
    if (district && district === outsideDistrict) {
      setOutsideDistrict(BD_DISTRICTS.find(d => d !== district) || '')
    }
  }

  const saveInside = async () => {
    const fee = Number(insideFee)
    if (!insideDistrict) { addToast('Select the inside district', 'error'); return }
    if (!Number.isFinite(fee) || fee < 0) { addToast('Enter a valid fee (0 or more)', 'error'); return }
    setSavingCfg('inside')
    const { data: existing } = await supabase
      .from('delivery_zones').select('id').ilike('name', insideDistrict).limit(1)
    let error
    if (existing?.length) {
      ({ error } = await supabase.from('delivery_zones').update({ fee }).eq('id', existing[0].id))
    } else {
      ({ error } = await supabase.from('delivery_zones').insert({ name: insideDistrict, fee }))
    }
    setSavingCfg(null)
    if (error) addToast('Failed to save inside zone', 'error')
    else { addToast(`Inside zone saved: ${insideDistrict} — ৳${fee}`); loadZones() }
  }

  const saveOutside = async () => {
    const fee = Number(outsideFee)
    if (!outsideDistrict || outsideDistrict === insideDistrict) { addToast('Select a different outside district', 'error'); return }
    if (!Number.isFinite(fee) || fee < 0) { addToast('Enter a valid fee (0 or more)', 'error'); return }
    setSavingCfg('outside')
    const { data: rows } = await supabase
      .from('delivery_zones').select('id').ilike('name', '%outside%').order('created_at').limit(1)
    let error
    if (rows?.length) {
      ({ error } = await supabase.from('delivery_zones')
        .update({ name: `Outside ${outsideDistrict}`, fee }).eq('id', rows[0].id))
    } else {
      ({ error } = await supabase.from('delivery_zones')
        .insert({ name: `Outside ${outsideDistrict}`, fee }))
    }
    setSavingCfg(null)
    if (error) addToast('Failed to save outside zone', 'error')
    else { addToast(`Outside zone saved: ${outsideDistrict} excluded — ৳${fee}`); loadZones() }
  }

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="p-5">
            <h3 className="text-sm font-bold text-navy-900">Inside Zone</h3>
            <p className="text-xs text-gray-500 mt-0.5 mb-4">Orders delivered inside this district pay this fee.</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <Select label="District" value={insideDistrict} onChange={(e) => handleInsideChange(e.target.value)} className="flex-1">
                <option value="">Select district…</option>
                {BD_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
              <Input label="Fee (৳)" type="number" min="0" value={insideFee} onChange={(e) => setInsideFee(e.target.value)} className="sm:w-32" />
              <Button onClick={saveInside} loading={savingCfg === 'inside'}>Save</Button>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <h3 className="text-sm font-bold text-navy-900">Outside Zone</h3>
            <p className="text-xs text-gray-500 mt-0.5 mb-4">All other districts pay this catch-all fee.</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <Select label="Outside district" value={outsideDistrict} onChange={(e) => setOutsideDistrict(e.target.value)} className="flex-1">
                <option value="">Select district…</option>
                {BD_DISTRICTS.filter((d) => d !== insideDistrict).map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
              <Input label="Fee (৳)" type="number" min="0" value={outsideFee} onChange={(e) => setOutsideFee(e.target.value)} className="sm:w-32" />
              <Button onClick={saveOutside} loading={savingCfg === 'outside'}>Save</Button>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="px-6 pt-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <Select
              label="Quick edit zone"
              value=""
              onChange={(e) => {
                const z = zones.find(x => x.id === e.target.value);
                if (z) { setSelected(z); setShowForm(true); }
                e.target.value = '';
              }}
              className="sm:w-72"
            >
              <option value="">Select a zone to edit its fee…</option>
              {zones.filter(z => z.is_active).map((z) => (
                <option key={z.id} value={z.id}>{z.name} — ৳{Number(z.fee)}</option>
              ))}
            </Select>
          </div>
        </div>
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
