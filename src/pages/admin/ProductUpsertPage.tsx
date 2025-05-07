import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import { Category } from '@/types';
import { categoryService } from '@/lib/services/categoryService';
import { supabase } from '@/lib/supabase';

interface ProductVariant {
  id?: string;
  size: string;
  color: string;
  stock: number;
  sku: string;
  is_active: boolean;
}

const ProductUpsertPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [formData, setFormData] = useState({
    name_en: '',
    name_fr: '',
    name_ar: '',
    description_en: '',
    description_fr: '',
    description_ar: '',
    original_price: '',
    selling_price: '',
    discount: '',
    categoryId: '',
    gender: 'unisex',
    material: '',
    brand: '',
    is_active: true,
    profit_margin: '',
  });

  useEffect(() => {
    const initializeData = async () => {
      try {
        const data = await categoryService.getCategories();
        setCategories(data);
        
        if (!id && data.length > 0) {
          setFormData(prev => ({ ...prev, categoryId: data[0].id }));
        }
        
        if (id) {
          await loadProduct();
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast.error('Failed to load data: ' + errorMessage);
      }
    };

    initializeData();
  }, [id]);

  const calculateSellingPrice = (cost: string, margin: string) => {
    if (!cost || !margin) return '';
    const costNum = parseFloat(cost);
    const marginNum = parseFloat(margin);
    if (isNaN(costNum) || isNaN(marginNum)) return '';
    const sellingPrice = costNum * (1 + marginNum / 100);
    return sellingPrice.toFixed(2);
  };

  const calculateProfitMargin = (cost: string, selling: string) => {
    if (!cost || !selling) return '';
    const costNum = parseFloat(cost);
    const sellingNum = parseFloat(selling);
    if (isNaN(costNum) || isNaN(sellingNum) || costNum === 0) return '';
    const margin = ((sellingNum - costNum) / costNum) * 100;
    return margin.toFixed(2);
  };

  const handlePriceChange = (field: 'original_price' | 'selling_price' | 'profit_margin', value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'original_price') {
        // If cost price changes, recalculate profit margin
        if (prev.selling_price) {
          const margin = calculateProfitMargin(value, prev.selling_price);
          if (margin) {
            newData.profit_margin = margin;
          }
        }
      } else if (field === 'selling_price') {
        // If selling price changes, recalculate profit margin
        if (prev.original_price) {
          const margin = calculateProfitMargin(prev.original_price, value);
          if (margin) {
            newData.profit_margin = margin;
          }
        }
      } else if (field === 'profit_margin') {
        // If profit margin changes, recalculate selling price
        if (prev.original_price) {
          newData.selling_price = calculateSellingPrice(prev.original_price, value);
        }
      }
      
      return newData;
    });
  };

  const loadProduct = async () => {
    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (productError) throw productError;

      if (product) {
        const profitMargin = calculateProfitMargin(
          product.original_price?.toString() || '0',
          product.selling_price.toString()
        );

        setFormData({
          name_en: product.name_en || '',
          name_fr: product.name_fr || '',
          name_ar: product.name_ar || '',
          description_en: product.description_en || '',
          description_fr: product.description_fr || '',
          description_ar: product.description_ar || '',
          original_price: product.original_price?.toString() || '0',
          selling_price: product.selling_price.toString(),
          discount: product.discount?.toString() || '',
          categoryId: product.category_id || (categories.length > 0 ? categories[0].id : ''),
          gender: product.gender || 'unisex',
          material: product.material || '',
          brand: product.brand || '',
          is_active: product.is_active ?? true,
          profit_margin: profitMargin,
        });
        setImageUrls(product.images || []);

        // Load product variants
        const { data: variants, error: variantsError } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', id);

        if (variantsError) throw variantsError;
        if (variants) {
          setVariants(variants);
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error('Failed to load product: ' + errorMessage);
      navigate('/admin/products');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of selectedImages) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const addVariant = () => {
    setVariants(prev => [...prev, {
      size: '',
      color: '',
      stock: 0,
      sku: '',
      is_active: true
    }]);
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: string | number | boolean) => {
    if (field === 'sku') {
      // Check if the new SKU is already used by another variant
      const isDuplicate = variants.some((variant, i) => i !== index && variant.sku === value);
      if (isDuplicate) {
        toast.error('This SKU is already used by another variant');
        return;
      }
    }
    
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate unique SKUs
      const skus = variants.map(v => v.sku);
      const uniqueSkus = new Set(skus);
      if (skus.length !== uniqueSkus.size) {
        toast.error('Each variant must have a unique SKU');
        setLoading(false);
        return;
      }

      let finalImageUrls = [...imageUrls];

      if (selectedImages.length > 0) {
        const uploadedUrls = await uploadImages();
        finalImageUrls = [...finalImageUrls, ...uploadedUrls];
      }

      const productData = {
        name_en: formData.name_en,
        name_fr: formData.name_fr,
        name_ar: formData.name_ar,
        description_en: formData.description_en,
        description_fr: formData.description_fr,
        description_ar: formData.description_ar,
        original_price: parseFloat(formData.original_price),
        selling_price: parseFloat(formData.selling_price),
        discount: formData.discount !== '' ? parseFloat(formData.discount) : null,
        category_id: formData.categoryId,
        gender: formData.gender,
        material: formData.material,
        brand: formData.brand,
        images: finalImageUrls,
        is_active: formData.is_active,
      };

      let productId = id;

      if (id) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);

        if (error) throw error;
        toast.success('Product updated successfully');
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([{ ...productData, created_at: new Date().toISOString() }])
          .select()
          .single();

        if (error) throw error;
        productId = data.id;
        toast.success('Product created successfully');
      }

      // Handle variants
      if (productId) {
        // Delete existing variants if editing
        if (id) {
          await supabase
            .from('product_variants')
            .delete()
            .eq('product_id', id);
        }

        // Insert new variants
        const variantsToInsert = variants.map(variant => ({
          product_id: productId,
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
          sku: variant.sku,
          is_active: variant.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        if (variantsToInsert.length > 0) {
          const { error: variantsError } = await supabase
            .from('product_variants')
            .insert(variantsToInsert);

          if (variantsError) {
            if (variantsError.code === '23505') {
              toast.error('One or more SKUs already exist. Please use unique SKUs for each variant.');
            } else {
              throw variantsError;
            }
            return;
          }
        }
      }

      navigate('/admin/products');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error('Failed to save product: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/products')}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <h1 className="text-2xl font-bold">
            {id ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name_en">Product Name (English)</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="name_fr">Product Name (French)</Label>
                <Input
                  id="name_fr"
                  value={formData.name_fr}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_fr: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="name_ar">Product Name (Arabic)</Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="description_en">Description (English)</Label>
                <Textarea
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description_fr">Description (French)</Label>
                <Textarea
                  id="description_fr"
                  value={formData.description_fr}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_fr: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="description_ar">Description (Arabic)</Label>
                <Textarea
                  id="description_ar"
                  value={formData.description_ar}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_ar: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="unisex">Unisex</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  value={formData.material}
                  onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="original_price">Cost Price</Label>
                  <Input
                    id="original_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.original_price}
                    onChange={(e) => handlePriceChange('original_price', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="selling_price">Selling Price</Label>
                  <Input
                    id="selling_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.selling_price}
                    onChange={(e) => handlePriceChange('selling_price', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="profit_margin">Profit Margin (%)</Label>
                  <Input
                    id="profit_margin"
                    type="number"
                    step="0.01"
                    value={formData.profit_margin}
                    onChange={(e) => handlePriceChange('profit_margin', e.target.value)}
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="is_active">Status</Label>
                <Select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'active' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Product Images</Label>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Product ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImageUrl(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {selectedImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Selected ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <label className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-ecommerce-purple transition-colors">
                    <div className="text-center">
                      <Upload className="h-6 w-6 mx-auto text-gray-400" />
                      <span className="mt-2 text-sm text-gray-500">Upload Image</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </label>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Product Variants</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVariant}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Variant
                  </Button>
                </div>
                <div className="space-y-4">
                  {variants.map((variant, index) => (
                    <div key={index} className="p-4 border rounded-md space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Variant {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariant(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Size</Label>
                          <Input
                            value={variant.size}
                            onChange={(e) => updateVariant(index, 'size', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label>Color</Label>
                          <Input
                            value={variant.color}
                            onChange={(e) => updateVariant(index, 'color', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label>Stock</Label>
                          <Input
                            type="number"
                            min="0"
                            value={variant.stock}
                            onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value))}
                            required
                          />
                        </div>
                        <div>
                          <Label>SKU</Label>
                          <Input
                            value={variant.sku}
                            onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/products')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-ecommerce-purple hover:bg-ecommerce-deep-purple"
              disabled={loading}
            >
              {loading ? 'Saving...' : id ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default ProductUpsertPage; 