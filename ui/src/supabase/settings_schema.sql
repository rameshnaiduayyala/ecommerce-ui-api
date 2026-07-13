-- Create Settings Table for Admin Controls
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY,
    cod_enabled BOOLEAN DEFAULT true,
    partial_payment_enabled BOOLEAN DEFAULT false,
    partial_payment_percent INTEGER DEFAULT 50
);

-- Insert default settings row
INSERT INTO public.store_settings (id, cod_enabled, partial_payment_enabled, partial_payment_percent)
VALUES ('default_settings', true, false, 50)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Policies for Settings
CREATE POLICY "Anyone can view settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON public.store_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
