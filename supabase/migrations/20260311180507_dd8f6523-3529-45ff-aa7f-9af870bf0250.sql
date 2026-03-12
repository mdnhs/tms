
-- Create shop_roles table
CREATE TABLE public.shop_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_bn text NOT NULL DEFAULT '',
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add unique constraint for role name per shop
ALTER TABLE public.shop_roles ADD CONSTRAINT shop_roles_shop_name_unique UNIQUE (shop_id, name);

-- Enable RLS
ALTER TABLE public.shop_roles ENABLE ROW LEVEL SECURITY;

-- RLS: Shop owners can CRUD own roles
CREATE POLICY "Shop owners can view own roles" ON public.shop_roles
FOR SELECT USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = shop_roles.shop_id AND shops.owner_id = auth.uid()));

CREATE POLICY "Shop owners can insert own roles" ON public.shop_roles
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM shops WHERE shops.id = shop_roles.shop_id AND shops.owner_id = auth.uid()));

CREATE POLICY "Shop owners can update own roles" ON public.shop_roles
FOR UPDATE USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = shop_roles.shop_id AND shops.owner_id = auth.uid()));

CREATE POLICY "Shop owners can delete own roles" ON public.shop_roles
FOR DELETE USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = shop_roles.shop_id AND shops.owner_id = auth.uid()));

-- RLS: Super admins can manage all
CREATE POLICY "Super admins can manage all roles" ON public.shop_roles
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_shop_roles_updated_at BEFORE UPDATE ON public.shop_roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add role_id column to shop_staff
ALTER TABLE public.shop_staff ADD COLUMN role_id uuid REFERENCES public.shop_roles(id) ON DELETE SET NULL;
