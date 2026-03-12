
-- Add user_id column to shop_staff to link with auth users
ALTER TABLE public.shop_staff ADD COLUMN user_id uuid UNIQUE;

-- Create a function to get staff permissions (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.get_staff_permissions(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(sr.permissions, '[]'::jsonb)
  FROM shop_staff ss
  LEFT JOIN shop_roles sr ON sr.id = ss.role_id
  WHERE ss.user_id = _user_id AND ss.is_active = true
  LIMIT 1
$$;

-- Create a function to check if user is staff of a shop
CREATE OR REPLACE FUNCTION public.is_shop_staff(_user_id uuid, _shop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM shop_staff
    WHERE user_id = _user_id AND shop_id = _shop_id AND is_active = true
  )
$$;

-- Create a function to get staff's shop_id
CREATE OR REPLACE FUNCTION public.get_staff_shop_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT shop_id FROM shop_staff
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1
$$;

-- Update RLS policies for shop_customers to also allow staff access
CREATE POLICY "Staff can view shop customers" ON public.shop_customers
FOR SELECT USING (is_shop_staff(auth.uid(), shop_id));

CREATE POLICY "Staff can insert shop customers" ON public.shop_customers
FOR INSERT WITH CHECK (is_shop_staff(auth.uid(), shop_id));

CREATE POLICY "Staff can update shop customers" ON public.shop_customers
FOR UPDATE USING (is_shop_staff(auth.uid(), shop_id));

-- Update RLS for shop_products
CREATE POLICY "Staff can view shop products" ON public.shop_products
FOR SELECT USING (is_shop_staff(auth.uid(), shop_id));

-- Update RLS for shop_orders
CREATE POLICY "Staff can view shop orders" ON public.shop_orders
FOR SELECT USING (is_shop_staff(auth.uid(), shop_id));

CREATE POLICY "Staff can insert shop orders" ON public.shop_orders
FOR INSERT WITH CHECK (is_shop_staff(auth.uid(), shop_id));

CREATE POLICY "Staff can update shop orders" ON public.shop_orders
FOR UPDATE USING (is_shop_staff(auth.uid(), shop_id));

-- Staff can view shop settings (read-only)
CREATE POLICY "Staff can view shop settings" ON public.shop_settings
FOR SELECT USING (is_shop_staff(auth.uid(), shop_id));

-- Staff can view their own shop
CREATE POLICY "Staff can view own shop" ON public.shops
FOR SELECT USING (is_shop_staff(auth.uid(), id));

-- Staff can view shop roles
CREATE POLICY "Staff can view shop roles" ON public.shop_roles
FOR SELECT USING (is_shop_staff(auth.uid(), shop_id));
