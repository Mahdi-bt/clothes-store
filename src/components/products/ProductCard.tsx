import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { Button } from '@/components/ui/button';
import { CardPrice } from '@/components/ui/card';
import { ShoppingCart, BadgePercent, TrendingUp, Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductCardProps {
  product: Product & { name?: string; description?: string };
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const discountedPrice = product.discount 
    ? (product.selling_price * (1 - product.discount / 100)).toFixed(2)
    : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
    >
      {/* Favorite Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => setIsFavorite(!isFavorite)}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-300"
      >
        <Heart 
          size={20} 
          className={`transition-colors duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
        />
      </motion.button>

      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          <motion.img
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            src={product.images[0] || '/placeholder.svg'}
            alt={product.name || product.name_en}
            className="w-full h-full object-cover object-center"
          />
          
          {/* Discount Badge */}
          {product.discount && product.discount > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 backdrop-blur-sm"
            >
              <BadgePercent size={16} />
              <span className="font-bold tracking-wide">-{product.discount}%</span>
            </motion.div>
          )}

          {/* Best Deal Badge */}
          {product.original_price > product.selling_price && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bottom-3 left-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 backdrop-blur-sm"
            >
              <TrendingUp size={16} />
              <span className="font-bold tracking-wide">Best Deal</span>
            </motion.div>
          )}

          {/* Quick View Overlay */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center"
              >
                <motion.span
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-white font-medium text-sm bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full"
                >
                  Quick View
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>
      
      <div className="p-5">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-base font-semibold mb-2 text-gray-800 group-hover:text-ecommerce-purple transition-colors line-clamp-1">
            {product.name || product.name_en}
          </h3>
        </Link>
        
        {/* Price Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4 flex items-end gap-3"
        >
          {discountedPrice ? (
            <>
              <CardPrice className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                TND {discountedPrice}
              </CardPrice>
              <span className="text-sm text-gray-400 line-through">
                TND {product.selling_price.toFixed(2)}
              </span>
            </>
          ) : (
            <CardPrice className="text-2xl font-bold text-gray-800">
              TND {product.selling_price.toFixed(2)}
            </CardPrice>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end"
        >
          <Button
            onClick={(e) => {
              e.preventDefault();
              if (product.variants && product.variants.length > 0) {
                const variant = product.variants[0];
                addItem({
                  productId: product.id,
                  variantId: variant.id,
                  quantity: 1,
                  size: variant.size,
                  color: variant.color
                });
                toast.success(t('common.addedToCart'));
              } else {
                toast.error(t('product.error.noVariants'));
              }
            }}
            size="sm"
            className="relative overflow-hidden bg-gradient-to-r from-ecommerce-purple to-ecommerce-deep-purple text-white text-sm font-medium shadow-sm transition-all duration-300 rounded-full px-6 py-2.5 hover:shadow-md hover:scale-105 group/btn"
          >
            <span className="relative z-10 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span className="font-semibold">{t('common.addToCart')}</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-ecommerce-deep-purple to-ecommerce-purple opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
