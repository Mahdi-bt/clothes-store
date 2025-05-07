import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import { useCart } from '../context/CartContext';
import { Button } from '@/components/ui/button';
import ProductGrid from '../components/products/ProductGrid';
import { ShoppingCart, ChevronLeft, ChevronRight, MinusCircle, PlusCircle, BadgePercent, Tag, Info } from 'lucide-react';
import { productService } from '../lib/services/productService';
import { categoryService } from '../lib/services/categoryService';
import { Product, Category, ProductVariant } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import './ProductPage.css';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const { addItem, clearCart } = useCart();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [variants, setVariants] = useState<Array<ProductVariant>>([]);
  
  const autoScrollInterval = 5000; // 5 seconds between slides

  const handlePrevImage = useCallback(() => {
    setSelectedImage((prev) => (prev > 0 ? prev - 1 : (product?.images.length || 1) - 1));
  }, [product?.images.length]);

  const handleNextImage = useCallback(() => {
    setSelectedImage((prev) => (prev < ((product?.images.length || 1) - 1) ? prev + 1 : 0));
  }, [product?.images.length]);

  // Auto-scroll effect
  useEffect(() => {
    if (!product?.images.length || !isAutoScrolling) return;

    const interval = setInterval(() => {
      handleNextImage();
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [product?.images.length, isAutoScrolling, handleNextImage]);

  // Pause auto-scroll on hover
  const handleMouseEnter = () => setIsAutoScrolling(false);
  const handleMouseLeave = () => setIsAutoScrolling(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (id) {
          // Fetch product data
          const fetchedProduct = await productService.getProductById(id);
          setProduct(fetchedProduct);
          
          if (fetchedProduct) {
            // Fetch category data
            const fetchedCategory = await categoryService.getCategoryById(fetchedProduct.category_id);
            setCategory(fetchedCategory);

            // Fetch related products
            const related = await productService.getProductsByCategory(fetchedProduct.category_id);
            setRelatedProducts(related.filter(p => p.id !== id).slice(0, 4));

            // Fetch product variants
            const { data: productVariants } = await supabase
              .from('product_variants')
              .select('*')
              .eq('product_id', id)
              .eq('is_active', true);

            if (productVariants && productVariants.length > 0) {
              setVariants(productVariants);
              setSelectedVariant(productVariants[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);
  
  // Scroll to top when product id changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  
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
  
  if (!product) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <p className="mb-6">The product you are looking for doesn't exist or has been removed.</p>
          <Link to="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }
  
  // Calculate discounted price if applicable
  const finalPrice = product.selling_price;
  
  const handleAddToCart = () => {
    if (!product || !selectedVariant) {
      toast.error(t('product.error.selectVariant'));
      return;
    }

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      quantity,
      size: selectedVariant.size,
      color: selectedVariant.color
    });
  };
  
  const handleInstantPurchase = async () => {
    if (!product || !selectedVariant) {
      toast.error(t('product.error.selectVariant'));
      return;
    }

    await clearCart();
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      quantity,
      size: selectedVariant.size,
      color: selectedVariant.color
    });
    navigate('/checkout');
  };

  // Helper to get localized product/category fields
  const getLocalizedProductField = (field: 'name' | 'description') => {
    const lang = i18n.language;
    if (!product) return '';
    if (field === 'name') return product[`name_${lang}`] || product.name_en;
    if (field === 'description') return product[`description_${lang}`] || product.description_en;
    return '';
  };

  const getLocalizedCategoryName = () => {
    const lang = i18n.language;
    if (!category) return '';
    return category[`name_${lang}`] || category.name_en;
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Breadcrumbs */}
        <nav className="mb-4 sm:mb-8">
          <ol className="flex text-xs sm:text-sm flex-wrap gap-1">
            <li className="text-gray-400">
              <Link to="/" className="hover:text-ecommerce-purple font-medium transition-colors">Home</Link>
            </li>
            <li className="mx-2 text-gray-300">/</li>
            <li className="text-gray-400">
              <Link to={`/category/${category?.id}`} className="hover:text-ecommerce-purple font-medium transition-colors">
                {getLocalizedCategoryName()}
              </Link>
            </li>
            <li className="mx-2 text-gray-300">/</li>
            <li className="text-ecommerce-purple font-semibold truncate">{getLocalizedProductField('name')}</li>
          </ol>
        </nav>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-16 items-start">
          {/* Product Images */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex gap-3 sm:gap-4">
              {/* Thumbnail Images */}
              {product.images.length > 1 && (
                <div className="flex flex-col gap-2 sm:gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedImage(index);
                        setIsAutoScrolling(false);
                      }}
                      className={`relative aspect-square w-16 sm:w-20 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                        selectedImage === index 
                          ? 'ring-2 border-ecommerce-purple scale-105 shadow-lg' 
                          : 'hover:border-ecommerce-purple'
                      }`}
                    >
                      <img
                        src={image || '/placeholder.svg'}
                        alt={`${getLocalizedProductField('name')} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image */}
              <div 
                className="relative flex-1 bg-gray-100 rounded-xl sm:rounded-2xl overflow-hidden aspect-square shadow-lg sm:shadow-xl group border border-gray-200"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedImage}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="zoom-container"
                  >
                    <img
                      src={product.images[selectedImage] || '/placeholder.svg'}
                      alt={getLocalizedProductField('name')}
                      className="w-full h-full object-contain zoom-image"
                    />
                    {/* Discount badge */}
                    {product.discount && product.discount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg flex items-center gap-1"
                      >
                        <BadgePercent size={14} className="sm:w-4 sm:h-4" />
                        -{product.discount}%
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
                
                {product.original_price > product.selling_price && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-ecommerce-purple text-white text-xs sm:text-sm font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md shadow-md"
                  >
                    {Math.round((1 - product.selling_price / product.original_price) * 100)}% OFF
                  </motion.div>
                )}
                
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={() => {
                        handlePrevImage();
                        setIsAutoScrolling(false);
                      }}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 sm:p-2 shadow-md hover:bg-white transition-colors"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => {
                        handleNextImage();
                        setIsAutoScrolling(false);
                      }}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 sm:p-2 shadow-md hover:bg-white transition-colors"
                      aria-label="Next image"
                    >
                      <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Product Details */}
          <div className="space-y-6 sm:space-y-8 bg-white/80 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl border border-gray-100 p-4 sm:p-8">
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight leading-tight drop-shadow-sm">{getLocalizedProductField('name')}</h1>
              <div className="mt-1 flex items-center gap-2">
                <Tag size={16} className="text-ecommerce-purple sm:w-[18px] sm:h-[18px]" />
                <Link to={`/category/${category?.id}`} className="text-sm sm:text-base text-ecommerce-purple hover:underline font-medium">
                  {getLocalizedCategoryName()}
                </Link>
              </div>
            </div>
            
            {/* Product Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 shadow-sm">
              {product.gender && (
                <div className="flex flex-col items-start gap-1.5 p-3 bg-white rounded-lg border border-gray-100 hover:border-ecommerce-purple transition-all duration-200 group">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('attributes.gender')}</span>
                  <span className="text-sm font-semibold text-gray-900 capitalize group-hover:text-ecommerce-purple transition-colors">
                    {product.gender}
                  </span>
                </div>
              )}
              {product.material && (
                <div className="flex flex-col items-start gap-1.5 p-3 bg-white rounded-lg border border-gray-100 hover:border-ecommerce-purple transition-all duration-200 group">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('attributes.material')}</span>
                  <span className="text-sm font-semibold text-gray-900 group-hover:text-ecommerce-purple transition-colors">
                    {product.material}
                  </span>
                </div>
              )}
              {product.brand && (
                <div className="flex flex-col items-start gap-1.5 p-3 bg-white rounded-lg border border-gray-100 hover:border-ecommerce-purple transition-all duration-200 group">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('attributes.brand')}</span>
                  <span className="text-sm font-semibold text-gray-900 group-hover:text-ecommerce-purple transition-colors">
                    {product.brand}
                  </span>
                </div>
              )}
            </div>

            {/* Product Variants */}
            {variants.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">{t('product.variants.title')}</h3>
                
                {/* Size Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{t('product.variants.size')}</label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(variants.map(v => v.size))).map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          const variant = variants.find(v => v.size === size && v.color === selectedVariant?.color) || variants.find(v => v.size === size);
                          setSelectedVariant(variant || null);
                        }}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          selectedVariant?.size === size
                            ? 'bg-ecommerce-purple text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{t('product.variants.color')}</label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(variants.map(v => v.color))).map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          const variant = variants.find(v => v.color === color && v.size === selectedVariant?.size) || variants.find(v => v.color === color);
                          setSelectedVariant(variant || null);
                        }}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          selectedVariant?.color === color
                            ? 'bg-ecommerce-purple text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Information */}
                {selectedVariant && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{t('product.variants.stock')}:</span>
                      <span className={`text-sm font-semibold ${selectedVariant.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedVariant.stock > 0 ? `${selectedVariant.stock} ${t('product.variants.inStock')}` : t('product.variants.outOfStock')}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      SKU: {selectedVariant.sku}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-end gap-3 sm:gap-4">
              {product.discount && product.discount > 0 ? (
                <div className="flex items-center gap-2 sm:gap-3 animate-fade-in">
                  <span className="text-2xl sm:text-3xl font-bold text-ecommerce-purple">
                    TND {(product.selling_price * (1 - product.discount / 100)).toFixed(2)}
                  </span>
                  <span className="text-base sm:text-lg text-gray-500 line-through">
                    TND {product.selling_price.toFixed(2)}
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-green-600">
                    -{product.discount}%
                  </span>
                </div>
              ) : (
                <span className="text-2xl sm:text-3xl font-bold text-ecommerce-purple">
                  TND {product.selling_price.toFixed(2)}
                </span>
              )}
            </div>
            
            {/* Enhanced Product Description */}
            <div className="product-description-section animate-fade-in">
              <p className="text-gray-700 leading-relaxed text-base sm:text-lg font-medium whitespace-pre-line">
                {getLocalizedProductField('description')}
              </p>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 mb-1">
                  {t('cart.quantity')}
                </label>
                <div className="flex items-center w-28 sm:w-36 bg-gray-100 rounded-lg px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-gray-500 hover:text-ecommerce-purple transition-colors"
                  >
                    <MinusCircle size={20} className="sm:w-[22px] sm:h-[22px]" />
                  </button>
                  <input
                    type="number"
                    id="quantity"
                    className="mx-2 border-none text-center w-full bg-transparent text-base sm:text-lg font-semibold"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="text-gray-500 hover:text-ecommerce-purple transition-colors"
                  >
                    <PlusCircle size={20} className="sm:w-[22px] sm:h-[22px]" />
                  </button>
                </div>
              </div>
              {/* Instantly Purchase Button */}
              <Button 
                onClick={handleInstantPurchase}
                size="lg"
                className="w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold shadow-lg transition-all rounded-full scale-100 hover:scale-105 duration-150 text-sm sm:text-base py-5 sm:py-6"
              >
                <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                {t('common.instantlyPurchase')}
              </Button>
              {/* Add to Cart Button */}
              <Button 
                onClick={handleAddToCart}
                size="lg" 
                className="w-full bg-gradient-to-r from-ecommerce-purple to-ecommerce-deep-purple hover:from-ecommerce-deep-purple hover:to-ecommerce-purple text-white font-bold shadow-lg transition-all rounded-full scale-100 hover:scale-105 duration-150 text-sm sm:text-base py-5 sm:py-6"
              >
                <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                {t('common.addToCart')}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 sm:mt-20 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl py-6 sm:py-10 px-4 md:px-10 shadow-inner">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Tag size={20} className="text-ecommerce-purple sm:w-6 sm:h-6" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">{t('product.relatedProducts')}</h2>
            </div>
            <ProductGrid products={relatedProducts} />
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ProductPage;
