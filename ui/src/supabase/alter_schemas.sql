-- Add admin_note to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- Add admin_note to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_note TEXT;
