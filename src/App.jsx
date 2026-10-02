import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Inventory from './pages/Inventory'
import Reviews from './pages/Reviews'
import Customers from './pages/Customers'
import Coupons from './pages/Coupons'
import Banners from './pages/Banners'
import Sections from './pages/Sections'
import Delivery from './pages/Delivery'
import Settings from './pages/Settings'
import Team from './pages/Team'
import Roles from './pages/Roles'
import ActivityLogs from './pages/ActivityLogs'
import Analytics from './pages/Analytics'
import Marketing from './pages/Marketing'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<Orders />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="customers" element={<Customers />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="banners" element={<Banners />} />
        <Route path="sections" element={<Sections />} />
        <Route path="delivery" element={<Delivery />} />
        <Route path="settings" element={<Settings />} />
        <Route path="team" element={<Team />} />
        <Route path="roles" element={<Roles />} />
        <Route path="activity" element={<ActivityLogs />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="marketing" element={<Marketing />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
