-- 1. Create a public bucket for product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public read access to product-images bucket
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" ON storage.objects 
    FOR SELECT USING (bucket_id = 'product-images');

-- 3. Allow authenticated admins to upload/manage product-images
DROP POLICY IF EXISTS "Admin CRUD Access" ON storage.objects;
CREATE POLICY "Admin CRUD Access" ON storage.objects 
    FOR ALL USING (
        bucket_id = 'product-images' AND public.is_admin()
    );
