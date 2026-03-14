import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createSupabaseClient, SUPABASE_SETUP_SQL } from '@/lib/supabase';

export const runtime = 'nodejs';
export const preferredRegion = 'sin1';

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, anonKey, serviceRoleKey } = await req.json();
  if (!url || !anonKey) {
    return NextResponse.json({ error: 'URL and Anon Key are required' }, { status: 400 });
  }

  try {
    const supabase = createSupabaseClient(url, anonKey, serviceRoleKey);
    const tables = ['categories', 'customers', 'products', 'shop_roles', 'shop_staff', 'orders', 'order_history', 'shop_settings'];
    const missing: string[] = [];
    const existing: string[] = [];

    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error?.message?.includes('does not exist') || error?.message?.includes('schema cache')) {
        missing.push(table);
      } else {
        existing.push(table);
      }
    }

    if (missing.length === 0) {
      return NextResponse.json({ success: true, message: 'All tables already exist and are ready!' });
    }

    return NextResponse.json({
      success: false,
      message: `${missing.length} table(s) missing: ${missing.join(', ')}. Copy the SQL below and run it in your Supabase SQL Editor.`,
      missingTables: missing,
      existingTables: existing,
      sql: SUPABASE_SETUP_SQL,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: err.message || 'Check failed',
      sql: SUPABASE_SETUP_SQL,
    }, { status: 500 });
  }
}
