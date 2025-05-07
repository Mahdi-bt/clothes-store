import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import MainLayout from '../components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { productService } from '../lib/services/productService';
import { deliveryService } from '../lib/services/deliveryService';
import { Product } from '../types';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

const TUNISIA_STATES = [
  {
    name: 'Tunis',
    delegations: ['Bab Bhar', 'Bab Souika', 'Carthage', 'El Kabaria', 'El Menzah', 'El Omrane', 'El Omrane Supérieur', 'El Ouardia', 'Ettahrir', 'Ezzouhour', 'La Goulette', 'La Marsa', 'Le Bardo', 'Médina', 'Sidi El Béchir', 'Sidi Hassine', 'Séjoumi']
  },
  {
    name: 'Ariana',
    delegations: ['Ariana Ville', 'Ettadhamen', 'Kalaat el-Andalous', 'La Soukra', 'Mnihla', 'Raoued', 'Sidi Thabet']
  },
  {
    name: 'Sfax',
    delegations: ['Sfax Ville', 'Sakiet Eddaier', 'Sakiet Ezzit', 'Thyna', 'Gremda', 'El Ain', 'Chihia', 'Agareb', 'Jebeniana', 'El Amra', 'Menzel Chaker', 'Skhira', 'Mahres', 'Bir Ali Ben Khalifa']
  },
  {
    name: 'Béja',
    delegations: ['Amdoun', 'Béja Nord', 'Béja Sud', 'Goubellat', 'Mejez El Bab', 'Nefza', 'Teboursouk', 'Testour', 'Thibar']
  },
  {
    name: 'Ben Arous',
    delegations: ['Ben Arous', 'Boumhel', 'El Mourouj', 'Ezzahra', 'Fouchana', 'Hammam Chott', 'Hammam Lif', 'MHamdia', 'Medina Jedida', 'Megrine', 'Mornag', 'Rades']
  },
  {
    name: 'Bizerte',
    delegations: ['Bizerte Nord', 'Bizerte Sud', 'Djoumime', 'El Alia', 'Ghar El Melh', 'Ghezala', 'Mateur', 'Menzel Bourguiba', 'Menzel Jemil', 'Ras Jebel', 'Sejenane', 'Tinja', 'Utique', 'Zarzouna']
  },
  {
    name: 'Gabès',
    delegations: ['Gabès Medina', 'Gabès Ouest', 'Gabès Sud', 'Ghannouch', 'Hamma', 'Mareth', 'Matmata', 'Nouvelle Matmata', 'Menzel Habib', 'Métouia']
  },
  {
    name: 'Gafsa',
    delegations: ['Belkhir', 'Gafsa Nord', 'Gafsa Sud', 'Guetar', 'Ksar', 'Mdhilla', 'Métlaoui', 'Oum Larais', 'Redeyef', 'Sened', 'Sidi Aïch']
  },
  {
    name: 'Jendouba',
    delegations: ['Aïn Draham', 'Balta', 'Bou Salem', 'Fernana', 'Ghardimaou', 'Jendouba', 'Jendouba Nord', 'Oued Mliz', 'Tabarka']
  },
  {
    name: 'Kairouan',
    delegations: ['Alaa', 'Bouhajla', 'Chebika', 'Chrarda', 'Haffouz', 'Hajeb El Ayoun', 'Kairouan Nord', 'Kairouan Sud', 'Nasrallah', 'Oueslatia', 'Sbikha']
  },
  {
    name: 'Kasserine',
    delegations: ['Ayoun', 'Ezzouhour', 'Feriana', 'Foussana', 'Hassi El Ferid', 'Hidra', 'Jedeliane', 'Kasserine Nord', 'Kasserine Sud', 'Majel Belabbes', 'Sbeitla', 'Sbiba', 'Thala']
  },
  {
    name: 'Kebili',
    delegations: ['Douz Nord', 'Douz Sud', 'Faouar', 'Kebili Nord', 'Kebili Sud', 'Souk El Ahed']
  },
  {
    name: 'Kef',
    delegations: ['Dahmani', 'Es Sers', 'Jerissa', 'Kalaa Khasbat', 'Kalaat Senane', 'Kef Est', 'Kef Ouest', 'Ksour', 'Nebeur', 'Sakiet Sidi Youssef', 'Tajerouine']
  },
  {
    name: 'Mahdia',
    delegations: ['Boumerdes', 'Chebba', 'Chorbane', 'El Djem', 'Hbira', 'Ksour Essef', 'Mahdia', 'Melloulech', 'Ouled Chamekh', 'Sidi Alouane', 'Souassi']
  },
  {
    name: 'Manouba',
    delegations: ['Borj El Amri', 'Douar Hicher', 'El Battan', 'Jedaida', 'Manouba', 'Mornaguia', 'Oued Ellil', 'Tebourba']
  },
  {
    name: 'Medenine',
    delegations: ['Ben Guerdane', 'Beni Khedache', 'Djerba Ajim', 'Djerba Midoun', 'Houmt Souk', 'Medenine Nord', 'Medenine Sud', 'Sidi Makhlouf', 'Zarzis']
  },
  {
    name: 'Monastir',
    delegations: ['Bekalta', 'Bembla', 'Beni Hassen', 'Jammel', 'Ksar Hellal', 'Ksibet El Mediouni', 'Moknine', 'Monastir', 'Ouerdanine', 'Sahline', 'Sayada-Lamta-Bou Hjar', 'Teboulba', 'Zeramdine']
  },
  {
    name: 'Nabeul',
    delegations: ['Beni Khalled', 'Beni Khiar', 'Bou Argoub', 'Dar Chaabane El Fehri', 'El Mida', 'Grombalia', 'Hammam Ghezaz', 'Hammamet', 'Haouaria', 'Kelibia', 'Korba', 'Menzel Bouzelfa', 'Menzel Temime', 'Nabeul', 'Soliman', 'Takelsa']
  },
  {
    name: 'Sidi Bouzid',
    delegations: ['Bir El Hfay', 'Jelma', 'Mazzouna', 'Meknassi', 'Menzel Bouzaiene', 'Ouled Haffouz', 'Regueb', 'Sabalat Ouled Asker', 'Sidi Ali Ben Aoun', 'Sidi Bouzid Est', 'Sidi Bouzid Ouest', 'Souk Jedid']
  },
  {
    name: 'Siliana',
    delegations: ['Bargou', 'Bouarada', 'Bourouis', 'El Krib', 'Gaafour', 'Kesra', 'Makthar', 'Rouhia', 'Siliana Nord', 'Siliana Sud']
  },
  {
    name: 'Sousse',
    delegations: ['Akouda', 'Bouficha', 'Enfidha', 'Hammam Sousse', 'Hergla', 'Kalaa Kebira', 'Kalaa Sghira', 'Kondar', 'MSaken', 'Sidi Bou Ali', 'Sidi El Heni', 'Sousse Jaouhara', 'Sousse Medina', 'Sousse Riadh', 'Sousse Sidi Abdelhamid']
  },
  {
    name: 'Tataouine',
    delegations: ['Bir Lahmar', 'Dhiba', 'Ghomrassen', 'Remada', 'Samar', 'Tataouine Nord', 'Tataouine Sud']
  },
  {
    name: 'Tozeur',
    delegations: ['Degueche', 'Hazoua', 'Nefta', 'Tamaghza', 'Tozeur']
  },
  {
    name: 'Zaghouan',
    delegations: ['Bir Mchergua', 'Fahs', 'Nadhour', 'Saouaf', 'Zaghouan', 'Zriba']
  }
];


interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  alternatePhone: string;
  address: string;
  state: string;
  subState: string;
  zipCode: string;
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [shippingCost, setShippingCost] = useState(0);
  const { t, i18n } = useTranslation();
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    state: '',
    subState: '',
    zipCode: '',
  });
  
  const [submitting, setSubmitting] = useState(false);
  
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
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);
  
  // Get delegations for selected state
  const delegations = React.useMemo(() => {
    const stateObj = TUNISIA_STATES.find(s => s.name === formData.state);
    return stateObj ? stateObj.delegations : [];
  }, [formData.state]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Reset subState if state changes
      ...(name === 'state' ? { subState: '' } : {})
    }));
  };
  
  // Calculate safe subtotal
  const safeSubtotal = React.useMemo(() => {
    if (!items.length || !Object.keys(products).length) return 0;
    return items.reduce((total, item) => {
      const product = products[item.productId];
      if (!product) return total;
      return total + ((product.discount ? product.selling_price - (product.selling_price * (product.discount / 100)) : product.selling_price) * item.quantity);
    }, 0);
  }, [items, products]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error(t('checkout.errors.emptyCart'));
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Create order in Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            customer_name: formData.name,
            email: formData.email,
            phone: formData.phone,
            alternate_phone: formData.alternatePhone || null,
            address: formData.address,
            governorate: formData.state,
            delegation: formData.subState,
            zip_code: formData.zipCode,
            total_amount: safeTotal,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => {
        const product = products[item.productId];
        const finalPrice = product.discount
          ? product.selling_price - (product.selling_price * (product.discount / 100))
          : product.selling_price;
        return {
          order_id: order.id,
          product_variant_id: item.variantId,
          quantity: item.quantity,
          price: product.selling_price,
          price_at_time: finalPrice,
          discount: product.discount || 0
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;
      
      toast.success(t('checkout.success.orderPlaced'));
      clearCart();
      navigate('/order-success');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(t('checkout.errors.orderFailed'));
    } finally {
      setSubmitting(false);
    }
  };
  
  // Add a function to safely format currency
  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return `TND 0.00`;
    }
    return `TND ${Number(amount).toFixed(2)}`;
  };
  
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
    navigate('/cart');
    return null;
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('checkout.title')}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Customer Information Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">{t('checkout.deliveryInfo')}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">{t('checkout.fullName')}</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t('checkout.fullNamePlaceholder')}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">{t('checkout.email')}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t('checkout.emailPlaceholder')}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">{t('checkout.phoneNumber')}</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder={t('checkout.phoneNumber')}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="alternatePhone">{t('checkout.alternatePhone')}</Label>
                      <Input
                        id="alternatePhone"
                        name="alternatePhone"
                        type="tel"
                        value={formData.alternatePhone}
                        onChange={handleChange}
                        placeholder={t('checkout.alternatePhonePlaceholder')}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="state">{t('checkout.governorate')}</Label>
                      <select
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        className="w-full mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm focus:ring-2 focus:ring-ecommerce-purple focus:border-ecommerce-purple transition-all"
                      >
                        <option value="">{t('checkout.selectGovernorate')}</option>
                        {TUNISIA_STATES.map((state) => (
                          <option key={state.name} value={state.name}>{state.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="subState">{t('checkout.delegation')}</Label>
                      <select
                        id="subState"
                        name="subState"
                        value={formData.subState}
                        onChange={handleChange}
                        required
                        disabled={!formData.state}
                        className="w-full mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm focus:ring-2 focus:ring-ecommerce-purple focus:border-ecommerce-purple transition-all disabled:bg-gray-100"
                      >
                        <option value="">{formData.state ? t('checkout.selectDelegation') : t('checkout.selectGovernorateFirst')}</option>
                        {delegations.map((delegation) => (
                          <option key={delegation} value={delegation}>{delegation}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="zipCode">{t('checkout.zipCode')}</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        placeholder={t('checkout.zipCodePlaceholder')}
                        required
                        className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm focus:ring-2 focus:ring-ecommerce-purple focus:border-ecommerce-purple transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">{t('checkout.deliveryAddress')}</Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder={t('checkout.deliveryAddressPlaceholder')}
                      required
                      rows={4}
                    />
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-ecommerce-purple hover:bg-ecommerce-deep-purple transition-colors"
                  disabled={submitting}
                >
                  {submitting ? t('checkout.processing') : t('checkout.placeOrder')}
                </Button>
              </form>
            </div>
          </div>
          
          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4">{t('cart.orderSummary')}</h2>
              <div className="mb-4 space-y-4">
                {items.map((item) => {
                  const product = products[item.productId];
                  if (!product) return null;

                  const finalPrice = product.discount
                    ? product.selling_price - (product.selling_price * (product.discount / 100))
                    : product.selling_price;
                  return (
                    <div key={item.productId} className="flex items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden mr-3">
                        <img
                          src={product.images[0] || '/placeholder.svg'}
                          alt={product[`name_${i18n.language}`] || product.name_en}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{product[`name_${i18n.language}`] || product.name_en}</p>
                        <p className="text-xs text-gray-500">{t('checkout.qty')}: {item.quantity}</p>
                      </div>
                      <div className="text-sm font-bold text-ecommerce-deep-purple">
                        {formatCurrency(finalPrice * item.quantity)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t pt-4 space-y-3">
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
              <div className="mt-6 bg-gray-50 p-4 rounded-md text-sm">
                <p className="font-medium">{t('checkout.paymentMethod')}</p>
                <p className="text-gray-600 mt-1">{t('checkout.cashOnDelivery')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CheckoutPage;
