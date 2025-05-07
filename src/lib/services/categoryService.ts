import { supabase } from '../supabase';
import type { Category } from '@/types';

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        products:products(count)
      `)
      .order('name_en', { ascending: true });
    
    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
    
    // Transform the data to include product count
    return (data || []).map(category => ({
      id: category.id,
      name_en: category.name_en,
      name_fr: category.name_fr,
      name_ar: category.name_ar,
      description_en: category.description_en,
      description_fr: category.description_fr,
      description_ar: category.description_ar,
      product_count: category.products?.[0]?.count || 0
    }));
  },

  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*');
    
    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
    
    return data || [];
  },

  async getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
    
    return data;
  },

  async create(data: Omit<Category, 'id' | 'product_count'>): Promise<Category> {
    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return newCategory;
  },

  async update(id: string, data: Omit<Category, 'id' | 'product_count'>): Promise<Category> {
    const { data: updatedCategory, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return updatedCategory;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}; 