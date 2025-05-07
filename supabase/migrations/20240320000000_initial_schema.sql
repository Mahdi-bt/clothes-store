-- Create categories table
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_fr TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_fr TEXT,
    description_ar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create products table
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_fr TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_fr TEXT,
    description_ar TEXT,
    original_price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (original_price >= 0),
    selling_price DECIMAL(10,2) NOT NULL CHECK (selling_price >= 0),
    discount DECIMAL(5,2) CHECK (discount >= 0 AND discount <= 100),
    gender TEXT CHECK (gender IN ('male', 'female', 'unisex')),
    material TEXT,
    brand TEXT,
    images TEXT[] DEFAULT '{}',
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    sku TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(product_id, size, color)
);

-- Create orders table
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    address TEXT NOT NULL,
    governorate TEXT NOT NULL,
    delegation TEXT NOT NULL,
    zip_code TEXT,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create order_items table
CREATE TABLE order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    price_at_time DECIMAL(10,2) NOT NULL CHECK (price_at_time >= 0),
    discount DECIMAL(5,2) DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create delivery_settings table
CREATE TABLE delivery_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 100,
    delivery_cost DECIMAL(10,2) NOT NULL DEFAULT 7,
    is_active BOOLEAN NOT NULL DEFAULT true,
    logo_url TEXT,
    logo_height INTEGER DEFAULT 100,
    logo_width INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
    ('product-images', 'product-images', true),
    ('logos', 'logos', true);

-- Set up storage policies for product-images bucket
CREATE POLICY "Allow public read access to product images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated users to upload product images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'product-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Allow authenticated users to update product images"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'product-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Allow authenticated users to delete product images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'product-images' 
        AND auth.role() = 'authenticated'
    );

-- Set up storage policies for logos bucket
CREATE POLICY "Allow public read access to logos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'logos');

CREATE POLICY "Allow authenticated users to upload logos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'logos' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Allow authenticated users to update logos"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'logos' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Allow authenticated users to delete logos"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'logos' 
        AND auth.role() = 'authenticated'
    );

-- Create RLS policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to categories" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to products" ON products
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to delivery settings" ON delivery_settings
    FOR SELECT USING (true);

-- Create policies for authenticated users (admin)
CREATE POLICY "Allow admin full access to categories" ON categories
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin full access to products" ON products
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin full access to orders" ON orders
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin full access to order items" ON order_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin full access to delivery settings" ON delivery_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_settings_updated_at
    BEFORE UPDATE ON delivery_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 

CREATE TRIGGER update_product_variants_updated_at
BEFORE UPDATE ON product_variants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to product variants" ON product_variants
    FOR SELECT USING (true);

CREATE POLICY "Allow admin full access to product variants" ON product_variants
    FOR ALL USING (auth.role() = 'authenticated');




-- Get database size
create or replace function get_database_size()
returns bigint
language plpgsql
security definer
as $$
begin
  return (select pg_database_size(current_database()));
end;
$$;

-- Get table count
create or replace function get_table_count()
returns integer
language plpgsql
security definer
as $$
begin
  return (select count(*) from information_schema.tables where table_schema = 'public');
end;
$$;

-- Get index size
create or replace function get_index_size()
returns bigint
language plpgsql
security definer
as $$
begin
  return (select sum(pg_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)))
          from pg_tables
          where schemaname = 'public');
end;
$$;

-- Get cache hit ratio
create or replace function get_cache_hit_ratio()
returns float
language plpgsql
security definer
as $$
begin
  return (select sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read))
          from pg_statio_user_tables);
end;
$$;

-- Get active connections
create or replace function get_active_connections()
returns integer
language plpgsql
security definer
as $$
begin
  return (select count(*) from pg_stat_activity where datname = current_database());
end;
$$;