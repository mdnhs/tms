import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getShopId, genId } from '@/lib/get-shop';
import { getCloudDb } from '@/lib/cloud-db';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  const shopId = await getShopId(session.user.id);
  if (!shopId) {
    return NextResponse.json(
      { roles: [] },
      { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=20' } },
    );
  }

  const cloud = getCloudDb(shopId);
  let query = cloud.from('shop_roles').select('*').eq('shop_id', shopId).order('created_at', { ascending: true });
  if (id) {
    query = query.eq('id', id);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    { roles: data || [] },
    { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=20' } },
  );
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: 'No shop found' }, { status: 400 });

  const { name, name_bn, permissions } = await req.json();
  const id = genId();

  const cloud = getCloudDb(shopId);
  const { data, error } = await cloud.from('shop_roles').insert({
    id,
    shop_id: shopId,
    name,
    name_bn: name_bn || '',
    permissions: permissions || {},
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ role: data });
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, name, name_bn, permissions } = await req.json();

  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: 'No shop found' }, { status: 400 });

  const cloud = getCloudDb(shopId);
  const { data, error } = await cloud.from('shop_roles').update({
    name,
    name_bn: name_bn || '',
    permissions: permissions || {},
    updated_at: new Date().toISOString(),
  }).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ role: data });
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
  const { error } = await cloud.from('shop_roles').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
