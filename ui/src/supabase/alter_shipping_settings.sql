-- Add shipping columns to store_settings table
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC DEFAULT 50.00;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC DEFAULT 999.00;

-- Update existing default settings row with the shipping values
UPDATE public.store_settings 
SET shipping_fee = 50.00, free_shipping_threshold = 999.00
WHERE id = 'default_settings';
