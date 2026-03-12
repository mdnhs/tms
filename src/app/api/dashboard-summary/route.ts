import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCloudDb } from '@/lib/cloud-db';
import { getShopId } from '@/lib/get-shop';
import { ORDER_STATUS_LABELS, OrderStatus } from '@/types';

interface OrderListRow {
  id: string;
  customer_id: string;
  total_price: number;
  advance_paid: number;
  due_amount: number;
  delivery_date: string | null;
  status: OrderStatus;
  created_at: string;
  items: Array<{ productId?: string }> | string | null;
}

interface CustomerRow {
  id: string;
  name: string;
}

interface ProductRow {
  id: string;
  name: string;
  name_bn: string;
}

function parseItems(items: OrderListRow['items']): Array<{ productId?: string }> {
  if (!items) return [];
  if (typeof items === 'string') {
    try {
      return JSON.parse(items) as Array<{ productId?: string }>;
    } catch {
      return [];
    }
  }
  return Array.isArray(items) ? items : [];
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const shopId = await getShopId(session.user.id);
  if (!shopId) {
    return NextResponse.json({
      summary: {
        totals: {
          todayOrders: 0,
          pendingOrders: 0,
          readyOrders: 0,
          deliveredOrders: 0,
          totalDue: 0,
          totalRevenue: 0,
          totalCollected: 0,
          totalOrders: 0,
        },
        monthlyData: [],
        statusData: [],
        topCustomers: [],
        urgentOrders: [],
        recentOrders: [],
      },
    });
  }

  const cloud = getCloudDb(shopId);
  const [ordersResult, customersResult, productsResult] = await Promise.all([
    cloud
      .from('orders')
      .select('id, customer_id, total_price, advance_paid, due_amount, delivery_date, status, created_at, items')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false }),
    cloud
      .from('customers')
      .select('id, name')
      .eq('shop_id', shopId),
    cloud
      .from('products')
      .select('id, name, name_bn')
      .eq('shop_id', shopId),
  ]);

  const firstError = ordersResult.error || customersResult.error || productsResult.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const orders = (ordersResult.data || []) as OrderListRow[];
  const customerMap = new Map(
    ((customersResult.data || []) as CustomerRow[]).map((row) => [row.id, row.name]),
  );
  const productMap = new Map(
    ((productsResult.data || []) as ProductRow[]).map((row) => [
      row.id,
      row.name_bn || row.name,
    ]),
  );

  const today = new Date().toDateString();
  const threeDays = Date.now() + 3 * 86400000;
  const monthlyMap: Record<string, { revenue: number; orders: number }> = {};
  const statusMap: Partial<Record<OrderStatus, number>> = {};
  const customerSpendMap = new Map<string, { name: string; total: number; count: number }>();

  let todayOrders = 0;
  let pendingOrders = 0;
  let readyOrders = 0;
  let deliveredOrders = 0;
  let totalDue = 0;
  let totalRevenue = 0;
  let totalCollected = 0;

  const urgentOrders = orders
    .filter((order) => {
      if (!order.delivery_date) return false;
      if (order.status === 'delivered' || order.status === 'cancelled') return false;
      return new Date(order.delivery_date).getTime() <= threeDays;
    })
    .slice(0, 5)
    .map((order) => {
      const daysLeft = Math.ceil((new Date(order.delivery_date || '').getTime() - Date.now()) / 86400000);
      return {
        id: order.id,
        customerName: customerMap.get(order.customer_id) || '-',
        deliveryDate: order.delivery_date || '',
        daysLeft,
      };
    });

  const recentOrders = orders.slice(0, 6).map((order) => {
    const items = parseItems(order.items);
    const productNames = items
      .map((item) => (item.productId ? productMap.get(item.productId) : null))
      .filter((name): name is string => Boolean(name));

    return {
      id: order.id,
      customerName: customerMap.get(order.customer_id) || '-',
      productNames,
      totalPrice: order.total_price || 0,
      dueAmount: order.due_amount || 0,
      status: order.status,
      deliveryDate: order.delivery_date || '',
      itemsCount: items.length,
    };
  });

  for (const order of orders) {
    if (new Date(order.created_at).toDateString() === today) todayOrders += 1;
    if (order.status === 'pending') pendingOrders += 1;
    if (order.status === 'ready') readyOrders += 1;
    if (order.status === 'delivered') deliveredOrders += 1;

    totalDue += order.due_amount || 0;
    totalRevenue += order.total_price || 0;
    totalCollected += (order.total_price || 0) - (order.due_amount || 0);

    const date = new Date(order.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { revenue: 0, orders: 0 };
    monthlyMap[monthKey].revenue += order.total_price || 0;
    monthlyMap[monthKey].orders += 1;

    statusMap[order.status] = (statusMap[order.status] || 0) + 1;

    const customerName = customerMap.get(order.customer_id);
    if (customerName) {
      const current = customerSpendMap.get(order.customer_id) || { name: customerName, total: 0, count: 0 };
      current.total += order.total_price || 0;
      current.count += 1;
      customerSpendMap.set(order.customer_id, current);
    }
  }

  const monthlyData = Object.entries(monthlyMap)
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-7)
    .map(([month, value]) => ({
      month: month.slice(5),
      revenue: value.revenue,
      orders: value.orders,
    }));

  const statusData = Object.entries(statusMap).map(([status, value]) => ({
    status,
    name: ORDER_STATUS_LABELS[status as OrderStatus] || status,
    value,
  }));

  const topCustomers = [...customerSpendMap.values()]
    .sort((left, right) => right.total - left.total)
    .slice(0, 5);

  return NextResponse.json({
    summary: {
      totals: {
        todayOrders,
        pendingOrders,
        readyOrders,
        deliveredOrders,
        totalDue,
        totalRevenue,
        totalCollected,
        totalOrders: orders.length,
      },
      monthlyData,
      statusData,
      topCustomers,
      urgentOrders,
      recentOrders,
    },
  });
}
