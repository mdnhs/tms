export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  photo?: string;
  createdAt: string;
}

export interface MeasurementField {
  id: string;
  name: string;
  nameBn: string;
}

export interface Product {
  id: string;
  name: string;
  nameBn: string;
  category: string;
  basePrice: number;
  image?: string;
  measurementFields: MeasurementField[];
}

export interface ShopSettings {
  shopName: string;
  shopNameBn: string;
  shopAddress: string;
  shopPhone: string;
  shopLogo?: string;
  currency: string;
  invoicePrefix: string;
  defaultAdvancePercent: number;
  enableSMS: boolean;
  enablePrintAutoOpen: boolean;
  smsApiKey: string;
  smsSenderId: string;
  smsBalanceThreshold: number;
  // Supabase cloud database
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
  supabaseProjectId?: string;
  useCloudDb?: boolean;
  // Appearance & language (synced across devices)
  theme?: 'light' | 'dark';
  colorTheme?: string;
  fontSize?: string;
  borderRadius?: string;
  density?: string;
  reduceMotion?: boolean;
  language?: 'bn' | 'en';
}

export type OrderStatus = 'pending' | 'in_production' | 'ready' | 'delivered' | 'cancelled';

export interface OrderMeasurement {
  fieldId: string;
  fieldName: string;
  fieldNameBn: string;
  value: string;
}

export interface OrderItem {
  productId: string;
  measurements: OrderMeasurement[];
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  totalPrice: number;
  advancePaid: number;
  dueAmount: number;
  deliveryDate: string;
  specialNotes?: string;
  status: OrderStatus;
  assignedTo?: string;
  createdAt: string;
}

export type OrderHistoryAction = 'created' | 'edited' | 'status_changed' | 'payment_collected' | 'deleted';

export interface OrderHistoryEntry {
  id: string;
  orderId: string;
  action: OrderHistoryAction;
  description: string;
  performedBy?: string;
  changes?: Record<string, { from: string; to: string }>;
  timestamp: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'পেন্ডিং',
  in_production: 'প্রোডাকশনে',
  ready: 'ডেলিভারি রেডি',
  delivered: 'ডেলিভারড',
  cancelled: 'ক্যানসেল',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-warning/15 text-warning border-warning/30',
  in_production: 'bg-primary/15 text-primary border-primary/30',
  ready: 'bg-success/15 text-success border-success/30',
  delivered: 'bg-muted text-muted-foreground border-border',
  cancelled: 'bg-destructive/15 text-destructive border-destructive/30',
};
