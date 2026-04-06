import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCloudDb } from '@/lib/cloud-db';
import { getShopId, genId, setShopIdCache } from '@/lib/get-shop';
import { getGlobalSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const preferredRegion = 'sin1';

function parseOrder(row: any) {
  const items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;

  if (items) {
    return {
      id: row.id,
      customerId: row.customer_id,
      items,
      totalPrice: row.total_price,
      advancePaid: row.advance_paid,
      dueAmount: row.due_amount,
      deliveryDate: row.delivery_date,
      specialNotes: row.special_notes,
      status: row.status,
      assignedTo: row.assigned_to,
      createdAt: row.created_at,
    };
  }
  const measurements = typeof row.measurements === 'string'
    ? JSON.parse(row.measurements || '[]')
    : (row.measurements || []);
  return {
    id: row.id,
    customerId: row.customer_id,
    items: [{
      productId: row.product_id || '',
      measurements,
      quantity: row.quantity || 1,
      unitPrice: row.unit_price || 0,
      totalPrice: row.total_price || 0,
    }],
    totalPrice: row.total_price,
    advancePaid: row.advance_paid,
    dueAmount: row.due_amount,
    deliveryDate: row.delivery_date,
    specialNotes: row.special_notes,
    status: row.status,
    assignedTo: row.assigned_to,
    createdAt: row.created_at,
  };
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ orders: [] });

  const cloud = getCloudDb(shopId);
  const { data, error } = await cloud
    .from('orders')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: (data || []).map(parseOrder) });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let shopId = await getShopId(session.user.id);
  if (!shopId) {
    const supabase = getGlobalSupabase()!;
    const id = genId();
    await supabase.from('shops').insert({ id, owner_id: session.user.id, name: 'My Shop', created_at: new Date().toISOString() });
    shopId = id;
    setShopIdCache(session.user.id, shopId);
  }
  const body = await req.json();
  const { id, customerId, items, totalPrice, advancePaid, dueAmount, deliveryDate, specialNotes, status, assignedTo, createdAt } = body;
  const orderId = id || genId();
  const firstItem = items?.[0] || {};

  const cloud = getCloudDb(shopId);
  const { data, error } = await cloud
    .from('orders')
    .insert({
      id: orderId,
      shop_id: shopId,
      customer_id: customerId,
      product_id: firstItem.productId || '',
      measurements: firstItem.measurements || [],
      quantity: firstItem.quantity || 1,
      unit_price: firstItem.unitPrice || 0,
      total_price: totalPrice || 0,
      advance_paid: advancePaid || 0,
      due_amount: dueAmount || 0,
      delivery_date: deliveryDate || '',
      special_notes: specialNotes || null,
      status: status || 'pending',
      assigned_to: assignedTo || null,
      created_at: createdAt || new Date().toISOString(),
      items: items || [],
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Save measurement history (fire-and-forget)
  void saveMeasurementHistory(cloud, shopId, items || []);

  return NextResponse.json({ order: parseOrder(data) });
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { id, customerId, items, totalPrice, advancePaid, dueAmount, deliveryDate, specialNotes, status, assignedTo } = body;
  const firstItem = items?.[0] || {};

  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: 'No shop found' }, { status: 400 });

  const cloud = getCloudDb(shopId);
  const { data, error } = await cloud
    .from('orders')
    .update({
      customer_id: customerId,
      product_id: firstItem.productId || '',
      measurements: firstItem.measurements || [],
      quantity: firstItem.quantity || 1,
      unit_price: firstItem.unitPrice || 0,
      total_price: totalPrice || 0,
      advance_paid: advancePaid || 0,
      due_amount: dueAmount || 0,
      delivery_date: deliveryDate || '',
      special_notes: specialNotes || null,
      status: status || 'pending',
      assigned_to: assignedTo || null,
      items: items || [],
    })
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Save measurement history (fire-and-forget)
  void saveMeasurementHistory(cloud, shopId, items || []);

  return NextResponse.json({ order: parseOrder(data) });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: 'No shop found' }, { status: 400 });

  const cloud = getCloudDb(shopId);
  const { error } = await cloud.from('orders').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

/** Upsert measurement values from order items into measurement_history (fire-and-forget) */
async function saveMeasurementHistory(
  cloud: ReturnType<typeof getCloudDb>,
  shopId: string,
  items: { measurements?: { fieldName: string; value: string }[] }[],
) {
  try {
    const unique = new Map<string, { fieldName: string; value: string }>();
    for (const item of items) {
      for (const m of item.measurements || []) {
        const v = m.value?.trim();
        if (v) unique.set(`${m.fieldName}::${v}`, { fieldName: m.fieldName, value: v });
      }
    }
    if (unique.size === 0) return;

    // Fetch existing rows in one query
    const fieldNames = [...new Set([...unique.values()].map((m) => m.fieldName))];
    const { data: existing } = await cloud
      .from('measurement_history')
      .select('id, field_name, value, use_count')
      .eq('shop_id', shopId)
      .in('field_name', fieldNames);

    const existingMap = new Map<string, { id: string; use_count: number }>();
    for (const row of existing || []) {
      existingMap.set(`${row.field_name}::${row.value}`, { id: row.id, use_count: row.use_count });
    }

    const toInsert: { id: string; shop_id: string; field_name: string; value: string; use_count: number; last_used_at: string }[] = [];
    const toUpdate: { id: string; use_count: number; last_used_at: string }[] = [];
    const now = new Date().toISOString();

    for (const [key, m] of unique) {
      const ex = existingMap.get(key);
      if (ex) {
        toUpdate.push({ id: ex.id, use_count: ex.use_count + 1, last_used_at: now });
      } else {
        toInsert.push({ id: genId(), shop_id: shopId, field_name: m.fieldName, value: m.value, use_count: 1, last_used_at: now });
      }
    }

    const ops: PromiseLike<unknown>[] = [];
    if (toInsert.length) ops.push(cloud.from('measurement_history').insert(toInsert));
    for (const u of toUpdate) ops.push(cloud.from('measurement_history').update({ use_count: u.use_count, last_used_at: u.last_used_at }).eq('id', u.id));
    await Promise.all(ops);
  } catch {
    // Non-critical — don't fail the order
  }
}
