import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Search, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'

export function Button({ children, variant = 'primary', size = 'md', loading, disabled, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500 shadow-sm',
    secondary: 'bg-navy-900 text-white hover:bg-navy-800 focus:ring-navy-900',
    outline: 'border border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-300 bg-white',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  }
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
      {children}
    </button>
  )
}

export function Card({ children, className = '', ...props }) {
  return <div className={`bg-white rounded-xl border border-gray-100 shadow-card ${className}`} {...props}>{children}</div>
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 ${className}`}>
      <div>
        <h3 className="text-sm font-bold text-navy-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Badge({ children, color = 'gray', className = '' }) {
  const colors = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
    navy: 'bg-navy-100 text-navy-700'
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]} ${className}`}>{children}</span>
}

export function StatusBadge({ status, statuses }) {
  const s = statuses.find((x) => x.value === status)
  return <Badge color={s?.color || 'gray'}>{s?.label || status}</Badge>
}

export function Input({ label, error, required, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-semibold text-navy-900 mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <input className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-navy-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors ${error ? 'border-red-400' : 'border-gray-200'}`} {...props} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function Select({ label, error, required, children, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-semibold text-navy-900 mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <select className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-white ${error ? 'border-red-400' : 'border-gray-200'}`} {...props}>{children}</select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, required, className = '', rows = 3, ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-semibold text-navy-900 mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <textarea rows={rows} className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-navy-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors resize-none ${error ? 'border-red-400' : 'border-gray-200'}`} {...props} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-modal w-full ${sizes[size]} max-h-[90vh] flex flex-col animate-scale-in`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-navy-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = true, loading }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${danger ? 'bg-red-100' : 'bg-brand-100'}`}>
            <AlertTriangle className={`w-6 h-6 ${danger ? 'text-red-600' : 'text-brand-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-navy-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmText}</Button>
        </div>
      </div>
    </div>
  )
}

export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function TableHeader({ children }) {
  return <thead><tr className="border-b border-gray-100">{children}</tr></thead>
}

export function TableHead({ children, className = '' }) {
  return <th className={`px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider ${className}`}>{children}</th>
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-gray-50">{children}</tbody>
}

export function TableRow({ children, className = '', onClick }) {
  return <tr className={`hover:bg-gray-50/50 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`} onClick={onClick}>{children}</tr>
}

export function TableCell({ children, className = '' }) {
  return <td className={`px-4 py-3.5 text-gray-700 ${className}`}>{children}</td>
}

export function Pagination({ page, totalPages, onPageChange, totalItems, perPage }) {
  if (totalPages <= 1) return null
  const start = (page - 1) * perPage + 1
  const end = Math.min(page * perPage, totalItems)
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-sm text-gray-500">Showing {start}–{end} of {totalItems}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p
          if (totalPages <= 5) p = i + 1
          else if (page <= 3) p = i + 1
          else if (page >= totalPages - 2) p = totalPages - 4 + i
          else p = page - 2 + i
          return (
            <button key={p} onClick={() => onPageChange(p)} className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${p === page ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {p}
            </button>
          )
        })}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm text-navy-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
      />
    </div>
  )
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <div className="p-4 rounded-full bg-gray-100 mb-4"><Icon className="w-8 h-8 text-gray-400" /></div>}
      <h3 className="text-base font-bold text-navy-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 max-w-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
}

export function SkeletonCard() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </Card>
  )
}

export function StatCard({ icon: Icon, label, value, change, changeType, color = 'blue' }) {
  const colors = {
    blue: 'bg-brand-100 text-brand-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
    navy: 'bg-navy-100 text-navy-600'
  }
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-extrabold text-navy-900 mt-1">{value}</p>
          {change && (
            <p className={`text-xs font-semibold mt-1 ${changeType === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {changeType === 'up' ? '↑' : '↓'} {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  )
}

export function Dropdown({ trigger, children, align = 'right' }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute z-50 mt-2 bg-white rounded-xl border border-gray-100 shadow-card-hover min-w-[180px] py-1.5 animate-scale-in ${align === 'right' ? 'right-0' : 'left-0'}`}>
            {typeof children === 'function' ? children(() => setOpen(false)) : children}
          </div>
        </>
      )}
    </div>
  )
}

export function DropdownItem({ icon: Icon, children, onClick, danger, close }) {
  return (
    <button
      onClick={() => { onClick?.(); close?.() }}
      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${active === tab.value ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function ProgressBar({ value, max, color = 'blue', className = '' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const colors = { blue: 'bg-brand-500', green: 'bg-green-500', red: 'bg-red-500', amber: 'bg-amber-500' }
  return (
    <div className={`h-2 bg-gray-100 rounded-full overflow-hidden ${className}`}>
      <div className={`h-full rounded-full transition-all duration-500 ${colors[color]}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
