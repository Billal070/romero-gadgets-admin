import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Badge, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Modal, ConfirmDialog, Input, EmptyState, Skeleton } from '../components/ui'
import { useToast } from '../hooks/useToast'
import { Shield, Plus, Edit, Trash2 } from 'lucide-react'

function RoleForm({ role, onClose, onSave }) {
  const [form, setForm] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions || []
  })
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const allPerms = [
    'products.read', 'products.write',
    'orders.read', 'orders.write',
    'customers.read', 'customers.write',
    'reviews.read', 'reviews.write',
    'marketing.write',
    'settings.write',
    'admin.manage',
    'inventory.write'
  ]

  const togglePerm = (perm) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter((p) => p !== perm)
        : [...f.permissions, perm]
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { addToast('Name is required', 'error'); return }
    setLoading(true)
    const { error } = role
      ? await supabase.from('roles').update(form).eq('id', role.id)
      : await supabase.from('roles').insert(form)
    setLoading(false)
    if (error) addToast('Failed to save', 'error')
    else { addToast('Role saved'); onSave(); onClose() }
  }

  return (
    <Modal open onClose={onClose} title={role ? 'Edit Role' : 'Add Role'} size="md">
      <div className="space-y-4">
        <Input label="Role Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div>
          <p className="text-sm font-semibold text-navy-900 mb-2">Permissions</p>
          <div className="grid grid-cols-2 gap-2">
            {allPerms.map((perm) => (
              <label key={perm} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                <input type="checkbox" checked={form.permissions.includes(perm)} onChange={() => togglePerm(perm)} className="w-4 h-4 rounded border-gray-300 text-brand-500" />
                <span className="text-xs font-medium text-gray-700">{perm}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={loading}>Save</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function Roles() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const { addToast } = useToast()

  const loadRoles = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('roles').select('*').order('name')
    setRoles(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadRoles() }, [loadRoles])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const { error } = await supabase.from('roles').delete().eq('id', deleteConfirm.id)
    if (error) { addToast('Failed to delete', 'error') } else { addToast('Role deleted'); loadRoles() }
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Roles & Permissions</h1>
          <p className="text-sm text-gray-500 mt-0.5">{roles.length} roles</p>
        </div>
        <Button onClick={() => { setSelected(null); setShowForm(true) }}><Plus className="w-4 h-4" /> Add Role</Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : roles.length === 0 ? (
          <EmptyState icon={Shield} title="No roles" message="Create roles to control admin access." />
        ) : (
          <div className="divide-y divide-gray-50">
            {roles.map((r) => (
              <div key={r.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy-900 capitalize">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.description || 'No description'}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {r.permissions.map((p) => <Badge key={p} color="gray">{p}</Badge>)}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setSelected(r); setShowForm(true) }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-500"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteConfirm(r)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showForm && <RoleForm role={selected} onClose={() => setShowForm(false)} onSave={loadRoles} />}
      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Delete Role" message={`Delete role "${deleteConfirm?.name}"?`} confirmText="Delete" danger />
    </div>
  )
}
