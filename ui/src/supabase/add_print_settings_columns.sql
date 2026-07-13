-- Add dynamic print settings columns to store_settings table
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS store_name TEXT DEFAULT 'Aha Konaseema';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS origin_address TEXT DEFAULT 'Ravulapalem, East Godavari District, Andhra Pradesh';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS courier_partner TEXT DEFAULT 'Ghee Express Courier';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS support_email TEXT DEFAULT 'support@ahakonaseema.com';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS support_phone TEXT DEFAULT '+91 888 777 6666';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS guarantee_text TEXT DEFAULT 'Pure Milk Ghee Freshness verified • Vacuum leakage protection sealed • Brand seal attached';

-- Update existing default settings row with standard details
UPDATE public.store_settings 
SET 
  store_name = COALESCE(store_name, 'Aha Konaseema'),
  origin_address = COALESCE(origin_address, 'Ravulapalem, East Godavari District, Andhra Pradesh'),
  courier_partner = COALESCE(courier_partner, 'Ghee Express Courier'),
  support_email = COALESCE(support_email, 'support@ahakonaseema.com'),
  support_phone = COALESCE(support_phone, '+91 888 777 6666'),
  guarantee_text = COALESCE(guarantee_text, 'Pure Milk Ghee Freshness verified • Vacuum leakage protection sealed • Brand seal attached')
WHERE id = 'default_settings';
