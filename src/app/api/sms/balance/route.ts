import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { apiKey } = await req.json();
  if (!apiKey) return NextResponse.json({ error: 'Missing apiKey' }, { status: 400 });

  try {
    const res = await fetch(`https://www.bulksmsbd.net/api/getBalanceApi?api_key=${apiKey}`, {
      method: 'GET',
    });
    const data = await res.json();
    return NextResponse.json({ result: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
