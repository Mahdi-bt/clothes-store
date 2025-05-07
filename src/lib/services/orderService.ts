import { supabase } from '../supabase';
import { Product, ProductVariant } from '../../types';

interface OrderItem {
  id: string;
  order_id: string;
  product_variant_id: string;
  quantity: number;
  price: number;
  price_at_time: number;
  discount: number;
  product_variant: {
    size: string;
    color: string;
    product: Product;
  };
}

interface Order {
  id: string;
  created_at: string;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled' | 'completed';
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  total_amount: number;
  order_items: OrderItem[];
}

interface BestSeller {
  product_variant: {
    size: string;
    color: string;
    product: Product;
  };
  total_sold: number;
  total_revenue: number;
}

export const orderService = {
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product_variant:product_variants (
            *,
            product:products (*)
          )
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
    
    return data || [];
  },

  async getPendingOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product_variant:product_variants (
            *,
            product:products (*)
          )
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching pending orders:', error);
      throw error;
    }
    
    return data || [];
  },

  async getTotalRevenue(): Promise<number> {
    const { data, error } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'completed');
    
    if (error) {
      console.error('Error calculating total revenue:', error);
      throw error;
    }
    
    return (data || []).reduce((total, order) => total + (order.total_amount || 0), 0);
  },

  async getOrdersCount(): Promise<number> {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error getting orders count:', error);
      throw error;
    }
    
    return count || 0;
  },

  async getBestSellingProducts(limit: number = 5): Promise<BestSeller[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        *,
        product_variant:product_variants (
          *,
          product:products (*)
        )
      `);
    
    if (error) {
      console.error('Error fetching best selling products:', error);
      throw error;
    }

    // Calculate total quantity sold and revenue for each product variant
    const variantSales = (data || []).reduce((acc, item) => {
      if (!item.product_variant) return acc;
      
      const existing = acc.find(p => p.product_variant.id === item.product_variant.id);
      if (existing) {
        existing.total_sold += item.quantity;
        existing.total_revenue += item.price_at_time * item.quantity;
      } else {
        acc.push({
          product_variant: item.product_variant,
          total_sold: item.quantity,
          total_revenue: item.price_at_time * item.quantity
        });
      }
      return acc;
    }, [] as BestSeller[]);

    // Sort by total sold and return top N products
    return variantSales
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, limit);
  },

  async deleteOrder(orderId: string): Promise<void> {
    // First delete order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);
    
    if (itemsError) {
      console.error('Error deleting order items:', itemsError);
      throw itemsError;
    }

    // Then delete the order
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);
    
    if (orderError) {
      console.error('Error deleting order:', orderError);
      throw orderError;
    }
  }
}; 