import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Badge, Modal, ConfirmDialog, Input, Textarea, Select, EmptyState, Skeleton } from '../components/ui'
import { useToast } from '../hooks/useToast'
import { FolderTree, Plus, Edit, Trash2, ChevronRight } from 'lucide-react'

function CategoryForm({ category, categories, onClose, onSave }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    parent_id: category?.parent_id || '',
    sort_order: category?.sort_order || 0,
    is_active: category?.is_active ?? true
  })
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const handleSave = async () => {
    if (!form.name.trim()) { addToast('Name is required', 'error'); return }
    setLoading(true)
    const { error } = category
      ? await supabase.from('categories').update(form).eq('id', category.id)
      : await supabase.from('categories').insert(form)
    setLoading(false)
    if (error) addToast('Failed to save', 'error')
    else { addToast('Category saved'); onSave(); onClose() }
  }

  return (
    <Modal open onClose={onClose} title={category ? 'Edit Category' : 'Add Category'}>
      <div className="space-y-4">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        <Select label="Parent Category" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
          <option value="">None (Top level)</option>
          {categories.filter((c) => c.id !== category?.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Input label="Sort Order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
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

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const { addToast } = useToast()

  const loadCategories = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadCategories() }, [loadCategories])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const { error } = await supabase.from('categories').delete().eq('id', deleteConfirm.id)
    if (error) addToast('Failed to delete', 'error')
    else { addToast('Category deleted'); loadCategories() }
    setDeleteConfirm(null)
  }

  const renderTree = (parentId = null, depth = 0) => {
    return categories
      .filter((c) => (c.parent_id || null) === parentId)
      .map((cat) => (
        <div key={cat.id}>
          <div className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${depth > 0 ? 'ml-6' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
              <FolderTree className="w-4 h-4 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy-900">{cat.name}</p>
              <p className="text-xs text-gray-400">/{cat.slug}</p>
            </div>
            <Badge color={cat.is_active ? 'green' : 'gray'}>{cat.is_active ? 'Active' : 'Inactive'}</Badge>
            <div className="flex gap-1">
              <button onClick={() => { setSelected(cat); setShowForm(true) }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-500"><Edit className="w-4 h-4" /></button>
              <button onClick={() => setDeleteConfirm(cat)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
          {renderTree(cat.id, depth + 1)}
        </div>
      ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">{categories.length} categories</p>
        </div>
        <Button onClick={() => { setSelected(null); setShowForm(true) }}><Plus className="w-4 h-4" /> Add Category</Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : categories.length === 0 ? (
          <EmptyState icon={FolderTree} title="No categories" message="Create your first category to organize products." />
        ) : (
          <div className="divide-y divide-gray-50">{renderTree()}</div>
        )}
      </Card>

      {showForm && <CategoryForm category={selected} categories={categories} onClose={() => setShowForm(false)} onSave={loadCategories} />}
      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Delete Category" message={`Delete "${deleteConfirm?.name}"? Products in this category will not be deleted.`} confirmText="Delete" danger />
    </div>
  )
}
