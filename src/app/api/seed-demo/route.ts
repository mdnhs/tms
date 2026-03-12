import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { genId, getShopId } from '@/lib/get-shop';
import { getGlobalSupabase } from '@/lib/supabase';

const now = () => new Date().toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000).toISOString().split('T')[0];

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getGlobalSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  // Reuse the owner's current shop when possible, even on older databases without a shops table.
  let shopId = await getShopId(session.user.id);
  if (!shopId) {
    shopId = genId();
  }

  // ── Wipe existing data for this shop ──────────────────────────────────────
  await supabase.from('order_history').delete().eq('shop_id', shopId);
  await supabase.from('orders').delete().eq('shop_id', shopId);
  await supabase.from('customers').delete().eq('shop_id', shopId);
  await supabase.from('products').delete().eq('shop_id', shopId);
  await supabase.from('categories').delete().eq('shop_id', shopId);
  await supabase.from('shop_staff').delete().eq('shop_id', shopId);
  await supabase.from('shop_roles').delete().eq('shop_id', shopId);
  await supabase.from('shop_settings').delete().eq('shop_id', shopId);

  // ── Categories ────────────────────────────────────────────────────────────
  const cats = ['Upper', 'Lower', 'Traditional', 'Formal', 'Casual', 'Wedding'];
  await supabase.from('categories').insert(cats.map(name => ({ id: genId(), shop_id: shopId, name })));

  // ── Products ──────────────────────────────────────────────────────────────
  const products = [
    {
      id: genId(), name: 'Shirt', nameBn: 'শার্ট', category: 'Upper', basePrice: 800,
      measurementFields: [
        { id: 'sf1', name: 'Collar', nameBn: 'কলার' }, { id: 'sf2', name: 'Chest', nameBn: 'বুক' },
        { id: 'sf3', name: 'Waist', nameBn: 'কোমর' }, { id: 'sf4', name: 'Shoulder', nameBn: 'কাঁধ' },
        { id: 'sf5', name: 'Sleeve', nameBn: 'হাতা' }, { id: 'sf6', name: 'Length', nameBn: 'লম্বা' },
      ],
    },
    {
      id: genId(), name: 'Pant', nameBn: 'প্যান্ট', category: 'Lower', basePrice: 700,
      measurementFields: [
        { id: 'pf1', name: 'Waist', nameBn: 'কোমর' }, { id: 'pf2', name: 'Hip', nameBn: 'হিপ' },
        { id: 'pf3', name: 'Thigh', nameBn: 'উরু' }, { id: 'pf4', name: 'Knee', nameBn: 'হাঁটু' },
        { id: 'pf5', name: 'Bottom', nameBn: 'মোহরা' }, { id: 'pf6', name: 'Length', nameBn: 'লম্বা' },
      ],
    },
    {
      id: genId(), name: 'Panjabi', nameBn: 'পাঞ্জাবি', category: 'Traditional', basePrice: 1200,
      measurementFields: [
        { id: 'pjf1', name: 'Chest', nameBn: 'বুক' }, { id: 'pjf2', name: 'Waist', nameBn: 'কোমর' },
        { id: 'pjf3', name: 'Shoulder', nameBn: 'কাঁধ' }, { id: 'pjf4', name: 'Sleeve', nameBn: 'হাতা' },
        { id: 'pjf5', name: 'Length', nameBn: 'লম্বা' },
      ],
    },
    {
      id: genId(), name: 'Blazer', nameBn: 'ব্লেজার', category: 'Formal', basePrice: 3500,
      measurementFields: [
        { id: 'bf1', name: 'Chest', nameBn: 'বুক' }, { id: 'bf2', name: 'Waist', nameBn: 'কোমর' },
        { id: 'bf3', name: 'Shoulder', nameBn: 'কাঁধ' }, { id: 'bf4', name: 'Sleeve', nameBn: 'হাতা' },
        { id: 'bf5', name: 'Length', nameBn: 'লম্বা' }, { id: 'bf6', name: 'Back Width', nameBn: 'পিঠের প্রস্থ' },
      ],
    },
    {
      id: genId(), name: 'Kurta', nameBn: 'কুর্তা', category: 'Casual', basePrice: 600,
      measurementFields: [
        { id: 'kf1', name: 'Chest', nameBn: 'বুক' }, { id: 'kf2', name: 'Waist', nameBn: 'কোমর' },
        { id: 'kf3', name: 'Shoulder', nameBn: 'কাঁধ' }, { id: 'kf4', name: 'Length', nameBn: 'লম্বা' },
      ],
    },
    {
      id: genId(), name: 'Sherwani', nameBn: 'শেরওয়ানি', category: 'Wedding', basePrice: 8000,
      measurementFields: [
        { id: 'swf1', name: 'Chest', nameBn: 'বুক' }, { id: 'swf2', name: 'Waist', nameBn: 'কোমর' },
        { id: 'swf3', name: 'Shoulder', nameBn: 'কাঁধ' }, { id: 'swf4', name: 'Sleeve', nameBn: 'হাতা' },
        { id: 'swf5', name: 'Length', nameBn: 'লম্বা' }, { id: 'swf6', name: 'Hip', nameBn: 'হিপ' },
      ],
    },
    {
      id: genId(), name: 'Salwar Kameez', nameBn: 'সালোয়ার কামিজ', category: 'Traditional', basePrice: 1500,
      measurementFields: [
        { id: 'skf1', name: 'Chest', nameBn: 'বুক' }, { id: 'skf2', name: 'Waist', nameBn: 'কোমর' },
        { id: 'skf3', name: 'Hip', nameBn: 'হিপ' }, { id: 'skf4', name: 'Kameez Length', nameBn: 'কামিজ লম্বা' },
        { id: 'skf5', name: 'Sleeve', nameBn: 'হাতা' }, { id: 'skf6', name: 'Salwar Length', nameBn: 'সালোয়ার লম্বা' },
      ],
    },
  ];

  await supabase.from('products').insert(products.map(p => ({
    id: p.id, shop_id: shopId, name: p.name, name_bn: p.nameBn,
    category: p.category, base_price: p.basePrice, measurement_fields: p.measurementFields,
  })));

  // ── Roles ─────────────────────────────────────────────────────────────────
  const managerRoleId = genId();
  const tailorRoleId = genId();
  const receptionistRoleId = genId();

  const roles = [
    {
      id: managerRoleId, name: 'Manager', nameBn: 'ম্যানেজার',
      permissions: {
        dashboard: ['view'], customers: ['view', 'edit', 'delete'], products: ['view', 'edit', 'delete'],
        categories: ['view', 'edit', 'delete'], create_order: ['view', 'edit'], orders: ['view', 'edit', 'delete'],
        reports: ['view'], settings: ['view', 'edit'],
      },
    },
    {
      id: tailorRoleId, name: 'Tailor', nameBn: 'দর্জি',
      permissions: { dashboard: ['view'], create_order: ['view', 'edit'], orders: ['view', 'edit'], craftsman_view: ['view'] },
    },
    {
      id: receptionistRoleId, name: 'Receptionist', nameBn: 'রিসেপশনিস্ট',
      permissions: { dashboard: ['view'], customers: ['view', 'edit'], create_order: ['view', 'edit'], orders: ['view'] },
    },
  ];

  await supabase.from('shop_roles').insert(roles.map(r => ({
    id: r.id, shop_id: shopId, name: r.name, name_bn: r.nameBn, permissions: r.permissions,
  })));

  // ── Staff ─────────────────────────────────────────────────────────────────
  const staff = [
    { id: genId(), name: 'রহিম উদ্দিন', phone: '01711-223344', role: 'Manager', roleId: managerRoleId },
    { id: genId(), name: 'করিম মিয়া', phone: '01812-334455', role: 'Tailor', roleId: tailorRoleId },
    { id: genId(), name: 'সালমা বেগম', phone: '01913-445566', role: 'Tailor', roleId: tailorRoleId },
    { id: genId(), name: 'নাসিমা খানম', phone: '01614-556677', role: 'Receptionist', roleId: receptionistRoleId },
  ];

  await supabase.from('shop_staff').insert(staff.map(s => ({
    id: s.id, shop_id: shopId, name: s.name, phone: s.phone, role: s.role, role_id: s.roleId, is_active: true,
  })));

  const [tailor1, tailor2] = [staff[1], staff[2]];

  // ── Customers ─────────────────────────────────────────────────────────────
  const customers = [
    { id: genId(), name: 'আব্দুল্লাহ আল মামুন', phone: '01711-001122', address: 'ঢাকা, মিরপুর-১০' },
    { id: genId(), name: 'মোহাম্মদ আরিফ হোসেন', phone: '01812-003344', address: 'ঢাকা, গুলশান-২' },
    { id: genId(), name: 'তানভীর আহমেদ', phone: '01913-005566', address: 'চট্টগ্রাম, আগ্রাবাদ' },
    { id: genId(), name: 'শফিকুল ইসলাম', phone: '01614-007788', address: 'সিলেট, জিন্দাবাজার' },
    { id: genId(), name: 'রুবেল হোসেন', phone: '01515-009900', address: 'রাজশাহী, উপশহর' },
    { id: genId(), name: 'ফারুক আহমেদ', phone: '01711-110011', address: 'ঢাকা, ধানমন্ডি' },
    { id: genId(), name: 'মাহমুদ হাসান', phone: '01812-220022', address: 'ঢাকা, বনানী' },
    { id: genId(), name: 'জাহিদ হাসান', phone: '01913-330033', address: 'খুলনা, সোনাডাঙা' },
  ];

  await supabase.from('customers').insert(customers.map(c => ({
    id: c.id, shop_id: shopId, name: c.name, phone: c.phone, address: c.address,
    created_at: daysAgo(Math.floor(Math.random() * 60)),
  })));

  const [shirt, pant, panjabi, blazer, kurta, sherwani, salwar] = products;

  // ── Orders ────────────────────────────────────────────────────────────────
  const mkItem = (productId: string, measurements: any[], quantity: number, unitPrice: number) => ({
    productId, measurements, quantity, unitPrice, totalPrice: quantity * unitPrice,
  });

  const orders = [
    {
      id: genId(), customerId: customers[0].id,
      items: [mkItem(shirt.id, [
        { fieldId: 'sf1', fieldName: 'Collar', fieldNameBn: 'কলার', value: '15' },
        { fieldId: 'sf2', fieldName: 'Chest', fieldNameBn: 'বুক', value: '40' },
        { fieldId: 'sf4', fieldName: 'Shoulder', fieldNameBn: 'কাঁধ', value: '17' },
        { fieldId: 'sf5', fieldName: 'Sleeve', fieldNameBn: 'হাতা', value: '25' },
        { fieldId: 'sf6', fieldName: 'Length', fieldNameBn: 'লম্বা', value: '30' },
      ], 2, 800)],
      totalPrice: 1600, advancePaid: 800, dueAmount: 800,
      deliveryDate: daysFromNow(5), status: 'in_production', assignedTo: tailor1.id, createdAt: daysAgo(7),
    },
    {
      id: genId(), customerId: customers[2].id,
      items: [mkItem(panjabi.id, [
        { fieldId: 'pjf1', fieldName: 'Chest', fieldNameBn: 'বুক', value: '39' },
        { fieldId: 'pjf2', fieldName: 'Waist', fieldNameBn: 'কোমর', value: '36' },
        { fieldId: 'pjf3', fieldName: 'Shoulder', fieldNameBn: 'কাঁধ', value: '17' },
        { fieldId: 'pjf4', fieldName: 'Sleeve', fieldNameBn: 'হাতা', value: '23' },
        { fieldId: 'pjf5', fieldName: 'Length', fieldNameBn: 'লম্বা', value: '44' },
      ], 3, 1200)],
      totalPrice: 3600, advancePaid: 1800, dueAmount: 1800,
      deliveryDate: daysFromNow(3), status: 'ready', assignedTo: tailor1.id, createdAt: daysAgo(14),
    },
    {
      id: genId(), customerId: customers[5].id,
      items: [mkItem(kurta.id, [
        { fieldId: 'kf1', fieldName: 'Chest', fieldNameBn: 'বুক', value: '38' },
        { fieldId: 'kf2', fieldName: 'Waist', fieldNameBn: 'কোমর', value: '35' },
        { fieldId: 'kf3', fieldName: 'Shoulder', fieldNameBn: 'কাঁধ', value: '16.5' },
        { fieldId: 'kf4', fieldName: 'Length', fieldNameBn: 'লম্বা', value: '36' },
      ], 4, 600)],
      totalPrice: 2400, advancePaid: 1200, dueAmount: 1200,
      deliveryDate: daysFromNow(7), status: 'in_production', assignedTo: tailor1.id, createdAt: daysAgo(5),
    },
    {
      id: genId(), customerId: customers[7].id,
      items: [mkItem(shirt.id, [
        { fieldId: 'sf1', fieldName: 'Collar', fieldNameBn: 'কলার', value: '16' },
        { fieldId: 'sf2', fieldName: 'Chest', fieldNameBn: 'বুক', value: '44' },
        { fieldId: 'sf5', fieldName: 'Sleeve', fieldNameBn: 'হাতা', value: '26' },
        { fieldId: 'sf6', fieldName: 'Length', fieldNameBn: 'লম্বা', value: '32' },
      ], 3, 800)],
      totalPrice: 2400, advancePaid: 2400, dueAmount: 0,
      deliveryDate: daysFromNow(-5), status: 'delivered', assignedTo: tailor1.id, createdAt: daysAgo(30),
    },
    {
      id: genId(), customerId: customers[3].id,
      items: [mkItem(pant.id, [
        { fieldId: 'pf1', fieldName: 'Waist', fieldNameBn: 'কোমর', value: '34' },
        { fieldId: 'pf2', fieldName: 'Hip', fieldNameBn: 'হিপ', value: '40' },
        { fieldId: 'pf5', fieldName: 'Bottom', fieldNameBn: 'মোহরা', value: '16' },
        { fieldId: 'pf6', fieldName: 'Length', fieldNameBn: 'লম্বা', value: '40' },
      ], 2, 700)],
      totalPrice: 1400, advancePaid: 700, dueAmount: 700,
      deliveryDate: daysFromNow(-2), status: 'delivered', assignedTo: tailor2.id, createdAt: daysAgo(20),
    },
    {
      id: genId(), customerId: customers[0].id,
      items: [mkItem(pant.id, [
        { fieldId: 'pf1', fieldName: 'Waist', fieldNameBn: 'কোমর', value: '32' },
        { fieldId: 'pf6', fieldName: 'Length', fieldNameBn: 'লম্বা', value: '38' },
      ], 1, 700)],
      totalPrice: 700, advancePaid: 0, dueAmount: 700,
      deliveryDate: daysFromNow(4), status: 'cancelled', assignedTo: null, createdAt: daysAgo(10),
    },
    {
      id: genId(), customerId: customers[1].id,
      items: [
        mkItem(blazer.id, [
          { fieldId: 'bf1', fieldName: 'Chest', fieldNameBn: 'বুক', value: '42' },
          { fieldId: 'bf2', fieldName: 'Waist', fieldNameBn: 'কোমর', value: '38' },
          { fieldId: 'bf3', fieldName: 'Shoulder', fieldNameBn: 'কাঁধ', value: '18' },
          { fieldId: 'bf4', fieldName: 'Sleeve', fieldNameBn: 'হাতা', value: '24' },
          { fieldId: 'bf5', fieldName: 'Length', fieldNameBn: 'লম্বা', value: '29' },
        ], 1, 3500),
        mkItem(pant.id, [
          { fieldId: 'pf1', fieldName: 'Waist', fieldNameBn: 'কোমর', value: '34' },
          { fieldId: 'pf2', fieldName: 'Hip', fieldNameBn: 'হিপ', value: '40' },
          { fieldId: 'pf3', fieldName: 'Thigh', fieldNameBn: 'উরু', value: '24' },
          { fieldId: 'pf6', fieldName: 'Length', fieldNameBn: 'লম্বা', value: '40' },
        ], 1, 700),
      ],
      totalPrice: 4200, advancePaid: 2000, dueAmount: 2200,
      deliveryDate: daysFromNow(10), status: 'pending', assignedTo: tailor2.id, createdAt: daysAgo(3),
    },
    {
      id: genId(), customerId: customers[4].id,
      items: [
        mkItem(sherwani.id, [
          { fieldId: 'swf1', fieldName: 'Chest', fieldNameBn: 'বুক', value: '40' },
          { fieldId: 'swf2', fieldName: 'Waist', fieldNameBn: 'কোমর', value: '36' },
          { fieldId: 'swf3', fieldName: 'Shoulder', fieldNameBn: 'কাঁধ', value: '17.5' },
          { fieldId: 'swf4', fieldName: 'Sleeve', fieldNameBn: 'হাতা', value: '24' },
          { fieldId: 'swf5', fieldName: 'Length', fieldNameBn: 'লম্বা', value: '46' },
          { fieldId: 'swf6', fieldName: 'Hip', fieldNameBn: 'হিপ', value: '42' },
        ], 1, 8000),
        mkItem(panjabi.id, [
          { fieldId: 'pjf1', fieldName: 'Chest', fieldNameBn: 'বুক', value: '40' },
          { fieldId: 'pjf3', fieldName: 'Shoulder', fieldNameBn: 'কাঁধ', value: '17.5' },
          { fieldId: 'pjf5', fieldName: 'Length', fieldNameBn: 'লম্বা', value: '44' },
        ], 1, 1200),
        mkItem(pant.id, [
          { fieldId: 'pf1', fieldName: 'Waist', fieldNameBn: 'কোমর', value: '34' },
          { fieldId: 'pf6', fieldName: 'Length', fieldNameBn: 'লম্বা', value: '40' },
        ], 1, 700),
      ],
      totalPrice: 9900, advancePaid: 5000, dueAmount: 4900,
      deliveryDate: daysFromNow(15), status: 'pending', assignedTo: null, createdAt: daysAgo(1),
    },
    {
      id: genId(), customerId: customers[2].id,
      items: [
        mkItem(blazer.id, [
          { fieldId: 'bf1', fieldName: 'Chest', fieldNameBn: 'বুক', value: '41' },
          { fieldId: 'bf2', fieldName: 'Waist', fieldNameBn: 'কোমর', value: '37' },
          { fieldId: 'bf3', fieldName: 'Shoulder', fieldNameBn: 'কাঁধ', value: '17.5' },
          { fieldId: 'bf5', fieldName: 'Length', fieldNameBn: 'লম্বা', value: '29' },
        ], 1, 3500),
        mkItem(shirt.id, [
          { fieldId: 'sf1', fieldName: 'Collar', fieldNameBn: 'কলার', value: '15.5' },
          { fieldId: 'sf2', fieldName: 'Chest', fieldNameBn: 'বুক', value: '41' },
          { fieldId: 'sf5', fieldName: 'Sleeve', fieldNameBn: 'হাতা', value: '24' },
          { fieldId: 'sf6', fieldName: 'Length', fieldNameBn: 'লম্বা', value: '30' },
        ], 2, 850),
        mkItem(pant.id, [
          { fieldId: 'pf1', fieldName: 'Waist', fieldNameBn: 'কোমর', value: '33' },
          { fieldId: 'pf2', fieldName: 'Hip', fieldNameBn: 'হিপ', value: '39' },
          { fieldId: 'pf6', fieldName: 'Length', fieldNameBn: 'লম্বা', value: '39' },
        ], 1, 700),
      ],
      totalPrice: 6400, advancePaid: 3000, dueAmount: 3400,
      deliveryDate: daysFromNow(12), status: 'in_production', assignedTo: tailor2.id, createdAt: daysAgo(4),
    },
    {
      id: genId(), customerId: customers[6].id,
      items: [
        mkItem(salwar.id, [
          { fieldId: 'skf1', fieldName: 'Chest', fieldNameBn: 'বুক', value: '36' },
          { fieldId: 'skf2', fieldName: 'Waist', fieldNameBn: 'কোমর', value: '32' },
          { fieldId: 'skf3', fieldName: 'Hip', fieldNameBn: 'হিপ', value: '38' },
          { fieldId: 'skf4', fieldName: 'Kameez Length', fieldNameBn: 'কামিজ লম্বা', value: '42' },
          { fieldId: 'skf5', fieldName: 'Sleeve', fieldNameBn: 'হাতা', value: '22' },
          { fieldId: 'skf6', fieldName: 'Salwar Length', fieldNameBn: 'সালোয়ার লম্বা', value: '38' },
        ], 1, 1500),
        mkItem(kurta.id, [
          { fieldId: 'kf1', fieldName: 'Chest', fieldNameBn: 'বুক', value: '36' },
          { fieldId: 'kf2', fieldName: 'Waist', fieldNameBn: 'কোমর', value: '32' },
          { fieldId: 'kf4', fieldName: 'Length', fieldNameBn: 'লম্বা', value: '34' },
        ], 2, 600),
      ],
      totalPrice: 2700, advancePaid: 1350, dueAmount: 1350,
      deliveryDate: daysFromNow(8), status: 'pending', assignedTo: tailor2.id, createdAt: daysAgo(2),
    },
    {
      id: genId(), customerId: customers[3].id,
      items: [
        mkItem(panjabi.id, [
          { fieldId: 'pjf1', fieldName: 'Chest', fieldNameBn: 'বুক', value: '41' },
          { fieldId: 'pjf2', fieldName: 'Waist', fieldNameBn: 'কোমর', value: '38' },
          { fieldId: 'pjf4', fieldName: 'Sleeve', fieldNameBn: 'হাতা', value: '24' },
          { fieldId: 'pjf5', fieldName: 'Length', fieldNameBn: 'লম্বা', value: '45' },
        ], 2, 1200),
        mkItem(pant.id, [
          { fieldId: 'pf1', fieldName: 'Waist', fieldNameBn: 'কোমর', value: '36' },
          { fieldId: 'pf5', fieldName: 'Bottom', fieldNameBn: 'মোহরা', value: '17' },
          { fieldId: 'pf6', fieldName: 'Length', fieldNameBn: 'লম্বা', value: '41' },
        ], 2, 700),
      ],
      totalPrice: 3800, advancePaid: 3800, dueAmount: 0,
      deliveryDate: daysFromNow(-8), status: 'delivered', assignedTo: tailor1.id, createdAt: daysAgo(35),
    },
    {
      id: genId(), customerId: customers[5].id,
      items: [
        mkItem(shirt.id, [
          { fieldId: 'sf1', fieldName: 'Collar', fieldNameBn: 'কলার', value: '15' },
          { fieldId: 'sf2', fieldName: 'Chest', fieldNameBn: 'বুক', value: '39' },
          { fieldId: 'sf3', fieldName: 'Waist', fieldNameBn: 'কোমর', value: '36' },
          { fieldId: 'sf5', fieldName: 'Sleeve', fieldNameBn: 'হাতা', value: '24.5' },
          { fieldId: 'sf6', fieldName: 'Length', fieldNameBn: 'লম্বা', value: '30' },
        ], 3, 800),
        mkItem(kurta.id, [
          { fieldId: 'kf1', fieldName: 'Chest', fieldNameBn: 'বুক', value: '39' },
          { fieldId: 'kf3', fieldName: 'Shoulder', fieldNameBn: 'কাঁধ', value: '16' },
          { fieldId: 'kf4', fieldName: 'Length', fieldNameBn: 'লম্বা', value: '35' },
        ], 2, 600),
      ],
      totalPrice: 3600, advancePaid: 1800, dueAmount: 1800,
      deliveryDate: daysFromNow(2), status: 'ready', assignedTo: tailor2.id, createdAt: daysAgo(18),
    },
  ];

  // Insert orders
  for (const o of orders) {
    const firstItem = o.items[0];
    await supabase.from('orders').insert({
      id: o.id, shop_id: shopId, customer_id: o.customerId,
      product_id: firstItem.productId, measurements: firstItem.measurements,
      quantity: firstItem.quantity, unit_price: firstItem.unitPrice,
      total_price: o.totalPrice, advance_paid: o.advancePaid, due_amount: o.dueAmount,
      delivery_date: o.deliveryDate, status: o.status, assigned_to: o.assignedTo,
      created_at: o.createdAt, items: o.items,
    });

    const action = o.status === 'cancelled' ? 'status_changed' : 'created';
    await supabase.from('order_history').insert({
      id: genId(), order_id: o.id, shop_id: shopId, action,
      description: 'অর্ডার তৈরি করা হয়েছে', performed_by: 'Owner', timestamp: o.createdAt,
    });

    if (o.status !== 'pending' && o.status !== 'cancelled') {
      await supabase.from('order_history').insert({
        id: genId(), order_id: o.id, shop_id: shopId, action: 'status_changed',
        description: 'স্ট্যাটাস পরিবর্তন', performed_by: 'Owner',
        changes: { status: { from: 'pending', to: o.status } },
        timestamp: new Date(new Date(o.createdAt).getTime() + 86400000).toISOString(),
      });
    }
  }

  // ── Shop Settings ─────────────────────────────────────────────────────────
  const demoSettings = {
    shopName: 'Rahman Tailors', shopNameBn: 'রহমান টেইলার্স',
    shopAddress: 'ঢাকা, মিরপুর-১০, রোড নং ৫', shopPhone: '01711-000000',
    shopLogo: '', currency: '৳', invoicePrefix: 'RT-', defaultAdvancePercent: 50,
    enableSMS: false, enablePrintAutoOpen: false, smsApiKey: '', smsSenderId: '', smsBalanceThreshold: 50,
  };
  await supabase.from('shop_settings').insert({ id: genId(), shop_id: shopId, data: demoSettings });

  return NextResponse.json({
    success: true,
    summary: {
      categories: cats.length, products: products.length, roles: roles.length,
      staff: staff.length, customers: customers.length, orders: orders.length,
    },
  });
}
