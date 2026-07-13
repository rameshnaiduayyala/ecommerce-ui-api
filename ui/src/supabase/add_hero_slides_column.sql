-- Add hero_slides JSONB column to store_settings table
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hero_slides JSONB DEFAULT '[]'::jsonb;

-- Populate default hero slides for a gorgeous baseline experience
UPDATE public.store_settings 
SET hero_slides = '[
  {
    "image_url": "https://placehold.co/600x600/1E1E1E/8B5CF6?text=Quantum+Macaron",
    "title": "Quantum Macaron",
    "description": "Multi-dimensional luxury confectionery prepared with freeze-dried star dust."
  },
  {
    "image_url": "https://placehold.co/600x600/1E1E1E/06B6D4?text=Nebula+Truffle",
    "title": "Nebula Truffle",
    "description": "Slow-churned dark cocoa layers infused with premium zero-gravity ganache."
  },
  {
    "image_url": "https://placehold.co/600x600/1E1E1E/EC4899?text=Supernova+Cake",
    "title": "Supernova Cake",
    "description": "Explosive pink raspberry sponge enveloped in a decadent mirror-glaze shield."
  }
]'::jsonb
WHERE id = 'default_settings';
