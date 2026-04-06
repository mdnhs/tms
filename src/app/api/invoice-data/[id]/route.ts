import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCloudDb } from '@/lib/cloud-db';
import { getShopId } from '@/lib/get-shop';

export const runtime = 'nodejs';
export const preferredRegion = 'sin1';

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

interface StaffRow {
  id: string;
  name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
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

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  const { id } = await context.params;
  if (!shopId) return NextResponse.json({ error: 'No shop found' }, { status: 404 });

  const cloud = getCloudDb(shopId);
  const [orderResult, customersResult, productsResult, staffResult] = await Promise.all([
    cloud.from('orders').select('*').eq('shop_id', shopId).eq('id', id).single(),
    cloud.from('customers').select('id, name, phone, address').eq('shop_id', shopId),
    cloud.from('products').select('id, name, name_bn').eq('shop_id', shopId),
    cloud.from('shop_staff').select('id, name, phone, role, is_active').eq('shop_id', shopId),
  ]);
  const firstError = orderResult.error || customersResult.error || productsResult.error || staffResult.error;
  if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

  return NextResponse.json({
    order: parseOrder(orderResult.data as OrderRow),
    customers: customersResult.data || [],
    products: productsResult.data || [],
    staff: ((staffResult.data || []) as StaffRow[]).map((row) => ({ ...row, isActive: Boolean(row.is_active) })),
  }, { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=20' } });
}
