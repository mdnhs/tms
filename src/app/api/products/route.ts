import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCloudDb } from '@/lib/cloud-db';
import { getShopId, genId } from '@/lib/get-shop';
import { getGlobalSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const preferredRegion = 'sin1';

function mapProduct(r: any) {
  return {
    id: r.id,
    name: r.name,
    nameBn: r.name_bn,
    category: r.category,
    basePrice: r.base_price,
    image: r.image,
    measurementFields: r.measurement_fields || [],
  };
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ products: [] });

  const cloud = getCloudDb(shopId);
  const { data, error } = await cloud.from('products').select('*').eq('shop_id', shopId).order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: (data || []).map(mapProduct) });
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
  const { id, name, nameBn, category, basePrice, measurementFields, image } = await req.json();
  const productId = id || genId();

  const cloud = getCloudDb(shopId);
  const { data, error } = await cloud.from('products').insert({
    id: productId,
    shop_id: shopId,
    name,
    name_bn: nameBn || '',
    category: category || '',
    base_price: basePrice || 0,
    measurement_fields: measurementFields || [],
    image: image || null,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: mapProduct(data) });
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: 'No shop found' }, { status: 400 });
  const { id, name, nameBn, category, basePrice, measurementFields, image } = await req.json();

  const cloud = getCloudDb(shopId);
  const { data, error } = await cloud.from('products').update({
    name,
    name_bn: nameBn || '',
    category: category || '',
    base_price: basePrice || 0,
    measurement_fields: measurementFields || [],
    image: image || null,
  }).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: mapProduct(data) });
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
  const { error } = await cloud.from('products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
