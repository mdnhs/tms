import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCloudDb } from '@/lib/cloud-db';
import { getShopId, genId } from '@/lib/get-shop';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ history: [] });

  const cloud = getCloudDb(shopId);
  let query = cloud.from('order_history').select('*').eq('shop_id', shopId).order('timestamp', { ascending: false });
  if (orderId) {
    query = query.eq('order_id', orderId);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const history = (data || []).map((r: any) => ({
    id: r.id,
    orderId: r.order_id,
    action: r.action,
    description: r.description,
    performedBy: r.performed_by,
    timestamp: r.timestamp,
    changes: r.changes ?? undefined,
  }));
  return NextResponse.json({ history });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: 'No shop' }, { status: 400 });
  const { id, orderId, action, description, performedBy, changes, timestamp } = await req.json();
  const entryId = id || genId();

  const cloud = getCloudDb(shopId);
  const { data, error } = await cloud.from('order_history').insert({
    id: entryId,
    order_id: orderId,
    shop_id: shopId,
    action,
    description,
    performed_by: performedBy || null,
    changes: changes ?? null,
    timestamp: timestamp || new Date().toISOString(),
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    entry: {
      id: data.id,
      orderId: data.order_id,
      action: data.action,
      description: data.description,
      performedBy: data.performed_by,
      timestamp: data.timestamp,
      changes: data.changes ?? undefined,
    },
  });
}
