# ⚡ Aha Konaseema — Complete Installation & Supabase Setup Guide

Welcome to the official, absolute beginner-friendly "blind follow" installation and setup guide for **Aha Konaseema** (formerly SweetVerse). Follow these exact steps sequentially to initialize the frontend, configure the Supabase cloud backend database, set up storage assets, and run the project successfully from scratch!

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Local Project Installation](#2-local-project-installation)
3. [Supabase Cloud Project Setup](#3-supabase-cloud-project-setup)
4. [Master Database SQL Script (Copy-Paste)](#4-master-database-sql-script-copy-paste)
5. [Storage Bucket Configuration](#5-storage-bucket-configuration)
6. [Creating an Administrator User](#6-creating-an-administrator-user)
7. [Environment Variables Configuration](#7-environment-variables-configuration)
8. [Starting the Local Development Server](#8-starting-the-local-development-server)
9. [Enterprise Print System Verification](#9-enterprise-print-system-verification)

---

## 1. Prerequisites
Ensure you have the following installed on your operating system:
* **Node.js** (v18.x or higher) -> [Download Node.js](https://nodejs.org)
* **Git** (for version control and repository cloning) -> [Download Git](https://git-scm.com)
* A modern browser (Chrome, Edge, Firefox, or Safari)

---

## 2. Local Project Installation
Open your terminal (PowerShell, Command Prompt, or bash) inside your workspace directory and run the following commands:

```bash
# 1. Clone the project repository (if not already local)
git clone <your-repository-url> aha-konaseema

# 2. Navigate into the project folder
cd aha-konaseema

# 3. Clean install all npm package dependencies
npm install
```

---

## 3. Supabase Cloud Project Setup
1. Go to the [Supabase Dashboard](https://supabase.com) and sign in.
2. Click **New Project** and select your organization.
3. Configure your project details:
   * **Name**: `Aha Konaseema`
   * **Database Password**: *Choose a secure password and save it somewhere safe.*
   * **Region**: Choose the closest geographical server region (e.g., *Mumbai / Singapore* for India).
4. Click **Create new project** and wait 1-2 minutes for the database to provision.

---

## 4. Master Database SQL Script (Copy-Paste)
Once your Supabase project is active, configure your entire database schema in one click:
1. In the left-hand navigation menu of Supabase, click on **SQL Editor**.
2. Click **New Query** to create a blank editor worksheet.
3. Copy the entire unified SQL script block below and paste it directly into the worksheet:

```sql
-- ========================================================
-- 1. EXTENSIONS & CORE USER PROFILE SCHEMA
-- ========================================================

-- Enable core uuid generator
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create public users profiles table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- 2. PRODUCTS & CATEGORIES SCHEMA
-- ========================================================

-- Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2),
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    rating DECIMAL(3, 2) DEFAULT 5.00,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on Products and Categories
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- 3. ORDERS & TRANSACTIONS SCHEMA
-- ========================================================

-- Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    shipping_address JSONB NOT NULL,
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price_at_time DECIMAL(10, 2) NOT NULL
);

-- Enable RLS on Orders and Order Items
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- 4. FLASH ANNOUNCEMENTS SCHEMA
-- ========================================================

-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'critical')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- 4.5 PROMOTIONAL COUPONS SCHEMA
-- ========================================================

-- Create Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    code TEXT PRIMARY KEY,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_value DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- 5. DYNAMIC PRINT & STORE SETTINGS SCHEMA
-- ========================================================

-- Create Store Settings Table
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY,
    cod_enabled BOOLEAN DEFAULT true,
    partial_payment_enabled BOOLEAN DEFAULT false,
    partial_payment_percent INTEGER DEFAULT 50,
    store_name TEXT DEFAULT 'Aha Konaseema',
    origin_address TEXT DEFAULT 'Ravulapalem, East Godavari District, Andhra Pradesh',
    courier_partner TEXT DEFAULT 'Ghee Express Courier',
    support_email TEXT DEFAULT 'support@ahakonaseema.com',
    support_phone TEXT DEFAULT '+91 888 777 6666',
    guarantee_text TEXT DEFAULT 'Pure Milk Ghee Freshness verified • Vacuum leakage protection sealed • Brand seal attached',
    hero_slides JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- 6. SECURE ROLES, RECURSION BYPASS & RLS POLICIES
-- ========================================================

-- Create admin bypass role check function (DEFINER sets execution path to bypass table recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN COALESCE(user_role = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing policies to prevent naming collisions
DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;
DROP POLICY IF EXISTS "Allow public read access on categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.announcements;
DROP POLICY IF EXISTS "Anyone can view settings" ON public.store_settings;
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can update settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;

-- Policies for public catalog and announcements
CREATE POLICY "Allow public read access on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public read access on categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view active announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Anyone can view settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (is_active = true);

-- Policies for Admin Write Controls
CREATE POLICY "Admins can update settings" ON public.store_settings FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (public.is_admin());

-- Users profile policies
CREATE POLICY "Users can view their own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (public.is_admin());

-- Order policies
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (public.is_admin());

-- Order items policies
CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert their own order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (public.is_admin());

-- ========================================================
-- 7. AUTORUN TRIGGER ON USER SIGNUP
-- ========================================================

-- Function to handle new user registration automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute upon auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ========================================================
-- 8. SEED DATA & DYNAMIC STORE BASELINE INITIALIZATION
-- ========================================================

-- Insert baseline settings row
INSERT INTO public.store_settings (
  id, cod_enabled, partial_payment_enabled, partial_payment_percent, 
  store_name, origin_address, courier_partner, support_email, support_phone, 
  guarantee_text, hero_slides
) VALUES (
  'default_settings', true, false, 50,
  'Aha Konaseema', 'Ravulapalem, East Godavari District, Andhra Pradesh', 
  'Ghee Express Courier', 'support@ahakonaseema.com', '+91 888 777 6666',
  'Pure Milk Ghee Freshness verified • Vacuum leakage protection sealed • Brand seal attached',
  '[
    {
      "image_url": "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80&w=800",
      "title": "Aha Konaseema Pure Ghee Sweets",
      "description": "Indulge in authentic Godavari confections crafted with absolute purity."
    },
    {
      "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800",
      "title": "Freshness Vacuum Sealed",
      "description": "Every container is leak-proof and packed in sterile zero-contamination kitchens."
    }
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Insert premium seed categories
INSERT INTO public.categories (name, slug, description, image_url) VALUES 
('Ghee Sweets', 'ghee-sweets', 'Rich sweets prepared with pure organic cow ghee.', 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80&w=300'),
('Kajjikayalu', 'kajjikayalu', 'Crispy traditional Andhra sweet pastries with delicious fillings.', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=300'),
('Savories', 'savories', 'Traditional hot and spicy mixtures from East Godavari.', 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80&w=300')
ON CONFLICT (name) DO NOTHING;

-- Insert seed announcement flash message
INSERT INTO public.announcements (text, type, is_active)
VALUES ('⚡ CELEBRATION DISCOUNTS: Get free express shipping across South India on all orders above ₹999!', 'success', true);

-- Insert seed coupon campaign
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_value, is_active)
VALUES ('WELCOME50', 'flat', 50.00, 299.00, true)
ON CONFLICT (code) DO NOTHING;
```

4. Click the green **Run** button at the bottom-right of the SQL editor worksheet. 
5. Verify the console outputs `Success. No rows returned` or shows confirmation of executed blocks.

---

## 5. Storage Bucket Configuration
For confections upload capabilities and custom graphics in the admin dashboard:
1. In the left-hand navigation of your Supabase dashboard, click on **Storage**.
2. Click **New Bucket**.
3. Set the name to exactly `product-images`.
4. **CRITICAL**: Set the bucket privacy toggle to **Public** so the application can render the uploaded images via absolute public URLs.
5. Click **Create Bucket**.
6. Set the RLS storage policies by clicking **Policies** under your new bucket -> click **New Policy** -> Choose **Allow public read and admin manage access** (Select all privileges for authenticated users or select `Public` reads).

---

## 6. Creating an Administrator User
By default, newly registered users are given the `'user'` role. To configure your user account as an admin to access the **Command Center** dashboard:
1. Navigate to the local website (e.g., `http://localhost:5173/register`) and register a new user account.
2. Return to your Supabase dashboard and click on **SQL Editor** -> **New Query**.
3. Run the following update command (substituting your registered account email):

```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

4. Press **Run**. Log out and log back into your web application. You will now have administrative control on `/admin`!

---

## 7. Environment Variables Configuration
1. In your local codebase root directory, locate the file named `.env`. If it does not exist, create a new file named `.env` in the root folder.
2. Open your Supabase Dashboard, click on **Project Settings** (cog icon at the bottom-left), and select **API**.
3. Copy the values and paste them into your local `.env` file:

```env
# Supabase Cloud Database credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key-here

# Email Server (cPanel SMTP) Credentials for Order Alerts
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=465
SMTP_USER=admin@yourdomain.com
SMTP_PASS=YourEmailPasswordHere

# OneSignal Push Notification IDs
VITE_ONESIGNAL_APP_ID=your-onesignal-app-uuid
VITE_ONESIGNAL_SAFARI_ID=your-onesignal-safari-uuid
ONESIGNAL_REST_API_KEY=os_v2_app_yourkeyhere

# Admin Email for Order Notifications
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

---

## 8. Starting the Local Development Server
Return to your local terminal and execute the launch command:

```bash
# Start the fast Vite local development server
npm run dev
```

The terminal will print the active server link:
```text
  VITE v5.x.x  ready in 350 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open `http://localhost:5173/` in your browser. The platform is now fully connected to Supabase and live!

---

## 9. Enterprise Print System Verification
To verify the newly upgraded enterprise isolated printing routes:
* **Admin Packing Slip**: Click **Command Center** -> Go to **Orders** -> Click **`📦 Slip`** next to any active order. It will open a clean, high-performance isolated browser tab on `/print/packing-slip/<id>` and automatically open the print prompt.
* **Customer Invoice**: Go to **Orders** (either admin command center or customer profile order history) -> Click **`🧾 Invoice`**. It will open the print receipt view on `/print/invoice/<id>` outside the website layout, prompting clean A4 page prints.

---

*Enjoy building the future of authentic organic Godavari sweets with Aha Konaseema! For support or technical assistance, contact the backend operations team.*
