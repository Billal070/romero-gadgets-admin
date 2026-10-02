export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'amber' },
  { value: 'confirmed', label: 'Confirmed', color: 'blue' },
  { value: 'processing', label: 'Processing', color: 'indigo' },
  { value: 'shipped', label: 'Shipped', color: 'purple' },
  { value: 'delivered', label: 'Delivered', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
  { value: 'returned', label: 'Returned', color: 'orange' }
]

export const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'amber' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'refunded', label: 'Refunded', color: 'red' }
]

export const ROLES = [
  { value: 'super_admin', label: 'Super Admin', color: 'red' },
  { value: 'manager', label: 'Manager', color: 'blue' },
  { value: 'support', label: 'Support', color: 'green' },
  { value: 'editor', label: 'Editor', color: 'purple' }
]

export const PERMISSIONS = [
  'products.read', 'products.write',
  'orders.read', 'orders.write',
  'customers.read', 'customers.write',
  'reviews.read', 'reviews.write',
  'marketing.write',
  'settings.write',
  'admin.manage',
  'inventory.write'
]

export const DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' }
]

export const MARKETING_SOURCES = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'google', label: 'Google' },
  { value: 'direct', label: 'Direct' },
  { value: 'other', label: 'Other' }
]
