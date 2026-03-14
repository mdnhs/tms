/**
 * Centralized React Query key registry.
 * Mutations invalidate only the keys they affect → stale data is refetched,
 * everything else stays cached.
 */
export const queryKeys = {
  appShell: ['app-shell-data'] as const,
  dashboard: ['dashboard-summary'] as const,
  orders: ['orders-list-data'] as const,
  customers: ['customers-page-data'] as const,
  products: ['products-page-data'] as const,
  createOrder: ['create-order-data'] as const,
  staffManagement: ['staff-management-data'] as const,
  shopRoles: ['shop-roles'] as const,
  invoiceData: (id: string) => ['invoice-data', id] as const,
  orderHistory: (orderId: string) => ['order-history', orderId] as const,
  roleDetail: (id: string) => ['shop-roles', id] as const,
} as const;

/**
 * Maps mutation types to the query keys they should invalidate.
 * After a mutation, call `invalidateQueries` for each key in the array.
 */
export const invalidationMap = {
  customer: [queryKeys.customers, queryKeys.createOrder, queryKeys.orders, queryKeys.dashboard],
  product: [queryKeys.products, queryKeys.createOrder],
  order: [queryKeys.orders, queryKeys.dashboard, queryKeys.createOrder],
  staff: [queryKeys.staffManagement, queryKeys.appShell],
  role: [queryKeys.shopRoles, queryKeys.staffManagement],
  category: [queryKeys.products],
  settings: [queryKeys.appShell],
} as const;
