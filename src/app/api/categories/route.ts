import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCloudDb } from '@/lib/cloud-db';
import { getShopId, genId } from '@/lib/get-shop';
import { getGlobalSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const preferredRegion = 'sin1';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ categories: [] });
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ categories: [] });

  const cloud = getCloudDb(shopId);
  const { data, error } = await cloud.from('categories').select('name').eq('shop_id', shopId);
  if (error) return NextResponse.json({ categories: [] });
  return NextResponse.json({ categories: data.map(r => r.name) });
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
  }
  const { name } = await req.json();

  const cloud = getCloudDb(shopId);
  const id = genId();
  const { error } = await cloud.from('categories').upsert(
    { id, shop_id: shopId, name },
    { onConflict: 'shop_id,name' }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  const { oldName, newName } = await req.json();

  const cloud = getCloudDb(shopId);
  const { error } = await cloud.from('categories').update({ name: newName }).eq('shop_id', shopId).eq('name', oldName);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });

  const cloud = getCloudDb(shopId);
  const { error } = await cloud.from('categories').delete().eq('shop_id', shopId).eq('name', name);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
