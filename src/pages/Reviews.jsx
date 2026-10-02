import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Badge, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Modal, ConfirmDialog, SearchInput, Select, EmptyState, Skeleton } from '../components/ui'
import { fmtDateTime } from '../lib/utils'
import { useToast } from '../hooks/useToast'
import { Star as StarIcon, Check, X, Trash2, Eye } from 'lucide-react'

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const { addToast } = useToast()

  const loadReviews = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('reviews').select('*, products(name), customers(full_name)').order('created_at', { ascending: false })
    if (statusFilter === 'pending') query = query.eq('is_approved', false)
    if (statusFilter === 'approved') query = query.eq('is_approved', true)
    if (search) query = query.or(`title.ilike.%${search}%,comment.ilike.%${search}%`)
    const { data } = await query.limit(100)
    setReviews(data || [])
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => { loadReviews() }, [loadReviews])

  const handleApprove = async (id) => {
    const { error } = await supabase.from('reviews').update({ is_approved: true }).eq('id', id)
    if (error) {
      addToast('Failed', 'error')
    } else {
      addToast('Review approved')
      loadReviews()
    }
  }

  const handleReject = async (id) => {
    const { error } = await supabase.from('reviews').update({ is_approved: false }).eq('id', id)
    if (error) {
      addToast('Failed', 'error')
    } else {
      addToast('Review rejected')
      loadReviews()
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const { error } = await supabase.from('reviews').delete().eq('id', deleteConfirm.id)
    if (error) { addToast('Failed to delete', 'error') } else { addToast('Review deleted'); loadReviews() }
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">Moderate customer reviews</p>
        </div>
        <div className="flex gap-3">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reviews..." className="w-56" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </Select>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : reviews.length === 0 ? (
          <EmptyState icon={StarIcon} title="No reviews" message="No reviews found." />
        ) : (
          <div className="divide-y divide-gray-50">
            {reviews.map((r) => (
              <div key={r.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                    <span className="text-brand-600 text-sm font-bold">{r.customers?.full_name?.[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy-900">{r.customers?.full_name}</span>
                      <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />)}</div>
                      {r.is_verified_purchase && <Badge color="blue">Verified</Badge>}
                      <Badge color={r.is_approved ? 'green' : 'amber'}>{r.is_approved ? 'Approved' : 'Pending'}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{r.products?.name}</p>
                    {r.title && <p className="text-sm font-semibold text-navy-900 mt-1">{r.title}</p>}
                    {r.comment && <p className="text-sm text-gray-500 mt-0.5">{r.comment}</p>}
                    <p className="text-xs text-gray-400 mt-1">{fmtDateTime(r.created_at)}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!r.is_approved && <Button size="sm" variant="success" onClick={() => handleApprove(r.id)}><Check className="w-3.5 h-3.5" /> Approve</Button>}
                    {r.is_approved && <Button size="sm" variant="outline" onClick={() => handleReject(r.id)}><X className="w-3.5 h-3.5" /> Reject</Button>}
                    <button onClick={() => setDeleteConfirm(r)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Delete Review" message="This action cannot be undone." confirmText="Delete" danger />
    </div>
  )
}
