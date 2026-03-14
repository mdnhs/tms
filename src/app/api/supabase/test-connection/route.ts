import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createSupabaseClient } from '@/lib/supabase';

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

    // Try a simple query to check connectivity
    // Check if our tables exist by querying one
    const { data, error } = await supabase.from('customers').select('id').limit(1);

    const tablesExist = !error || !error.message.includes('does not exist');
    const connected = !error || tablesExist;

    if (error && !tablesExist) {
      return NextResponse.json({
        connected: true,
        tablesExist: false,
        message: 'Connected to Supabase but tables are not set up yet.',
      });
    }

    if (error && error.message.includes('Invalid API key')) {
      return NextResponse.json({
        connected: false,
        tablesExist: false,
        message: 'Invalid API key. Please check your credentials.',
      });
    }

    if (error && (error.message.includes('fetch') || error.message.includes('ENOTFOUND'))) {
      return NextResponse.json({
        connected: false,
        tablesExist: false,
        message: 'Cannot reach Supabase. Check your Project URL.',
      });
    }

    return NextResponse.json({
      connected: true,
      tablesExist: true,
      message: 'Successfully connected. Tables are ready.',
      rowCount: data?.length ?? 0,
    });
  } catch (err: any) {
    return NextResponse.json({
      connected: false,
      tablesExist: false,
      message: err.message || 'Connection failed',
    });
  }
}
