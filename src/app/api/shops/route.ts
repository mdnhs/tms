import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { genId } from '@/lib/get-shop';
import { getGlobalSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const preferredRegion = 'sin1';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getGlobalSupabase()!;
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_id', session.user.id)
    .limit(1)
    .single();
  return NextResponse.json({ shop: shop || null });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await req.json();
  const id = genId();

  const supabase = getGlobalSupabase()!;
  const { data: existing } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', session.user.id)
    .limit(1)
    .single();
  if (existing) return NextResponse.json({ shop: existing });

  await supabase.from('shops').insert({
    id,
    owner_id: session.user.id,
    name: name || 'My Shop',
    created_at: new Date().toISOString(),
  });
  const { data: shop } = await supabase.from('shops').select('*').eq('id', id).single();
  return NextResponse.json({ shop });
}
