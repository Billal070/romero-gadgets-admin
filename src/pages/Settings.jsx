import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, Button, Input, Textarea, EmptyState, Skeleton } from '../components/ui'
import { useToast } from '../hooks/useToast'
import { Settings as SettingsIcon, Save, Globe, Lock } from 'lucide-react'

function VisibilityToggle({ settingKey, isPublic, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(settingKey, !isPublic)}
      className={`mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border transition-colors ${
        isPublic
          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
      }`}
    >
      {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
      {isPublic ? 'Public' : 'Private'}
    </button>
  )
}

export default function Settings() {
  const [settings, setSettings] = useState({})
  const [publicFlags, setPublicFlags] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

  const loadSettings = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('settings').select('*')
    const map = {}
    const flags = {}
    data?.forEach((s) => { map[s.key] = s.value; flags[s.key] = s.is_public })
    setSettings(map)
    setPublicFlags(flags)
    setLoading(false)
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  const handleSave = async () => {
    setSaving(true)
    const entries = Object.entries(settings)
    const updates = entries.map(([key, value]) =>
      supabase.from('settings').upsert({
        key,
        value,
        is_public: publicFlags[key] ?? false,
        updated_at: new Date().toISOString()
      })
    )
    const results = await Promise.all(updates)
    const hasError = results.some((r) => r.error)
    setSaving(false)
    if (hasError) addToast('Failed to save some settings', 'error')
    else addToast('Settings saved successfully')
  }

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>

  const set = (key, value) => setSettings((s) => ({ ...s, [key]: value }))
  const setPublic = (key, value) => setPublicFlags((f) => ({ ...f, [key]: value }))

  const pub = (key) => publicFlags[key] ?? false

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Store Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your store configuration</p>
        </div>
        <Button onClick={handleSave} loading={saving}><Save className="w-4 h-4" /> Save All</Button>
      </div>

      <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
        <strong className="font-semibold text-blue-900">Public</strong> settings are readable by
        anonymous storefront visitors. Everything marked Private is admin-only.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="General" subtitle="Basic store information" />
          <div className="p-6 space-y-4">
            <div>
              <Input label="Store Name" value={settings.site_name || ''} onChange={(e) => set('site_name', e.target.value)} />
              <VisibilityToggle settingKey="site_name" isPublic={pub('site_name')} onToggle={setPublic} />
            </div>
            <div>
              <Input label="Contact Phone" value={settings.contact_phone || ''} onChange={(e) => set('contact_phone', e.target.value)} />
              <VisibilityToggle settingKey="contact_phone" isPublic={pub('contact_phone')} onToggle={setPublic} />
            </div>
            <div>
              <Input label="Contact Email" value={settings.contact_email || ''} onChange={(e) => set('contact_email', e.target.value)} />
              <VisibilityToggle settingKey="contact_email" isPublic={pub('contact_email')} onToggle={setPublic} />
            </div>
            <div>
              <Input label="Facebook URL" value={settings.facebook_url || ''} onChange={(e) => set('facebook_url', e.target.value)} />
              <VisibilityToggle settingKey="facebook_url" isPublic={pub('facebook_url')} onToggle={setPublic} />
            </div>
            <div>
              <Input label="Instagram URL" value={settings.instagram_url || ''} onChange={(e) => set('instagram_url', e.target.value)} />
              <VisibilityToggle settingKey="instagram_url" isPublic={pub('instagram_url')} onToggle={setPublic} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Payment & Delivery" subtitle="COD and delivery settings" />
          <div className="p-6 space-y-4">
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings.cod_enabled ?? true} onChange={(e) => set('cod_enabled', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-brand-500" />
                <div>
                  <p className="text-sm font-semibold text-navy-900">Cash on Delivery</p>
                  <p className="text-xs text-gray-400">Allow customers to pay on delivery</p>
                </div>
              </label>
              <VisibilityToggle settingKey="cod_enabled" isPublic={pub('cod_enabled')} onToggle={setPublic} />
            </div>
            <div>
              <Input label="Free Shipping Threshold (৳)" type="number" value={settings.free_shipping_threshold || 5000} onChange={(e) => set('free_shipping_threshold', Number(e.target.value))} />
              <VisibilityToggle settingKey="free_shipping_threshold" isPublic={pub('free_shipping_threshold')} onToggle={setPublic} />
            </div>
            <div>
              <Input label="Default Delivery Fee (৳)" type="number" value={settings.default_delivery_fee || 60} onChange={(e) => set('default_delivery_fee', Number(e.target.value))} />
              <VisibilityToggle settingKey="default_delivery_fee" isPublic={pub('default_delivery_fee')} onToggle={setPublic} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Store Policies" subtitle="Customer-facing policies" />
          <div className="p-6 space-y-4">
            <div>
              <Textarea label="Return Policy" value={settings.return_policy || ''} onChange={(e) => set('return_policy', e.target.value)} rows={3} />
              <VisibilityToggle settingKey="return_policy" isPublic={pub('return_policy')} onToggle={setPublic} />
            </div>
            <div>
              <Textarea label="Privacy Policy" value={settings.privacy_policy || ''} onChange={(e) => set('privacy_policy', e.target.value)} rows={3} />
              <VisibilityToggle settingKey="privacy_policy" isPublic={pub('privacy_policy')} onToggle={setPublic} />
            </div>
            <div>
              <Textarea label="Terms & Conditions" value={settings.terms || ''} onChange={(e) => set('terms', e.target.value)} rows={3} />
              <VisibilityToggle settingKey="terms" isPublic={pub('terms')} onToggle={setPublic} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Social Media" subtitle="Social links" />
          <div className="p-6 space-y-4">
            <div>
              <Input label="Facebook Page" value={settings.facebook_page || ''} onChange={(e) => set('facebook_page', e.target.value)} />
              <VisibilityToggle settingKey="facebook_page" isPublic={pub('facebook_page')} onToggle={setPublic} />
            </div>
            <div>
              <Input label="Instagram Page" value={settings.instagram_page || ''} onChange={(e) => set('instagram_page', e.target.value)} />
              <VisibilityToggle settingKey="instagram_page" isPublic={pub('instagram_page')} onToggle={setPublic} />
            </div>
            <div>
              <Input label="YouTube Channel" value={settings.youtube_url || ''} onChange={(e) => set('youtube_url', e.target.value)} />
              <VisibilityToggle settingKey="youtube_url" isPublic={pub('youtube_url')} onToggle={setPublic} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
