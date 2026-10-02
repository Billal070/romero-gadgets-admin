import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Badge, Input, Textarea, EmptyState, Skeleton } from '../components/ui'
import { useToast } from '../hooks/useToast'
import { Home, Edit, Check, X } from 'lucide-react'

export default function Sections() {
  const [sections, setSections] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const { addToast } = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    const [sectionsRes, productsRes] = await Promise.all([
      supabase.from('homepage_sections').select('*').order('sort_order'),
      supabase.from('products').select('id, name').eq('is_active', true).order('name')
    ])
    setSections(sectionsRes.data || [])
    setProducts(productsRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = async (section) => {
    const { error } = await supabase.from('homepage_sections').update({
      title: section.title,
      subtitle: section.subtitle,
      sort_order: section.sort_order,
      is_active: section.is_active,
      config: section.config
    }).eq('id', section.id)
    if (error) addToast('Failed to save', 'error')
    else { addToast('Section updated'); setEditing(null); loadData() }
  }

  const toggleActive = async (section) => {
    const { error } = await supabase.from('homepage_sections').update({ is_active: !section.is_active }).eq('id', section.id)
    if (error) {
      addToast('Failed', 'error')
    } else {
      loadData()
    }
  }

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-900">Homepage Sections</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage storefront content sections</p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge color="navy">{section.section_key}</Badge>
                  <Badge color={section.is_active ? 'green' : 'gray'}>{section.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
                {editing?.id === section.id ? (
                  <div className="space-y-3">
                    <Input label="Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                    <Textarea label="Subtitle" value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} rows={2} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSave(editing)}><Check className="w-3.5 h-3.5" /> Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(null)}><X className="w-3.5 h-3.5" /> Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-navy-900">{section.title}</h3>
                    <p className="text-sm text-gray-500">{section.subtitle}</p>
                  </>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => toggleActive(section)}>
                  {section.is_active ? 'Disable' : 'Enable'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(section)}>
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
