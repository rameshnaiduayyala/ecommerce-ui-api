-- Create Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    code TEXT PRIMARY KEY,
    discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'flat'
    discount_value NUMERIC NOT NULL,
    min_order_value NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Anyone can check coupons
CREATE POLICY "Anyone can view active coupons" ON public.coupons 
    FOR SELECT USING (is_active = true);

-- Admins can fully manage coupons
CREATE POLICY "Admins can manage coupons" ON public.coupons 
    FOR ALL USING (public.is_admin());

-- Insert default high-end promo codes
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_value, is_active)
VALUES 
('SWEET10', 'percentage', 10, 500, true),
('WELCOME100', 'flat', 100, 1000, true)
ON CONFLICT (code) DO NOTHING;
