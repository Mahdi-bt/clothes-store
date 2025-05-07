import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, ShoppingCart } from 'lucide-react';
import { Product } from '@/types';
import { productService } from '@/lib/services/productService';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface LocalizedProduct extends Product {
  name?: string;
  description?: string;
}

interface ProductCarouselProps {
  title?: string;
  subtitle?: string;
  products?: LocalizedProduct[];
  loading?: boolean;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  title,
  subtitle,
  products: propProducts,
  loading: propLoading
}) => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<LocalizedProduct[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (propProducts) {
        setProducts(propProducts);
        setLoading(false);
        return;
      }

      try {
        const data = await productService.getProducts();
        const latestProducts = data
          .filter(product => product.images && product.images.length > 0)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        setProducts(latestProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [propProducts]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === products.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [products.length]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === products.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? products.length - 1 : prevIndex - 1
    );
  };

  const isLoading = propLoading !== undefined ? propLoading : loading;

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-ecommerce-purple via-purple-600 to-ecommerce-deep-purple min-h-[450px] flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">{t('home.loadingProducts')}</div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-gradient-to-br from-ecommerce-purple via-purple-600 to-ecommerce-deep-purple min-h-[450px] flex items-center justify-center">
        <div className="text-white text-xl">{t('home.noProductsAvailable')}</div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-ecommerce-purple via-purple-600 to-ecommerce-deep-purple overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Title Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 sm:mb-10"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4 tracking-tight">
              {title || t('home.newArrivals')}
            </h2>
          </div>
          <p className="text-gray-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed px-4">
            {subtitle || t('home.newArrivalsSubtitle')}
          </p>
        </motion.div>

        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all hover:scale-110"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all hover:scale-110"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Carousel Content */}
          <div className="relative h-[500px] sm:h-[400px]">
            <AnimatePresence mode="wait">
              {products.map((product, index) => (
                index === currentIndex && (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    <div className="flex flex-col md:flex-row items-center h-full gap-4 sm:gap-6">
                      <div className="w-full md:w-1/2 text-white p-4 sm:p-6 order-2 md:order-1">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-center md:text-left"
                        >
                          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 leading-tight">
                            {product.name || product.name_en}
                          </h2>
                          <p className="text-sm sm:text-base mb-4 sm:mb-6 text-gray-100 max-w-md mx-auto md:mx-0 leading-relaxed line-clamp-2 sm:line-clamp-none">
                            {product.description || product.description_en}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center md:justify-start">
                            <Button
                              asChild
                              className="bg-white text-ecommerce-purple hover:bg-gray-100 px-4 py-4 sm:py-5 text-sm sm:text-base font-semibold rounded-full transition-all hover:scale-105 w-full sm:w-auto"
                            >
                              <Link to={`/product/${product.id}`}>
                                {t('home.actions.viewDetails')}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              className="bg-ecommerce-purple text-white hover:bg-ecommerce-deep-purple px-4 py-4 sm:py-5 text-sm sm:text-base font-semibold rounded-full transition-all hover:scale-105 w-full sm:w-auto"
                            >
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              {t('home.actions.addToCart')}
                            </Button>
                          </div>
                        </motion.div>
                      </div>
                      <div className="w-full md:w-1/2 flex justify-center p-4 sm:p-6 order-1 md:order-2">
                        <Link 
                          to={`/product/${product.id}`}
                          className="relative w-full h-[250px] sm:h-[320px] rounded-xl overflow-hidden shadow-xl group cursor-pointer"
                        >
                          <motion.img
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5 }}
                            src={product.images[0]}
                            alt={product.name || product.name_en}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder.svg';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4 sm:p-6">
                            <span className="text-white text-base sm:text-lg font-semibold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                              {t('home.actions.viewProduct')}
                            </span>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-4 sm:mt-6 space-x-2">
            {products.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'w-6 bg-white' 
                    : 'w-1.5 bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCarousel; 