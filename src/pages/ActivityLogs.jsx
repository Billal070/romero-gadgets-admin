import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Badge, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, SearchInput, Select, EmptyState, Skeleton } from '../components/ui'
import { fmtDateTime } from '../lib/utils'
import { ScrollText, Download } from 'lucide-react'
import { downloadCSV } from '../lib/utils'

export default function ActivityLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')

  const loadLogs = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('admin_activity_logs').select('*, admin_users(full_name)').order('created_at', { ascending: false }).limit(200)
    if (actionFilter) query = query.eq('action', actionFilter)
    if (entityFilter) query = query.eq('entity_type', entityFilter)
    const { data } = await query
    setLogs(data || [])
    setLoading(false)
  }, [actionFilter, entityFilter])

  useEffect(() => { loadLogs() }, [loadLogs])

  const filtered = search
    ? logs.filter((l) => l.action?.toLowerCase().includes(search.toLowerCase()) || l.entity_type?.toLowerCase().includes(search.toLowerCase()))
    : logs

  const handleExport = () => {
    const data = filtered.map((l) => ({
      admin: l.admin_users?.full_name || 'System',
      action: l.action,
      entity: l.entity_type,
      entity_id: l.entity_id || '',
      date: l.created_at
    }))
    downloadCSV(data, 'activity_logs.csv')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Activity Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track all admin actions</p>
        </div>
        <div className="flex gap-3">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-48" />
          <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="w-32">
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
          </Select>
          <Select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="w-32">
            <option value="">All Entities</option>
            <option value="product">Product</option>
            <option value="order">Order</option>
            <option value="coupon">Coupon</option>
            <option value="customer">Customer</option>
          </Select>
          <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4" /> Export</Button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={ScrollText} title="No logs" message="No activity logs found." />
        ) : (
          <Table>
            <TableHeader><TableHead>Admin</TableHead><TableHead>Action</TableHead><TableHead>Entity</TableHead><TableHead>Entity ID</TableHead><TableHead>Date</TableHead></TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell><span className="font-semibold text-navy-900">{log.admin_users?.full_name || 'System'}</span></TableCell>
                  <TableCell><Badge color={log.action === 'delete' ? 'red' : log.action === 'create' ? 'green' : 'blue'}>{log.action}</Badge></TableCell>
                  <TableCell><Badge color="gray">{log.entity_type}</Badge></TableCell>
                  <TableCell><span className="text-xs text-gray-400 font-mono">{log.entity_id?.slice(0, 8) || '—'}</span></TableCell>
                  <TableCell><span className="text-xs text-gray-400">{fmtDateTime(log.created_at)}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
