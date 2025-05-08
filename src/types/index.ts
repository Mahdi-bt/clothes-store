export interface Product {
  id: string;
  name_en: string;
  name_fr: string;
  name_ar: string;
  description_en?: string;
  description_fr?: string;
  description_ar?: string;
  original_price: number;  // Cost price (what we buy it for)
  selling_price: number;   // Price to sell to customers
  discount?: number;
  gender?: 'male' | 'female' | 'unisex';
  material?: string;
  brand?: string;
  images: string[];
  category_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
  selectedVariant?: {
    size: string;
    color: string;
    stock: number;
    sku: string;
  };
  stock?: number;
  image_url?: string | null;
}

export type Category = {
  id: string;
  name_en: string;
  name_fr: string;
  name_ar: string;
  product_count?: number;
};

export type CartItem = {
  productId: string;
  product: Product;
  quantity: number;
};

export interface Order {
  id: string;
  customer_name: string;
  phone: string;
  alternate_phone: string | null;
  address: string;
  governorate?: string;
  delegation?: string;
  zip_code?: string;
  email: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'delivered' | 'completed' | 'cancelled';
  created_at: string;
  order_items: OrderItem[];
  delivery_fee?: number;
}

export interface OrderItem {
  id: string;
  product_variant_id: string;
  quantity: number;
  price: number;
  price_at_time: number;
  discount: number;
  product_variant: {
    size: string;
    color: string;
    sku: string;
    product: {
      name_en: string;
      name_fr: string;
      name_ar: string;
      images: string[];
    };
  };
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  stock: number;
  sku: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
