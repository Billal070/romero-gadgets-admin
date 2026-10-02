import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, Package, FolderTree, Users, Star,
  Tag, Image, BarChart3, Truck, Settings, Shield, ScrollText,
  Menu, X, LogOut, Bell, ChevronDown, UserCog, Home, AlertTriangle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabase'
import { Dropdown, DropdownItem, Badge } from './ui'

const sidebarGroups = [
  {
    label: 'Main',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' }
    ]
  },
  {
    label: 'Orders',
    items: [
      { to: '/orders', icon: ShoppingCart, label: 'All Orders' },
      { to: '/orders?status=pending', icon: ShoppingCart, label: 'Pending' },
      { to: '/orders?status=confirmed', icon: ShoppingCart, label: 'Confirmed' },
      { to: '/orders?status=processing', icon: ShoppingCart, label: 'Processing' },
      { to: '/orders?status=shipped', icon: ShoppingCart, label: 'Shipped' },
      { to: '/orders?status=delivered', icon: ShoppingCart, label: 'Delivered' },
      { to: '/orders?status=cancelled', icon: ShoppingCart, label: 'Cancelled' },
      { to: '/orders?status=returned', icon: ShoppingCart, label: 'Returned' }
    ]
  },
  {
    label: 'Products',
    items: [
      { to: '/products', icon: Package, label: 'All Products' },
      { to: '/products/new', icon: Package, label: 'Add Product' },
      { to: '/categories', icon: FolderTree, label: 'Categories' },
      { to: '/inventory', icon: Package, label: 'Inventory' },
      { to: '/reviews', icon: Star, label: 'Reviews' }
    ]
  },
  {
    label: 'Customers',
    items: [
      { to: '/customers', icon: Users, label: 'All Customers' },
      { to: '/customers?risk=high', icon: AlertTriangle, label: 'High Risk' },
      { to: '/customers?blocked=true', icon: Shield, label: 'Blocked' }
    ]
  },
  {
    label: 'Marketing',
    items: [
      { to: '/coupons', icon: Tag, label: 'Coupons' },
      { to: '/banners', icon: Image, label: 'Banners' },
      { to: '/sections', icon: Home, label: 'Homepage Sections' },
      { to: '/marketing', icon: BarChart3, label: 'Campaign Tracking' }
    ]
  },
  {
    label: 'Analytics',
    items: [
      { to: '/analytics/sales', icon: BarChart3, label: 'Sales' },
      { to: '/analytics/products', icon: Package, label: 'Products' },
      { to: '/analytics/customers', icon: Users, label: 'Customers' },
      { to: '/analytics/orders', icon: ShoppingCart, label: 'Orders' }
    ]
  },
  {
    label: 'Store',
    items: [
      { to: '/delivery', icon: Truck, label: 'Delivery' },
      { to: '/settings', icon: Settings, label: 'Settings' }
    ]
  },
  {
    label: 'Administration',
    items: [
      { to: '/team', icon: UserCog, label: 'Team' },
      { to: '/roles', icon: Shield, label: 'Roles' },
      { to: '/activity', icon: ScrollText, label: 'Activity Logs' }
    ]
  }
]

function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-navy-950/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-navy-900 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
          <img src="/logo.jpg" alt="ROMERO GADGETS" className="h-9 w-auto rounded-lg" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">ROMERO GADGETS</p>
            <p className="text-navy-300 text-xs">Admin Panel</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-navy-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
          {sidebarGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-navy-400">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-500 text-white'
                          : 'text-navy-200 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="w-4.5 h-4.5 shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}

function Header({ onMenuClick }) {
  const { adminUser, signOut } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('orders').select('id, order_number, customer_name, total_amount, created_at').eq('order_status', 'pending').order('created_at', { ascending: false }).limit(5),
      supabase.from('products').select('id, name, stock_quantity').lte('stock_quantity', 3).order('stock_quantity').limit(5),
      supabase.from('reviews').select('id, products(name), customers(full_name), rating, created_at').eq('is_approved', false).order('created_at', { ascending: false }).limit(5)
    ]).then(([orders, stock, reviews]) => {
      const items = []
      orders.data?.forEach((o) => items.push({ type: 'order', label: `New order ${o.order_number}`, sub: `${o.customer_name} — ৳${o.total_amount}`, to: '/orders', time: o.created_at }))
      stock.data?.forEach((p) => items.push({ type: 'stock', label: `Low stock: ${p.name}`, sub: `${p.stock_quantity} left`, to: '/inventory', time: new Date().toISOString() }))
      reviews.data?.forEach((r) => items.push({ type: 'review', label: `New review: ${r.products?.name}`, sub: `${r.customers?.full_name} — ${r.rating}★`, to: '/reviews', time: r.created_at }))
      setNotifs(items)
    })
  }, [])

  const handleSignOut = async () => {
    await signOut()
    addToast('Signed out successfully')
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-sm font-bold text-navy-900">Control Center</h1>
          <p className="text-xs text-gray-400">Where Everyday Meets Smart.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <Bell className="w-5 h-5" />
            {notifs.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-100 shadow-card-hover z-50 animate-scale-in">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-sm font-bold text-navy-900">Notifications</p>
                  <Badge color="red">{notifs.length} new</Badge>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifs.length === 0 && <p className="text-sm text-gray-400 text-center py-8">All caught up!</p>}
                  {notifs.map((n, i) => (
                    <button key={i} onClick={() => { navigate(n.to); setNotifOpen(false) }} className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 transition-colors">
                      <p className="text-sm font-semibold text-navy-900">{n.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <Dropdown
          align="right"
          trigger={
            <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                <span className="text-brand-600 text-sm font-bold">{adminUser?.full_name?.[0] || 'A'}</span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-navy-900">{adminUser?.full_name || 'Admin'}</p>
                <p className="text-xs text-gray-400 capitalize">{adminUser?.roles?.name || 'admin'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          }
        >
          {(close) => (
            <>
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-bold text-navy-900">{adminUser?.full_name}</p>
                <p className="text-xs text-gray-400">{adminUser?.email}</p>
              </div>
              <DropdownItem icon={Settings} onClick={() => navigate('/settings')} close={close}>Settings</DropdownItem>
              <DropdownItem icon={LogOut} onClick={handleSignOut} danger close={close}>Sign Out</DropdownItem>
            </>
          )}
        </Dropdown>
      </div>
    </header>
  )
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
