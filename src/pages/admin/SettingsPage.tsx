import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { 
  Truck, 
  Store, 
  Mail, 
  Globe, 
  Image as ImageIcon,
  Facebook,
  Instagram,
  Twitter,
  Music,
  Save,
  Settings2,
  Upload,
  CheckCircle2
} from 'lucide-react';

interface DeliverySettings {
  id: number;
  min_order_amount: number;
  delivery_cost: number;
  is_active: boolean;
  logo_url?: string;
  logo_height?: number;
  logo_width?: number;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  store_description_en?: string;
  store_description_fr?: string;
  store_description_ar?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  tiktok_url?: string;
}

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<DeliverySettings>({
    id: 1,
    min_order_amount: 100,
    delivery_cost: 7,
    is_active: true,
    logo_url: '',
    logo_height: 100,
    logo_width: 100,
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    store_description_en: '',
    store_description_fr: '',
    store_description_ar: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    tiktok_url: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_settings')
        .select('*')
        .single();

      if (error) throw error;
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error(t('admin.settings.error'));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('delivery_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success(t('admin.settings.success'));
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(t('admin.settings.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);
      
      if (publicUrlData?.publicUrl) {
        setSettings(prev => ({ ...prev, logo_url: publicUrlData.publicUrl }));
        toast.success(t('admin.settings.logoSuccess'));
      }
    } catch (error) {
      toast.error(t('admin.settings.logoError'));
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-ecommerce-purple/10 rounded-lg">
                <Settings2 className="w-6 h-6 text-ecommerce-purple" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('admin.settings.title')}</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your store settings and preferences</p>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-ecommerce-purple hover:bg-ecommerce-deep-purple transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('admin.settings.savingButton')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {t('admin.settings.saveButton')}
                </div>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Delivery Settings */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{t('admin.settings.deliveryRules.title')}</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Label htmlFor="is_active" className="text-gray-700">{t('admin.settings.deliveryRules.enableRules')}</Label>
                  <Switch
                    id="is_active"
                    checked={settings.is_active}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group">
                    <Label htmlFor="min_order_amount" className="text-gray-700">
                      {t('admin.settings.deliveryRules.minOrderAmount.label')}
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="min_order_amount"
                        type="number"
                        value={settings.min_order_amount}
                        onChange={(e) => setSettings(prev => ({ ...prev, min_order_amount: parseFloat(e.target.value) || 0 }))}
                        className="pr-8 focus:ring-2 focus:ring-ecommerce-purple/20 transition-all duration-200"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    </div>
                  </div>
                  <div className="group">
                    <Label htmlFor="delivery_cost" className="text-gray-700">
                      {t('admin.settings.deliveryRules.deliveryCost.label')}
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="delivery_cost"
                        type="number"
                        value={settings.delivery_cost}
                        onChange={(e) => setSettings(prev => ({ ...prev, delivery_cost: parseFloat(e.target.value) || 0 }))}
                        className="pr-8 focus:ring-2 focus:ring-ecommerce-purple/20 transition-all duration-200"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{t('admin.settings.contactInfo.title')}</h2>
              </div>
              
              <div className="space-y-4">
                <div className="group">
                  <Label htmlFor="contact_email" className="text-gray-700">{t('admin.settings.contactInfo.email')}</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => setSettings(prev => ({ ...prev, contact_email: e.target.value }))}
                    className="mt-2 focus:ring-2 focus:ring-ecommerce-purple/20 transition-all duration-200"
                    placeholder="contact@yourstore.com"
                  />
                </div>
                <div className="group">
                  <Label htmlFor="contact_phone" className="text-gray-700">{t('admin.settings.contactInfo.phone')}</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={settings.contact_phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, contact_phone: e.target.value }))}
                    className="mt-2 focus:ring-2 focus:ring-ecommerce-purple/20 transition-all duration-200"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="group">
                  <Label htmlFor="contact_address" className="text-gray-700">{t('admin.settings.contactInfo.address')}</Label>
                  <Input
                    id="contact_address"
                    type="text"
                    value={settings.contact_address}
                    onChange={(e) => setSettings(prev => ({ ...prev, contact_address: e.target.value }))}
                    className="mt-2 focus:ring-2 focus:ring-ecommerce-purple/20 transition-all duration-200"
                    placeholder="123 Store Street, City, Country"
                  />
                </div>
              </div>
            </section>

            {/* Store Information */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Store className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{t('admin.settings.storeInfo.title')}</h2>
              </div>
              
              <div className="space-y-4">
                <div className="group">
                  <Label htmlFor="store_description_en" className="text-gray-700">{t('admin.settings.storeInfo.descriptionEn')}</Label>
                  <Input
                    id="store_description_en"
                    type="text"
                    value={settings.store_description_en}
                    onChange={(e) => setSettings(prev => ({ ...prev, store_description_en: e.target.value }))}
                    className="mt-2 focus:ring-2 focus:ring-ecommerce-purple/20 transition-all duration-200"
                    placeholder="English store description"
                  />
                </div>
                <div className="group">
                  <Label htmlFor="store_description_fr" className="text-gray-700">{t('admin.settings.storeInfo.descriptionFr')}</Label>
                  <Input
                    id="store_description_fr"
                    type="text"
                    value={settings.store_description_fr}
                    onChange={(e) => setSettings(prev => ({ ...prev, store_description_fr: e.target.value }))}
                    className="mt-2 focus:ring-2 focus:ring-ecommerce-purple/20 transition-all duration-200"
                    placeholder="Description du magasin en français"
                  />
                </div>
                <div className="group">
                  <Label htmlFor="store_description_ar" className="text-gray-700">{t('admin.settings.storeInfo.descriptionAr')}</Label>
                  <Input
                    id="store_description_ar"
                    type="text"
                    value={settings.store_description_ar}
                    onChange={(e) => setSettings(prev => ({ ...prev, store_description_ar: e.target.value }))}
                    className="mt-2 focus:ring-2 focus:ring-ecommerce-purple/20 transition-all duration-200"
                    placeholder="وصف المتجر باللغة العربية"
                  />
                </div>
              </div>
            </section>

            {/* Logo Upload */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <ImageIcon className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{t('admin.settings.storeLogo.title')}</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative w-32 h-32 bg-gray-50 rounded-lg overflow-hidden group">
                    {settings.logo_url ? (
                      <img 
                        src={settings.logo_url} 
                        alt="Store Logo" 
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="logo" className="cursor-pointer">
                      <div className="px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-gray-700">
                        <Upload className="w-4 h-4" />
                        {t('admin.settings.storeLogo.uploadText')}
                      </div>
                      <input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </Label>
                    <p className="text-sm text-gray-500 mt-2">
                      Recommended size: 200x200px. Max file size: 2MB
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <Label htmlFor="logo_width" className="text-gray-700">{t('admin.settings.storeLogo.width')}</Label>
                    <Input
                      id="logo_width"
                      type="number"
                      value={settings.logo_width}
                      onChange={(e) => setSettings(prev => ({ ...prev, logo_width: parseInt(e.target.value) || 0 }))}
                      className="mt-2 focus:ring-2 focus:ring-ecommerce-purple/20 transition-all duration-200"
                    />
                  </div>
                  <div className="group">
                    <Label htmlFor="logo_height" className="text-gray-700">{t('admin.settings.storeLogo.height')}</Label>
                    <Input
                      id="logo_height"
                      type="number"
                      value={settings.logo_height}
                      onChange={(e) => setSettings(prev => ({ ...prev, logo_height: parseInt(e.target.value) || 0 }))}
                      className="mt-2 focus:ring-2 focus:ring-ecommerce-purple/20 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Social Media */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-pink-50 rounded-lg">
                  <Globe className="w-5 h-5 text-pink-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{t('admin.settings.socialMedia.title')}</h2>
              </div>
              
              <div className="space-y-4">
                <div className="group">
                  <Label htmlFor="facebook_url" className="flex items-center gap-2 text-gray-700">
                    <Facebook className="w-4 h-4 text-[#1877F2]" />
                    {t('admin.settings.socialMedia.facebook')}
                  </Label>
                  <Input
                    id="facebook_url"
                    type="url"
                    value={settings.facebook_url}
                    onChange={(e) => setSettings(prev => ({ ...prev, facebook_url: e.target.value }))}
                    placeholder="https://facebook.com/your-store"
                    className="mt-2 focus:ring-2 focus:ring-ecommerce-purple/20 transition-all duration-200"
                  />
                </div>
                <div className="group">
                  <Label htmlFor="instagram_url" className="flex items-center gap-2 text-gray-700">
                    <Instagram className="w-4 h-4 text-[#E4405F]" />
                    {t('admin.settings.socialMedia.instagram')}
                  </Label>
                  <Input
                    id="instagram_url"
                    type="url"
                    value={settings.instagram_url}
                    onChange={(e) => setSettings(prev => ({ ...prev, instagram_url: e.target.value }))}
                    placeholder="https://instagram.com/your-store"
                    className="mt-2 focus:ring-2 focus:ring-ecommerce-purple/20 transition-all duration-200"
                  />
                </div>
                <div className="group">
                  <Label htmlFor="twitter_url" className="flex items-center gap-2 text-gray-700">
                    <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                    {t('admin.settings.socialMedia.twitter')}
                  </Label>
                  <Input
                    id="twitter_url"
                    type="url"
                    value={settings.twitter_url}
                    onChange={(e) => setSettings(prev => ({ ...prev, twitter_url: e.target.value }))}
                    placeholder="https://twitter.com/your-store"
                    className="mt-2 focus:ring-2 focus:ring-ecommerce-purple/20 transition-all duration-200"
                  />
                </div>
                <div className="group">
                  <Label htmlFor="tiktok_url" className="flex items-center gap-2 text-gray-700">
                    <Music className="w-4 h-4 text-black" />
                    {t('admin.settings.socialMedia.tiktok')}
                  </Label>
                  <Input
                    id="tiktok_url"
                    type="url"
                    value={settings.tiktok_url}
                    onChange={(e) => setSettings(prev => ({ ...prev, tiktok_url: e.target.value }))}
                    placeholder="https://tiktok.com/@your-store"
                    className="mt-2 focus:ring-2 focus:ring-ecommerce-purple/20 transition-all duration-200"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage; 