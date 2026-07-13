-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2),
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    category_id UUID, -- Will link to categories
    rating DECIMAL(3, 2) DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for products -> categories
ALTER TABLE public.products 
ADD CONSTRAINT fk_products_category 
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

-- Enable Row Level Security (RLS) for public access to products and categories
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access
CREATE POLICY "Allow public read access on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public read access on categories" ON public.categories FOR SELECT USING (true);

-- Insert some dummy data so the UI has something to show
INSERT INTO public.categories (name, slug, description) VALUES 
('Macarons', 'macarons', 'Cybernetic macarons'),
('Truffles', 'truffles', 'Dark matter truffles'),
('Pastries', 'pastries', 'Holographic pastries'),
('Cakes', 'cakes', 'Plasma cakes');

-- Insert dummy products
INSERT INTO public.products (name, slug, description, price, discount_price, image_url, rating, featured) VALUES 
('Cyber Macaron', 'cyber-macaron', 'Neon infused raspberry macarons with quantum vanilla filling.', 12.99, NULL, 'https://placehold.co/400x400/1E1E1E/8B5CF6?text=Cyber+Macaron', 4.8, true),
('Nebula Truffle', 'nebula-truffle', 'Dark matter chocolate truffles dusted with starlight sugar.', 24.99, 19.99, 'https://placehold.co/400x400/1E1E1E/8B5CF6?text=Nebula+Truffle', 4.9, true),
('Holo Croissant', 'holo-croissant', 'Flaky, buttery croissant with a holographic sugar glaze.', 8.99, NULL, 'https://placehold.co/400x400/1E1E1E/8B5CF6?text=Holo+Croissant', 4.5, true),
('Quantum Eclair', 'quantum-eclair', 'Pistachio cream filled eclair with dark matter icing.', 14.99, NULL, 'https://placehold.co/400x400/1E1E1E/8B5CF6?text=Quantum+Eclair', 4.7, true),
('Neon Donut', 'neon-donut', 'Glowing cyber-glaze on a perfect zero-g donut.', 6.99, NULL, 'https://placehold.co/400x400/1E1E1E/8B5CF6?text=Neon+Donut', 4.2, false),
('Plasma Cake Slice', 'plasma-cake-slice', 'Layers of anti-gravity sponge and plasma fruit compote.', 18.99, NULL, 'https://placehold.co/400x400/1E1E1E/8B5CF6?text=Plasma+Cake', 4.6, false);
