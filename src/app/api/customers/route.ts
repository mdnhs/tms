import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCloudDb } from '@/lib/cloud-db';
import { getShopId, genId, setShopIdCache } from '@/lib/get-shop';
import { getGlobalSupabase } from '@/lib/supabase';
import { BANGLADESH_MOBILE_ERROR, normalizeBangladeshMobile } from '@/lib/bd-phone';

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

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ customers: [] });

  const cloud = getCloudDb(shopId);
  const { data, error } = await cloud
    .from('customers')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const customers = ((data || []) as CustomerRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    address: r.address,
    notes: r.notes,
    photo: r.photo,
    createdAt: r.created_at,
  }));
  return NextResponse.json({ customers });
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
  const { id, name, phone, address, notes, photo, createdAt } = await req.json();
  const normalizedPhone = normalizeBangladeshMobile(String(phone || ''));
  if (!normalizedPhone) {
    return NextResponse.json({ error: BANGLADESH_MOBILE_ERROR }, { status: 400 });
  }
  const customerId = id || genId();
  const created = createdAt || new Date().toISOString();

  const cloud = getCloudDb(shopId);

  // Check for duplicate phone
  const { data: existing } = await cloud.from('customers').select('id, name').eq('shop_id', shopId).eq('phone', normalizedPhone).limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: `Phone number already used by "${existing[0].name}"` }, { status: 409 });
  }

  const row = { id: customerId, shop_id: shopId, name, phone: normalizedPhone, address: address || '', notes: notes || null, photo: photo || null, created_at: created };
  const { data, error } = await cloud.from('customers').insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ customer: { id: data.id, name: data.name, phone: data.phone, address: data.address, notes: data.notes, photo: data.photo, createdAt: data.created_at } });
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: 'No shop found' }, { status: 400 });
  const { id, name, phone, address, notes, photo } = await req.json();
  const normalizedPhone = normalizeBangladeshMobile(String(phone || ''));
  if (!normalizedPhone) {
    return NextResponse.json({ error: BANGLADESH_MOBILE_ERROR }, { status: 400 });
  }

  const cloud = getCloudDb(shopId);

  // Check for duplicate phone (exclude current customer)
  const { data: existing } = await cloud.from('customers').select('id, name').eq('shop_id', shopId).eq('phone', normalizedPhone).neq('id', id).limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: `Phone number already used by "${existing[0].name}"` }, { status: 409 });
  }

  const { data, error } = await cloud.from('customers').update({ name, phone: normalizedPhone, address: address || '', notes: notes || null, photo: photo || null }).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ customer: { id: data.id, name: data.name, phone: data.phone, address: data.address, notes: data.notes, photo: data.photo, createdAt: data.created_at } });
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
  const { error } = await cloud.from('customers').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
