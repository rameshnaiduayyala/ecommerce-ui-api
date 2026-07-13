-- Create Flash Announcements Table for Enterprise updates
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'critical'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Policies for Announcements
CREATE POLICY "Anyone can view active announcements" ON public.announcements 
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage announcements" ON public.announcements 
    FOR ALL USING (public.is_admin());

-- Insert a default premium announcement
INSERT INTO public.announcements (text, type, is_active)
VALUES ('⚡ SYSTEM UPDATE: Enjoy free delivery on all futuristic confectionery orders above ₹999!', 'success', true)
ON CONFLICT DO NOTHING;
