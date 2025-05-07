import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Pencil, Trash2 } from 'lucide-react';
import { productService } from '../../lib/services/productService';
import { categoryService } from '../../lib/services/categoryService';
import type { Product, Category } from '../../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslation } from 'react-i18next';

const ProductsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { i18n, t } = useTranslation();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [fetchedProducts, fetchedCategories] = await Promise.all([
          productService.getProducts(),
          categoryService.getCategories()
        ]);
        // Set default cost price to 0 for products that don't have it
        const productsWithCostPrice = fetchedProducts.map(product => ({
          ...product,
          original_price: product.original_price || 0
        }));
        setProducts(productsWithCostPrice);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Filter products based on search query
  const filteredProducts = products.filter(product => {
    const localizedName = product[`name_${i18n.language}`] || product.name_en;
    const localizedDescription = product[`description_${i18n.language}`] || product.description_en;
    return (
      localizedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      localizedDescription.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  
  const handleDelete = async (productId: string) => {
    if (window.confirm(t('admin.products.deleteConfirm'))) {
      try {
        await productService.deleteProduct(productId);
        setProducts(products.filter(p => p.id !== productId));
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 'Uncategorized';
    return category[`name_${i18n.language}`] || category.name_en;
  };

  const calculateProfitMargin = (originalPrice: number, sellingPrice: number) => {
    if (!originalPrice || originalPrice === 0) return '0%';
    const margin = ((sellingPrice - originalPrice) / originalPrice) * 100;
    return `${margin.toFixed(2)}%`;
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">{t('admin.products.title')}</h1>
          <Button 
            onClick={() => navigate('/admin/products/new')}
            className="bg-ecommerce-purple hover:bg-ecommerce-deep-purple"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {t('admin.products.addNew')}
          </Button>
        </div>
        
        <div className="flex items-center w-full sm:w-80">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder={t('admin.products.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="bg-white rounded-md shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.products.table.product')}</TableHead>
                    <TableHead>{t('admin.products.table.category')}</TableHead>
                    <TableHead>{t('admin.products.table.costPrice')}</TableHead>
                    <TableHead>{t('admin.products.table.sellingPrice')}</TableHead>
                    <TableHead>{t('admin.products.table.profitMargin')}</TableHead>
                    <TableHead>{t('admin.products.table.discount')}</TableHead>
                    <TableHead className="text-right">{t('admin.products.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden">
                            <img 
                              src={product.images[0] || '/placeholder.svg'} 
                              alt={product[`name_${i18n.language}`] || product.name_en}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span>{product[`name_${i18n.language}`] || product.name_en}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCategoryName(product.category_id)}
                      </TableCell>
                      <TableCell>TND{product.original_price?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>TND{product.selling_price.toFixed(2)}</TableCell>
                      <TableCell>
                        {calculateProfitMargin(product.original_price || 0, product.selling_price)}
                      </TableCell>
                      <TableCell>
                        {product.discount !== null && product.discount !== undefined ? `${product.discount}%` : '0%'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">{t('admin.products.noProducts')}</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProductsPage;
