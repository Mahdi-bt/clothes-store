import { supabase } from '../supabase';

interface DeliverySettings {
  id: number;
  min_order_amount: number;
  delivery_cost: number;
  is_active: boolean;
}

export const deliveryService = {
  async getDeliverySettings(): Promise<DeliverySettings | null> {
    const { data, error } = await supabase
      .from('delivery_settings')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching delivery settings:', error);
      return null;
    }

    return data;
  },

  async calculateDeliveryCost(subtotal: number): Promise<number> {
    const settings = await this.getDeliverySettings();
    
    if (!settings || !settings.is_active) {
      return 0;
    }

    return subtotal >= settings.min_order_amount ? 0 : settings.delivery_cost;
  }
}; 