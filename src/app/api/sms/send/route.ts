import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';
export const preferredRegion = 'sin1';

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { phone, message, apiKey, senderId } = await req.json();
  if (!phone || !message || !apiKey) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      type: 'text',
      number: phone,
      senderid: senderId || 'bulk',
      message,
    });
    const res = await fetch(`https://www.bulksmsbd.net/api/smsapi?${params}`, {
      method: 'GET',
    });
    const data = await res.json();
    return NextResponse.json({ result: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
