import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { genId } from '@/lib/get-shop';
import { getGlobalSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const preferredRegion = 'sin1';

interface ImportPayload {
  exportedAt?: string;
  data: {
    customers?:    any[];
    products?:     any[];
    categories?:   any[];
    orders?:       any[];
    orderHistory?: any[];
    staff?:        any[];
    roles?:        any[];
    settings?:     Record<string, any>;
  };
  options: {
    mergeMode: 'replace' | 'merge';
    includeCustomers:   boolean;
    includeProducts:    boolean;
    includeOrders:      boolean;
    includeStaff:       boolean;
    includeSettings:    boolean;
  };
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: ImportPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body?.data || typeof body.data !== 'object') {
    return NextResponse.json({ error: 'Missing data field' }, { status: 400 });
  }

  const supabase = getGlobalSupabase()!;
  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', session.user.id)
    .limit(1)
    .single();
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const shopId = shop.id;
  const { data, options } = body;
  const merge = options.mergeMode === 'merge';

  const summary: Record<string, number> = {};

  try {
    // ── Replace mode: wipe selected tables first ───────────────────
    if (!merge) {
      if (options.includeOrders) {
        await supabase.from('order_history').delete().eq('shop_id', shopId);
        await supabase.from('orders').delete().eq('shop_id', shopId);
      }
      if (options.includeCustomers) {
        await supabase.from('customers').delete().eq('shop_id', shopId);
      }
      if (options.includeProducts) {
        await supabase.from('products').delete().eq('shop_id', shopId);
        await supabase.from('categories').delete().eq('shop_id', shopId);
      }
      if (options.includeStaff) {
        await supabase.from('shop_staff').delete().eq('shop_id', shopId);
        await supabase.from('shop_roles').delete().eq('shop_id', shopId);
      }
    }

    // ── Categories ─────────────────────────────────────────────────
    if (options.includeProducts && Array.isArray(data.categories)) {
      const rows = data.categories.map(row => ({
        id: row.id ?? genId(), shop_id: shopId, name: row.name,
      }));
      if (rows.length > 0) {
        const { error } = await supabase.from('categories').upsert(rows, { onConflict: 'id' });
        if (error) throw new Error(`categories: ${error.message}`);
        summary.categories = rows.length;
      }
    }

    // ── Products ───────────────────────────────────────────────────
    if (options.includeProducts && Array.isArray(data.products)) {
      const rows = data.products.map(row => ({
        id: row.id ?? genId(), shop_id: shopId,
        name: row.name ?? '', name_bn: row.name_bn ?? '',
        category: row.category ?? '', base_price: row.base_price ?? 0,
        measurement_fields: typeof row.measurement_fields === 'string' ? JSON.parse(row.measurement_fields) : (row.measurement_fields ?? []),
        image: row.image ?? null,
        created_at: row.created_at ?? new Date().toISOString(),
      }));
      if (rows.length > 0) {
        const { error } = await supabase.from('products').upsert(rows, { onConflict: 'id' });
        if (error) throw new Error(`products: ${error.message}`);
        summary.products = rows.length;
      }
    }

    // ── Customers ──────────────────────────────────────────────────
    if (options.includeCustomers && Array.isArray(data.customers)) {
      const rows = data.customers.map(row => ({
        id: row.id ?? genId(), shop_id: shopId,
        name: row.name ?? '', phone: row.phone ?? '',
        address: row.address ?? '', notes: row.notes ?? null,
        photo: row.photo ?? null,
        created_at: row.created_at ?? new Date().toISOString(),
      }));
      if (rows.length > 0) {
        const { error } = await supabase.from('customers').upsert(rows, { onConflict: 'id' });
        if (error) throw new Error(`customers: ${error.message}`);
        summary.customers = rows.length;
      }
    }

    // ── Roles ──────────────────────────────────────────────────────
    if (options.includeStaff && Array.isArray(data.roles)) {
      const rows = data.roles.map(row => ({
        id: row.id ?? genId(), shop_id: shopId,
        name: row.name ?? '', name_bn: row.name_bn ?? '',
        permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : (row.permissions ?? {}),
        created_at: row.created_at ?? new Date().toISOString(),
        updated_at: row.updated_at ?? new Date().toISOString(),
      }));
      if (rows.length > 0) {
        const { error } = await supabase.from('shop_roles').upsert(rows, { onConflict: 'id' });
        if (error) throw new Error(`shop_roles: ${error.message}`);
        summary.roles = rows.length;
      }
    }

    // ── Staff ──────────────────────────────────────────────────────
    if (options.includeStaff && Array.isArray(data.staff)) {
      const rows = data.staff.map(row => ({
        id: row.id ?? genId(), shop_id: shopId,
        name: row.name ?? '', phone: row.phone ?? '',
        role: row.role ?? '', role_id: row.role_id ?? null,
        is_active: row.is_active ?? true, salary_amount: row.salary_amount ?? 0,
        created_at: row.created_at ?? new Date().toISOString(),
      }));
      if (rows.length > 0) {
        const { error } = await supabase.from('shop_staff').upsert(rows, { onConflict: 'id' });
        if (error) throw new Error(`shop_staff: ${error.message}`);
        summary.staff = rows.length;
      }
    }

    // ── Orders ─────────────────────────────────────────────────────
    if (options.includeOrders && Array.isArray(data.orders)) {
      const rows = data.orders.map(row => ({
        id: row.id ?? genId(), shop_id: shopId,
        customer_id: row.customer_id ?? '', product_id: row.product_id ?? '',
        measurements: typeof row.measurements === 'string' ? JSON.parse(row.measurements) : (row.measurements ?? []),
        quantity: row.quantity ?? 1, unit_price: row.unit_price ?? 0,
        total_price: row.total_price ?? 0, advance_paid: row.advance_paid ?? 0,
        due_amount: row.due_amount ?? 0, delivery_date: row.delivery_date ?? '',
        special_notes: row.special_notes ?? null, status: row.status ?? 'pending',
        assigned_to: row.assigned_to ?? null,
        created_at: row.created_at ?? new Date().toISOString(),
        items: row.items ? (typeof row.items === 'string' ? JSON.parse(row.items) : row.items) : null,
      }));
      // Batch in groups of 100
      for (let i = 0; i < rows.length; i += 100) {
        const batch = rows.slice(i, i + 100);
        const { error } = await supabase.from('orders').upsert(batch, { onConflict: 'id' });
        if (error) throw new Error(`orders: ${error.message}`);
      }
      summary.orders = rows.length;
    }

    // ── Order history ──────────────────────────────────────────────
    if (options.includeOrders && Array.isArray(data.orderHistory)) {
      const rows = data.orderHistory.map(row => ({
        id: row.id ?? genId(), order_id: row.order_id ?? '', shop_id: shopId,
        action: row.action ?? '', description: row.description ?? '',
        performed_by: row.performed_by ?? null,
        changes: row.changes ?? null,
        timestamp: row.timestamp ?? new Date().toISOString(),
      }));
      for (let i = 0; i < rows.length; i += 100) {
        const batch = rows.slice(i, i + 100);
        const { error } = await supabase.from('order_history').upsert(batch, { onConflict: 'id' });
        if (error) throw new Error(`order_history: ${error.message}`);
      }
    }

    // ── Settings ───────────────────────────────────────────────────
    if (options.includeSettings && data.settings && typeof data.settings === 'object') {
      const { data: existing } = await supabase
        .from('shop_settings')
        .select('id')
        .eq('shop_id', shopId)
        .single();
      if (existing) {
        await supabase
          .from('shop_settings')
          .update({ data: data.settings, updated_at: new Date().toISOString() })
          .eq('shop_id', shopId);
      } else {
        await supabase.from('shop_settings').insert({
          id: genId(), shop_id: shopId,
          data: data.settings, updated_at: new Date().toISOString(),
        });
      }
      summary.settings = 1;
    }

    return NextResponse.json({ success: true, summary });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, summary }, { status: 500 });
  }
}
