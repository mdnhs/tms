import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCloudDb } from '@/lib/cloud-db';
import { getShopId } from '@/lib/get-shop';

export const runtime = 'nodejs';
export const preferredRegion = 'sin1';

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string | null;
  photo: string | null;
  created_at: string;
}

interface ProductRow {
  id: string;
  name: string;
  name_bn: string;
  category: string;
  base_price: number;
  image: string | null;
  measurement_fields: unknown[] | null;
}

interface StaffRow {
  id: string;
  name: string;
  phone: string;
  role: string;
  is_active: boolean;
}

interface OrderRow {
  id: string;
  customer_id: string;
  items: unknown[] | string | null;
  measurements: unknown[] | string | null;
  product_id: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_price: number;
  advance_paid: number;
  due_amount: number;
  delivery_date: string;
  special_notes: string | null;
  status: string;
  assigned_to: string | null;
  created_at: string;
  ref_no: string | null;
  invoice_note: string | null;
  invoice_range: string | null;
}

function parseOrder(row: OrderRow) {
  const items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
  const shared = {
    id: row.id,
    customerId: row.customer_id,
    totalPrice: row.total_price,
    advancePaid: row.advance_paid,
    dueAmount: row.due_amount,
    deliveryDate: row.delivery_date,
    specialNotes: row.special_notes || undefined,
    status: row.status,
    assignedTo: row.assigned_to || undefined,
    createdAt: row.created_at,
    refNo: row.ref_no || '',
    invoiceNote: row.invoice_note || '',
    invoiceRange: row.invoice_range || '',
  };

  if (items) {
    return { ...shared, items };
  }

  const measurements = typeof row.measurements === 'string'
    ? JSON.parse(row.measurements || '[]')
    : (row.measurements || []);

  return {
    ...shared,
    items: [{
      productId: row.product_id || '',
      measurements,
      quantity: row.quantity || 1,
      unitPrice: row.unit_price || 0,
      totalPrice: row.total_price || 0,
    }],
  };
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const shopId = await getShopId(session.user.id);
  if (!shopId) {
    return NextResponse.json(
      { orders: [], customers: [], products: [], staff: [], userType: 'owner', staffId: null },
      { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=20' } },
    );
  }

  const cloud = getCloudDb(shopId);
  const [ordersResult, customersResult, productsResult, staffResult, currentStaffResult, measurementHistoryResult] = await Promise.all([
    cloud
      .from('orders')
      .select('id, customer_id, items, measurements, product_id, quantity, unit_price, total_price, advance_paid, due_amount, delivery_date, special_notes, status, assigned_to, created_at')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false }),
    cloud.from('customers').select('id, name, phone, address, notes, photo, created_at').eq('shop_id', shopId),
    cloud.from('products').select('id, name, name_bn, category, base_price, image, measurement_fields').eq('shop_id', shopId),
    cloud.from('shop_staff').select('id, name, phone, role, is_active').eq('shop_id', shopId).order('created_at', { ascending: true }),
    cloud.from('shop_staff').select('id').eq('user_id', session.user.id).eq('is_active', true).maybeSingle(),
    cloud.from('measurement_history').select('field_name, value, use_count').eq('shop_id', shopId).order('use_count', { ascending: false }).limit(500),
  ]);

  const firstError = ordersResult.error || customersResult.error || productsResult.error || staffResult.error || currentStaffResult.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const orders = ((ordersResult.data || []) as OrderRow[]).map(parseOrder);
  const customers = ((customersResult.data || []) as CustomerRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    address: row.address,
    notes: row.notes || undefined,
    photo: row.photo || undefined,
    createdAt: row.created_at,
  }));
  const products = ((productsResult.data || []) as ProductRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    nameBn: row.name_bn,
    category: row.category,
    basePrice: row.base_price,
    image: row.image || undefined,
    measurementFields: row.measurement_fields || [],
  }));
  const staff = ((staffResult.data || []) as StaffRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone || undefined,
    role: row.role,
    isActive: Boolean(row.is_active),
  }));

  const measurementHistory = (measurementHistoryResult.data || []).map((row: { field_name: string; value: string; use_count: number }) => ({
    fieldName: row.field_name,
    value: row.value,
    useCount: row.use_count,
  }));

  return NextResponse.json(
    {
      orders,
      customers,
      products,
      staff,
      measurementHistory,
      userType: currentStaffResult.data ? 'staff' : 'owner',
      staffId: currentStaffResult.data?.id || null,
    },
    { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=20' } },
  );
}
