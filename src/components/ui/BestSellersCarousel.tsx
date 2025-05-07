import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '@/types';
import { productService } from '@/lib/services/productService';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import ProductCard from '@/components/products/ProductCard';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

interface LocalizedProduct extends Product {
  name?: string;
  description?: string;
}

type SupabaseOrderItem = {
  quantity: number;
  product_variant: {
    id: string;
    product: Product;
  };
  order: {
    status: string;
  };
};

const BestSellersCarousel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = React.useState<LocalizedProduct[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [api, setApi] = React.useState<CarouselApi>();
  const autoplayRef = useRef<NodeJS.Timeout>();

  const autoplay = useCallback(() => {
    if (api) {
      api.scrollNext();
    }
  }, [api]);

  useEffect(() => {
    if (api) {
      // Start autoplay
      autoplayRef.current = setInterval(autoplay, 3000); // Change slide every 3 seconds

      // Pause autoplay on hover
      const carouselElement = document.querySelector('.carousel-container');
      if (carouselElement) {
        carouselElement.addEventListener('mouseenter', () => {
          if (autoplayRef.current) {
            clearInterval(autoplayRef.current);
          }
        });

        carouselElement.addEventListener('mouseleave', () => {
          autoplayRef.current = setInterval(autoplay, 3000);
        });
      }
    }

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [api, autoplay]);

  React.useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        // Fetch order items with their product variants and products
        const { data: orderItems, error } = await supabase
          .from('order_items')
          .select(`
            quantity,
            product_variant:product_variants(
              id,
              product:products(
                id,
                name_en,
                name_fr,
                name_ar,
                description_en,
                description_fr,
                description_ar,
                selling_price,
                discount,
                images,
                category_id,
                is_active,
                variants:product_variants(*)
              )
            ),
            order:orders!inner(
              status
            )
          `)
          .eq('order.status', 'completed');

        if (error) throw error;

        // Calculate total quantity sold for each product
        const productSales = ((orderItems || []) as unknown as SupabaseOrderItem[]).reduce((acc, item) => {
          if (!item.product_variant?.product) return acc;
          
          const productId = item.product_variant.product.id;
          if (!acc[productId]) {
            acc[productId] = {
              product: item.product_variant.product,
              totalSold: 0
            };
          }
          acc[productId].totalSold += item.quantity;
          return acc;
        }, {} as Record<string, { product: Product; totalSold: number }>);

        // Convert to array and sort by total sold
        const bestSellers = Object.values(productSales)
          .sort((a, b) => b.totalSold - a.totalSold)
          .slice(0, 8)
          .map(item => item.product);

        setProducts(bestSellers);
        console.log('Best sellers:', bestSellers);
      } catch (error) {
        console.error('Error fetching best sellers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-72 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!loading && products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">{t('home.noProductsFound')}</p>
      </div>
    );
  }

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="py-16 bg-gradient-to-b from-white to-gray-50"
    >
      <div className="container mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-4xl font-bold text-center mb-4 text-gray-800"
        >
          {t('home.bestSellers')}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center text-gray-600 mb-12 max-w-2xl mx-auto"
        >
          {t('home.bestSellersSubtitle')}
        </motion.p>
        
        <div className="relative carousel-container">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
              skipSnaps: false,
              dragFree: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {products.map((product, index) => {
                const lang = i18n.language;
                const localizedName = product[`name_${lang}`] || product.name_en;
                const localizedDescription = product[`description_${lang}`] || product.description_en;
                return (
                  <CarouselItem 
                    key={product.id} 
                    className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="h-full"
                    >
                      <ProductCard product={{ ...product, name: localizedName, description: localizedDescription }} />
                    </motion.div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            
            <div className="absolute -top-12 right-0 flex gap-2">
              <CarouselPrevious className="relative static h-10 w-10 rounded-full border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200" />
              <CarouselNext className="relative static h-10 w-10 rounded-full border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200" />
            </div>
          </Carousel>
        </div>
      </div>
    </motion.section>
  );
};

export default BestSellersCarousel; 