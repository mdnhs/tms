import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCloudDb } from '@/lib/cloud-db';
import { getShopId } from '@/lib/get-shop';
export { runtime, preferredRegion } from '@/lib/vercel-runtime';

interface ProductRow {
  id: string;
  name: string;
  name_bn: string;
  category: string;
  base_price: number;
  image: string | null;
  measurement_fields: unknown[] | null;
}

interface CategoryRow {
  name: string;
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  if (!shopId) {
    return NextResponse.json({ products: [], categories: [] }, { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=20' } });
  }

  const cloud = getCloudDb(shopId);
  const [productsResult, categoriesResult] = await Promise.all([
    cloud.from('products').select('id, name, name_bn, category, base_price, image, measurement_fields').eq('shop_id', shopId).order('created_at', { ascending: true }),
    cloud.from('categories').select('name').eq('shop_id', shopId).order('name', { ascending: true }),
  ]);
  const firstError = productsResult.error || categoriesResult.error;
  if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

  const products = ((productsResult.data || []) as ProductRow[]).map(row => ({
    id: row.id,
    name: row.name,
    nameBn: row.name_bn,
    category: row.category,
    basePrice: row.base_price,
    image: row.image || undefined,
    measurementFields: row.measurement_fields || [],
  }));

  const categories = ((categoriesResult.data || []) as CategoryRow[]).map(row => row.name);
  return NextResponse.json({ products, categories }, { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=20' } });
}
