import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCloudDb } from '@/lib/cloud-db';
import { getShopId, genId } from '@/lib/get-shop';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ staff: [] });

  const cloud = getCloudDb(shopId);
  const { data, error } = await cloud.from('shop_staff').select('*').eq('shop_id', shopId).order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ staff: data || [] });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: 'No shop found' }, { status: 400 });

  const { name, phone, role, role_id, is_active } = await req.json();
  const id = genId();

  const cloud = getCloudDb(shopId);
  const { data, error } = await cloud.from('shop_staff').insert({
    id,
    shop_id: shopId,
    name,
    phone: phone || '',
    role: role || '',
    role_id: role_id || null,
    is_active: is_active !== false,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data });
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, name, phone, role, role_id, is_active } = await req.json();

  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: 'No shop found' }, { status: 400 });

  const cloud = getCloudDb(shopId);
  const { data, error } = await cloud.from('shop_staff').update({
    name,
    phone: phone || '',
    role: role || '',
    role_id: role_id || null,
    is_active: is_active !== false,
  }).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data });
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
  const { error } = await cloud.from('shop_staff').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
