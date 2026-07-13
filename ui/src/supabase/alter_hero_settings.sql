-- Add hero settings columns to store_settings table
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_image_url TEXT DEFAULT 'https://placehold.co/600x600/1E1E1E/8B5CF6?text=3D+Dessert';
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_use_carousel BOOLEAN DEFAULT false;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_carousel_urls TEXT DEFAULT 'https://placehold.co/600x600/1E1E1E/8B5CF6?text=Dessert+1,https://placehold.co/600x600/1E1E1E/06B6D4?text=Dessert+2,https://placehold.co/600x600/1E1E1E/EC4899?text=Dessert+3';

-- Update the existing default row to have baseline values
UPDATE public.store_settings 
SET 
  hero_image_url = 'https://placehold.co/600x600/1E1E1E/8B5CF6?text=3D+Dessert',
  hero_use_carousel = false,
  hero_carousel_urls = 'https://placehold.co/600x600/1E1E1E/8B5CF6?text=Dessert+1,https://placehold.co/600x600/1E1E1E/06B6D4?text=Dessert+2,https://placehold.co/600x600/1E1E1E/EC4899?text=Dessert+3'
WHERE id = 'default_settings';
