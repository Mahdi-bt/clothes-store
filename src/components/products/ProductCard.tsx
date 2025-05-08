import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { Button } from '@/components/ui/button';
import { ShoppingCart, BadgePercent } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product & { name?: string; description?: string };
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  const { t } = useTranslation();
  
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group">
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[4/3] bg-ecommerce-soft-gray overflow-hidden">
          <img
            src={product.images[0] || '/placeholder.svg'}
            alt={product.name || product.name_en}
            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-300"
          />
          {product.discount && product.discount > 0 && (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
              <BadgePercent size={12} />
              -{product.discount}%
            </div>
          )}
          {product.original_price > product.selling_price && (
            <div className="absolute top-2 right-2 bg-ecommerce-purple text-white text-xs font-bold px-1.5 py-0.5 rounded-md shadow-sm">
              {Math.round((1 - product.selling_price / product.original_price) * 100)}% OFF
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-3">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-sm font-medium mb-2 text-gray-800 group-hover:text-ecommerce-purple transition-colors line-clamp-1">
            {product.name || product.name_en}
          </h3>
        </Link>
        
        <div className="flex justify-end">
          <Button
            onClick={(e) => {
              e.preventDefault();
              // Ensure the product has at least one variant
              if (product.variants && product.variants.length > 0) {
                const variant = product.variants[0]; // Use the first variant as default
                addItem({
                  productId: product.id,
                  variantId: variant.id,
                  quantity: 1,
                  size: variant.size,
                  color: variant.color
                });
              } else {
                toast.error(t('product.error.noVariants'));
              }
            }}
            size="sm"
            className="relative overflow-hidden bg-gradient-to-r from-ecommerce-purple to-ecommerce-deep-purple text-white text-xs font-medium shadow-sm transition-all duration-300 rounded-full px-4 py-1.5 hover:shadow-md hover:scale-105 group/btn"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="font-semibold">{t('common.addToCart')}</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-ecommerce-deep-purple to-ecommerce-purple opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
