import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import { useCart } from '../context/CartContext';
import { Button } from '@/components/ui/button';
import { MinusCircle, PlusCircle, Trash2, ShoppingCart, AlertCircle } from 'lucide-react';
import { productService } from '../lib/services/productService';
import { deliveryService } from '../lib/services/deliveryService';
import { Product, ProductVariant } from '../types';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  size: string;
  color: string;
}

const CartPage = () => {
  const { t, i18n } = useTranslation();
  const { items, removeItem, updateQuantity, clearCart, subtotal, deliveryCost, total } = useCart();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [variants, setVariants] = useState<Record<string, ProductVariant>>({});
  const [loading, setLoading] = useState(true);
  const [stockWarnings, setStockWarnings] = useState<Record<string, boolean>>({});
  const [shippingCost, setShippingCost] = useState(0);

  // Add a function to safely format currency
  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return 'TND 0.00';
    }
    return `TND ${Number(amount).toFixed(2)}`;
  };

  // Calculate safe subtotal with variant support
  const safeSubtotal = React.useMemo(() => {
    if (!items.length || !Object.keys(products).length) return 0;
    return items.reduce((total, item) => {
      const product = products[item.productId];
      const variant = variants[item.variantId];
      if (!product || !variant) return total;
      
      const price = product.discount 
        ? product.selling_price - (product.selling_price * (product.discount / 100))
        : product.selling_price;
      
      return total + (price * item.quantity);
    }, 0);
  }, [items, products, variants]);

  // Calculate shipping cost using deliveryService
  useEffect(() => {
    const calculateShipping = async () => {
      const cost = await deliveryService.calculateDeliveryCost(safeSubtotal);
      setShippingCost(cost);
    };
    calculateShipping();
  }, [safeSubtotal]);

  // Calculate total including delivery cost
  const safeTotal = React.useMemo(() => {
    return safeSubtotal + shippingCost;
  }, [safeSubtotal, shippingCost]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const allProducts = await productService.getProducts();
        const productsMap = allProducts.reduce((acc, product) => {
          acc[product.id] = product;
          return acc;
        }, {} as Record<string, Product>);
        setProducts(productsMap);

        // Fetch variants for all products
        const variantsMap: Record<string, ProductVariant> = {};
        for (const product of allProducts) {
          const productVariants = await productService.getProductVariants(product.id);
          productVariants.forEach(variant => {
            variantsMap[variant.id] = variant;
          });
        }
        setVariants(variantsMap);

        // Check stock warnings
        const warnings: Record<string, boolean> = {};
        items.forEach(item => {
          const variant = variantsMap[item.variantId];
          if (variant && item.quantity > variant.stock) {
            warnings[item.variantId] = true;
          }
        });
        setStockWarnings(warnings);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error(t('cart.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [t, items]);
  
  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <ShoppingCart size={64} className="mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-bold mb-4">{t('cart.emptyCart.title')}</h2>
            <p className="text-gray-600 mb-8">
              {t('cart.emptyCart.message')}
            </p>
            <Link to="/">
              <Button className="bg-ecommerce-purple hover:bg-ecommerce-deep-purple">
                {t('common.continueShopping')}
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('cart.title')}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="hidden md:flex border-b pb-4 mb-4 text-sm font-semibold text-gray-500">
                <div className="w-2/5">{t('cart.product')}</div>
                <div className="w-1/5 text-center">{t('cart.price')}</div>
                <div className="w-1/5 text-center">{t('cart.quantity')}</div>
                <div className="w-1/5 text-center">{t('cart.total')}</div>
              </div>
              
              <div className="space-y-4">
                {items.map((item) => {
                  const product = products[item.productId];
                  const variant = variants[item.variantId];
                  if (!product || !variant) return null;

                  const finalPrice = product.discount
                    ? product.selling_price - (product.selling_price * (product.discount / 100))
                    : product.selling_price;
                  
                  const isLowStock = variant.stock < 5;
                  const isOutOfStock = variant.stock === 0;
                  
                  return (
                    <div key={item.variantId} className="flex flex-col md:flex-row items-center py-4 border-b">
                      {/* Product Info - Mobile & Desktop */}
                      <div className="w-full md:w-2/5 flex items-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden mr-4">
                          <img
                            src={product.images[0] || '/placeholder.svg'}
                            alt={product[`name_${i18n.language}`] || product.name_en}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <Link 
                            to={`/product/${item.productId}`}
                            className="font-medium text-gray-800 hover:text-ecommerce-purple"
                          >
                            {product[`name_${i18n.language}`] || product.name_en}
                          </Link>
                          <div className="text-sm text-gray-500 mt-1">
                            <span className="mr-2">{t('cart.size')}: {variant.size}</span>
                            <span>{t('cart.color')}: {variant.color}</span>
                          </div>
                          {product.brand && (
                            <Badge variant="secondary" className="mt-1">
                              {product.brand}
                            </Badge>
                          )}
                          {product.material && (
                            <span className="text-xs text-gray-500 block mt-1">
                              {t('cart.material')}: {product.material}
                            </span>
                          )}
                          {isLowStock && !isOutOfStock && (
                            <div className="text-yellow-600 text-sm mt-1 flex items-center">
                              <AlertCircle size={14} className="mr-1" />
                              {t('cart.lowStock', { count: variant.stock })}
                            </div>
                          )}
                          {isOutOfStock && (
                            <div className="text-red-600 text-sm mt-1 flex items-center">
                              <AlertCircle size={14} className="mr-1" />
                              {t('cart.outOfStock')}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Mobile Layout - Price, Quantity, Total */}
                      <div className="w-full md:hidden flex justify-between items-center mt-4 text-sm">
                        <div>
                          <div className="font-semibold text-gray-500">Price</div>
                          <div className="font-bold text-ecommerce-deep-purple">
                            {formatCurrency(finalPrice)}
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-semibold text-gray-500">Quantity</div>
                          <div className="flex items-center mt-1">
                            <button
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                              className="text-gray-500 hover:text-ecommerce-purple"
                              disabled={isOutOfStock}
                            >
                              <MinusCircle size={16} />
                            </button>
                            <span className="mx-2 w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                              className="text-gray-500 hover:text-ecommerce-purple"
                              disabled={isOutOfStock || item.quantity >= variant.stock}
                            >
                              <PlusCircle size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-semibold text-gray-500">Total</div>
                          <div className="font-bold text-ecommerce-deep-purple">
                            {formatCurrency(finalPrice * item.quantity)}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      {/* Desktop Layout - Price, Quantity, Total */}
                      <div className="hidden md:block w-1/5 text-center">
                        <span className="font-bold text-ecommerce-deep-purple">
                          {formatCurrency(finalPrice)}
                        </span>
                      </div>
                      
                      <div className="hidden md:flex w-1/5 items-center justify-center">
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                          className="text-gray-500 hover:text-ecommerce-purple"
                          disabled={isOutOfStock}
                        >
                          <MinusCircle size={18} />
                        </button>
                        <span className="mx-2 w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          className="text-gray-500 hover:text-ecommerce-purple"
                          disabled={isOutOfStock || item.quantity >= variant.stock}
                        >
                          <PlusCircle size={18} />
                        </button>
                      </div>
                      
                      <div className="hidden md:block w-1/5 text-center font-bold text-ecommerce-deep-purple">
                        {formatCurrency(finalPrice * item.quantity)}
                      </div>
                      
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="hidden md:block text-gray-500 hover:text-red-500 ml-4"
                        aria-label="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    clearCart();
                    toast.success(t('cart.success.cleared'));
                  }}
                  className="text-gray-600 hover:text-red-500 hover:border-red-500"
                >
                  {t('cart.clearCart')}
                </Button>
                
                <Link to="/">
                  <Button variant="outline" className="text-ecommerce-purple hover:border-ecommerce-purple">
                    {t('common.continueShopping')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4">{t('cart.orderSummary')}</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>{t('cart.subtotal')}</span>
                  <span>{formatCurrency(safeSubtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t('cart.shipping')}</span>
                  <span>
                    {shippingCost === 0 
                      ? t('cart.free') 
                      : formatCurrency(shippingCost)}
                  </span>
                </div>
                <div className="border-t pt-3 mt-3 flex justify-between font-bold text-lg">
                  <span>{t('cart.total')}</span>
                  <span className="text-ecommerce-deep-purple">{formatCurrency(safeTotal)}</span>
                </div>
              </div>
              
              <Link to="/checkout">
                <Button className="w-full bg-ecommerce-purple hover:bg-ecommerce-deep-purple transition-colors">
                  {t('common.proceedToCheckout')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CartPage;
