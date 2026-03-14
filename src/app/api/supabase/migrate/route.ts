import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';
export const preferredRegion = 'sin1';

/**
 * Migration route is no longer needed since SQLite has been removed.
 * All data now lives in Supabase directly.
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({
    success: false,
    message: 'Migration is no longer needed. The application now uses Supabase exclusively.',
  });
}
