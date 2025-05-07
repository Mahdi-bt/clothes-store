import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  discount?: number;
  images: string[];
  category_id: string;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
};

export type Order = {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total_amount: number;
  items: {
    product_id: string;
    quantity: number;
    product: Product;
  }[];
  created_at: string;
}; 