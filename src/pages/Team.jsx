import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Badge, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Modal, ConfirmDialog, Input, Select, EmptyState, Skeleton } from '../components/ui'
import { fmtDateTime } from '../lib/utils'
import { useToast } from '../hooks/useToast'
import { UserCog, Plus, Edit, Trash2, Shield } from 'lucide-react'

function AdminForm({ admin, roles, onClose, onSave }) {
  const [form, setForm] = useState({
    email: admin?.email || '',
    full_name: admin?.full_name || '',
    role_id: admin?.role_id || '',
    is_active: admin?.is_active ?? true
  })
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const handleSave = async () => {
    if (!form.email.trim() || !form.full_name.trim() || !form.role_id) {
      addToast('All fields are required', 'error')
      return
    }
    setLoading(true)
    const { error } = admin
      ? await supabase.from('admin_users').update(form).eq('id', admin.id)
      : await supabase.from('admin_users').insert(form)
    setLoading(false)
    if (error) addToast('Failed to save', 'error')
    else { addToast('Admin saved'); onSave(); onClose() }
  }

  return (
    <Modal open onClose={onClose} title={admin ? 'Edit Admin' : 'Add Admin'} size="sm">
      <div className="space-y-4">
        <Input label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Select label="Role" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })} required>
          <option value="">Select role</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </Select>
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

export default function Team() {
  const [admins, setAdmins] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const { addToast } = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    const [adminsRes, rolesRes] = await Promise.all([
      supabase.from('admin_users').select('*, roles(name)').order('created_at', { ascending: false }),
      supabase.from('roles').select('*').order('name')
    ])
    setAdmins(adminsRes.data || [])
    setRoles(rolesRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const { error } = await supabase.from('admin_users').delete().eq('id', deleteConfirm.id)
    if (error) { addToast('Failed to delete', 'error') } else { addToast('Admin deleted'); loadData() }
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">{admins.length} team members</p>
        </div>
        <Button onClick={() => { setSelected(null); setShowForm(true) }}><Plus className="w-4 h-4" /> Add Admin</Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : admins.length === 0 ? (
          <EmptyState icon={UserCog} title="No admins" message="Add your first team member." />
        ) : (
          <Table>
            <TableHeader><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Last Login</TableHead><TableHead className="text-right">Actions</TableHead></TableHeader>
            <TableBody>
              {admins.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center"><span className="text-brand-600 text-xs font-bold">{a.full_name[0]}</span></div>
                      <span className="font-semibold text-navy-900">{a.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell><Badge color="blue">{a.roles?.name || '—'}</Badge></TableCell>
                  <TableCell><Badge color={a.is_active ? 'green' : 'gray'}>{a.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell><span className="text-xs text-gray-400">{a.last_login_at ? fmtDateTime(a.last_login_at) : 'Never'}</span></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setSelected(a); setShowForm(true) }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-500"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteConfirm(a)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {showForm && <AdminForm admin={selected} roles={roles} onClose={() => setShowForm(false)} onSave={loadData} />}
      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Delete Admin" message={`Remove ${deleteConfirm?.full_name} from the team?`} confirmText="Delete" danger />
    </div>
  )
}
