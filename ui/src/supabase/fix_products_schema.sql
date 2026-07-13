-- 1. Add admin_note to products table if missing
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- 2. Add admin_note to orders table if missing
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- 3. Enable RLS on Products and Categories if not already enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 4. Re-create SELECT policies (allow anyone to read)
DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;
CREATE POLICY "Allow public read access on products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on categories" ON public.categories;
CREATE POLICY "Allow public read access on categories" ON public.categories FOR SELECT USING (true);

-- 5. Create Admin Management Policies for Products (allowing CRUD)
DROP POLICY IF EXISTS "Admins can fully manage products" ON public.products;
CREATE POLICY "Admins can fully manage products" ON public.products 
    FOR ALL USING (public.is_admin());

-- 6. Create Admin Management Policies for Categories (allowing CRUD)
DROP POLICY IF EXISTS "Admins can fully manage categories" ON public.categories;
CREATE POLICY "Admins can fully manage categories" ON public.categories 
    FOR ALL USING (public.is_admin());
