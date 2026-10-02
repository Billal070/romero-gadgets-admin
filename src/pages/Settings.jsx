import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, Button, Input, Textarea, EmptyState, Skeleton } from '../components/ui'
import { useToast } from '../hooks/useToast'
import { Settings as SettingsIcon, Save } from 'lucide-react'

export default function Settings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

  const loadSettings = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('settings').select('*')
    const map = {}
    data?.forEach((s) => { map[s.key] = s.value })
    setSettings(map)
    setLoading(false)
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  const handleSave = async () => {
    setSaving(true)
    const entries = Object.entries(settings)
    const updates = entries.map(([key, value]) =>
      supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() })
    )
    const results = await Promise.all(updates)
    const hasError = results.some((r) => r.error)
    setSaving(false)
    if (hasError) addToast('Failed to save some settings', 'error')
    else addToast('Settings saved successfully')
  }

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>

  const set = (key, value) => setSettings((s) => ({ ...s, [key]: value }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Store Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your store configuration</p>
        </div>
        <Button onClick={handleSave} loading={saving}><Save className="w-4 h-4" /> Save All</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="General" subtitle="Basic store information" />
          <div className="p-6 space-y-4">
            <Input label="Store Name" value={settings.site_name || ''} onChange={(e) => set('site_name', e.target.value)} />
            <Input label="Contact Phone" value={settings.contact_phone || ''} onChange={(e) => set('contact_phone', e.target.value)} />
            <Input label="Contact Email" value={settings.contact_email || ''} onChange={(e) => set('contact_email', e.target.value)} />
            <Input label="Facebook URL" value={settings.facebook_url || ''} onChange={(e) => set('facebook_url', e.target.value)} />
            <Input label="Instagram URL" value={settings.instagram_url || ''} onChange={(e) => set('instagram_url', e.target.value)} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Payment & Delivery" subtitle="COD and delivery settings" />
          <div className="p-6 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={settings.cod_enabled ?? true} onChange={(e) => set('cod_enabled', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-brand-500" />
              <div>
                <p className="text-sm font-semibold text-navy-900">Cash on Delivery</p>
                <p className="text-xs text-gray-400">Allow customers to pay on delivery</p>
              </div>
            </label>
            <Input label="Free Shipping Threshold (৳)" type="number" value={settings.free_shipping_threshold || 5000} onChange={(e) => set('free_shipping_threshold', Number(e.target.value))} />
            <Input label="Default Delivery Fee (৳)" type="number" value={settings.default_delivery_fee || 60} onChange={(e) => set('default_delivery_fee', Number(e.target.value))} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Store Policies" subtitle="Customer-facing policies" />
          <div className="p-6 space-y-4">
            <Textarea label="Return Policy" value={settings.return_policy || ''} onChange={(e) => set('return_policy', e.target.value)} rows={3} />
            <Textarea label="Privacy Policy" value={settings.privacy_policy || ''} onChange={(e) => set('privacy_policy', e.target.value)} rows={3} />
            <Textarea label="Terms & Conditions" value={settings.terms || ''} onChange={(e) => set('terms', e.target.value)} rows={3} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Social Media" subtitle="Social links" />
          <div className="p-6 space-y-4">
            <Input label="Facebook Page" value={settings.facebook_page || ''} onChange={(e) => set('facebook_page', e.target.value)} />
            <Input label="Instagram Page" value={settings.instagram_page || ''} onChange={(e) => set('instagram_page', e.target.value)} />
            <Input label="YouTube Channel" value={settings.youtube_url || ''} onChange={(e) => set('youtube_url', e.target.value)} />
          </div>
        </Card>
      </div>
    </div>
  )
}
