import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
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
  Music
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
  facebook_url_fr?: string;
  instagram_url_fr?: string;
  twitter_url_fr?: string;
  tiktok_url_fr?: string;
  facebook_url_ar?: string;
  instagram_url_ar?: string;
  twitter_url_ar?: string;
  tiktok_url_ar?: string;
}

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
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
    facebook_url_fr: '',
    instagram_url_fr: '',
    twitter_url_fr: '',
    tiktok_url_fr: '',
    facebook_url_ar: '',
    instagram_url_ar: '',
    twitter_url_ar: '',
    tiktok_url_ar: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('delivery_settings')
        .upsert({
          id: settings.id,
          min_order_amount: parseFloat(settings.min_order_amount.toString()),
          delivery_cost: parseFloat(settings.delivery_cost.toString()),
          is_active: settings.is_active,
          logo_url: settings.logo_url,
          logo_height: settings.logo_height,
          logo_width: settings.logo_width,
          contact_email: settings.contact_email,
          contact_phone: settings.contact_phone,
          contact_address: settings.contact_address,
          store_description_en: settings.store_description_en,
          store_description_fr: settings.store_description_fr,
          store_description_ar: settings.store_description_ar,
          facebook_url: settings.facebook_url,
          instagram_url: settings.instagram_url,
          twitter_url: settings.twitter_url,
          tiktok_url: settings.tiktok_url,
          facebook_url_fr: settings.facebook_url_fr,
          instagram_url_fr: settings.instagram_url_fr,
          twitter_url_fr: settings.twitter_url_fr,
          tiktok_url_fr: settings.tiktok_url_fr,
          facebook_url_ar: settings.facebook_url_ar,
          instagram_url_ar: settings.instagram_url_ar,
          twitter_url_ar: settings.twitter_url_ar,
          tiktok_url_ar: settings.tiktok_url_ar,
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

  const handleLogoUploadFile = async (file: File) => {
    setLogoUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('logos').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(filePath);
      const publicUrl = publicUrlData?.publicUrl;
      if (publicUrl) {
        setSettings(prev => ({ ...prev, logo_url: publicUrl }));
        toast.success(t('admin.settings.logoSuccess'));
      } else {
        toast.error(t('admin.settings.logoError'));
      }
    } catch (error) {
      toast.error(t('admin.settings.logoError'));
      console.error(error);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleLogoUploadFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (logoUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleLogoUploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleClickDropzone = () => {
    if (!logoUploading && fileInputRef.current) fileInputRef.current.click();
  };

  const DeliveryRulesCard = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-ecommerce-light-purple rounded-lg">
          <Truck className="w-5 h-5 text-ecommerce-purple" />
        </div>
        <h2 className="text-xl font-semibold">{t('admin.settings.deliveryRules.title')}</h2>
      </div>
      
      <div className="space-y-4">
        <div className={cn(
          "flex items-center justify-between p-4 bg-gray-50 rounded-lg",
          isRTL ? "flex-row-reverse" : "flex-row"
        )}>
          <Label htmlFor="is_active" className={cn(
            isRTL ? "ml-2" : "mr-2"
          )}>
            {t('admin.settings.deliveryRules.enableRules')}
          </Label>
          <Switch
            id="is_active"
            checked={settings.is_active}
            onCheckedChange={(checked) => 
              setSettings(prev => ({ ...prev, is_active: checked }))
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <Label htmlFor="min_order_amount">
              {t('admin.settings.deliveryRules.minOrderAmount.label')}
            </Label>
            <Input
              id="min_order_amount"
              type="number"
              step="0.01"
              min="0"
              value={settings.min_order_amount}
              onChange={(e) => 
                setSettings(prev => ({ 
                  ...prev, 
                  min_order_amount: parseFloat(e.target.value) 
                }))
              }
              required
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-2">
              {t('admin.settings.deliveryRules.minOrderAmount.description')}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <Label htmlFor="delivery_cost">
              {t('admin.settings.deliveryRules.deliveryCost.label')}
            </Label>
            <Input
              id="delivery_cost"
              type="number"
              step="0.01"
              min="0"
              value={settings.delivery_cost}
              onChange={(e) => 
                setSettings(prev => ({ 
                  ...prev, 
                  delivery_cost: parseFloat(e.target.value) 
                }))
              }
              required
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-2">
              {t('admin.settings.deliveryRules.deliveryCost.description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const ContactInfoCard = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-ecommerce-light-purple rounded-lg">
          <Mail className="w-5 h-5 text-ecommerce-purple" />
        </div>
        <h2 className="text-xl font-semibold">{t('admin.settings.contactInfo.title')}</h2>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <Label htmlFor="contact_email">{t('admin.settings.contactInfo.email')}</Label>
          <Input
            id="contact_email"
            type="email"
            value={settings.contact_email}
            onChange={(e) => 
              setSettings(prev => ({ 
                ...prev, 
                contact_email: e.target.value 
              }))
            }
            className="mt-2"
          />
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <Label htmlFor="contact_phone">{t('admin.settings.contactInfo.phone')}</Label>
          <Input
            id="contact_phone"
            type="tel"
            value={settings.contact_phone}
            onChange={(e) => 
              setSettings(prev => ({ 
                ...prev, 
                contact_phone: e.target.value 
              }))
            }
            className="mt-2"
          />
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <Label htmlFor="contact_address">{t('admin.settings.contactInfo.address')}</Label>
          <Input
            id="contact_address"
            type="text"
            value={settings.contact_address}
            onChange={(e) => 
              setSettings(prev => ({ 
                ...prev, 
                contact_address: e.target.value 
              }))
            }
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );

  const StoreInfoCard = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-ecommerce-light-purple rounded-lg">
          <Store className="w-5 h-5 text-ecommerce-purple" />
        </div>
        <h2 className="text-xl font-semibold">{t('admin.settings.storeInfo.title')}</h2>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <Label htmlFor="store_description_en">{t('admin.settings.storeInfo.descriptionEn')}</Label>
          <Input
            id="store_description_en"
            type="text"
            value={settings.store_description_en}
            onChange={(e) => 
              setSettings(prev => ({ 
                ...prev, 
                store_description_en: e.target.value 
              }))
            }
            className="mt-2"
          />
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <Label htmlFor="store_description_fr">{t('admin.settings.storeInfo.descriptionFr')}</Label>
          <Input
            id="store_description_fr"
            type="text"
            value={settings.store_description_fr}
            onChange={(e) => 
              setSettings(prev => ({ 
                ...prev, 
                store_description_fr: e.target.value 
              }))
            }
            className="mt-2"
          />
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <Label htmlFor="store_description_ar">{t('admin.settings.storeInfo.descriptionAr')}</Label>
          <Input
            id="store_description_ar"
            type="text"
            value={settings.store_description_ar}
            onChange={(e) => 
              setSettings(prev => ({ 
                ...prev, 
                store_description_ar: e.target.value 
              }))
            }
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );

  const LogoCard = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-ecommerce-light-purple rounded-lg">
          <ImageIcon className="w-5 h-5 text-ecommerce-purple" />
        </div>
        <h2 className="text-xl font-semibold">{t('admin.settings.storeLogo.title')}</h2>
      </div>
      
      <div className="space-y-4">
        <div
          className={`mt-2 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${logoUploading ? 'border-gray-300 bg-gray-100' : 'border-ecommerce-purple hover:bg-ecommerce-light-purple/30'}`}
          onClick={handleClickDropzone}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{ minHeight: 120 }}
          tabIndex={0}
          role="button"
          aria-disabled={logoUploading}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
            disabled={logoUploading}
          />
          {logoUploading ? (
            <span className="text-ecommerce-purple animate-pulse">{t('admin.settings.storeLogo.uploading')}</span>
          ) : settings.logo_url ? (
            <img 
              src={settings.logo_url} 
              alt="Custom Logo Preview" 
              className="rounded shadow mb-2" 
              style={{ 
                height: `${settings.logo_height}px`, 
                width: `${settings.logo_width}px` 
              }}
            />
          ) : (
            <>
              <svg className="w-10 h-10 text-ecommerce-purple mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4a1 1 0 011-1h8a1 1 0 011 1v12m-4 4h-4a1 1 0 01-1-1v-1a1 1 0 011-1h4a1 1 0 011 1v1a1 1 0 01-1 1z" /></svg>
              <span className="text-gray-500">{t('admin.settings.storeLogo.uploadText')}</span>
            </>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <Label htmlFor="logo_width">{t('admin.settings.storeLogo.width')}</Label>
            <Input
              id="logo_width"
              type="number"
              min="1"
              value={settings.logo_width}
              onChange={(e) => 
                setSettings(prev => ({ 
                  ...prev, 
                  logo_width: parseInt(e.target.value) 
                }))
              }
              className="mt-2"
            />
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <Label htmlFor="logo_height">{t('admin.settings.storeLogo.height')}</Label>
            <Input
              id="logo_height"
              type="number"
              min="1"
              value={settings.logo_height}
              onChange={(e) => 
                setSettings(prev => ({ 
                  ...prev, 
                  logo_height: parseInt(e.target.value) 
                }))
              }
              className="mt-2"
            />
          </div>
        </div>
        <p className="text-sm text-gray-500">{t('admin.settings.storeLogo.description')}</p>
      </div>
    </div>
  );

  const SocialMediaCard = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-ecommerce-light-purple rounded-lg">
          <Globe className="w-5 h-5 text-ecommerce-purple" />
        </div>
        <h2 className="text-xl font-semibold">{t('admin.settings.socialMedia.title')}</h2>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Facebook className="w-4 h-4 text-[#1877F2]" />
            <Label htmlFor="facebook_url">{t('admin.settings.socialMedia.facebook')}</Label>
          </div>
          <Input
            id="facebook_url"
            type="url"
            value={settings.facebook_url}
            onChange={(e) => 
              setSettings(prev => ({ 
                ...prev, 
                facebook_url: e.target.value 
              }))
            }
            placeholder="https://facebook.com/your-store"
          />
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Instagram className="w-4 h-4 text-[#E4405F]" />
            <Label htmlFor="instagram_url">{t('admin.settings.socialMedia.instagram')}</Label>
          </div>
          <Input
            id="instagram_url"
            type="url"
            value={settings.instagram_url}
            onChange={(e) => 
              setSettings(prev => ({ 
                ...prev, 
                instagram_url: e.target.value 
              }))
            }
            placeholder="https://instagram.com/your-store"
          />
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Twitter className="w-4 h-4 text-[#1DA1F2]" />
            <Label htmlFor="twitter_url">{t('admin.settings.socialMedia.twitter')}</Label>
          </div>
          <Input
            id="twitter_url"
            type="url"
            value={settings.twitter_url}
            onChange={(e) => 
              setSettings(prev => ({ 
                ...prev, 
                twitter_url: e.target.value 
              }))
            }
            placeholder="https://twitter.com/your-store"
          />
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Music className="w-4 h-4 text-black" />
            <Label htmlFor="tiktok_url">{t('admin.settings.socialMedia.tiktok')}</Label>
          </div>
          <Input
            id="tiktok_url"
            type="url"
            value={settings.tiktok_url}
            onChange={(e) => 
              setSettings(prev => ({ 
                ...prev, 
                tiktok_url: e.target.value 
              }))
            }
            placeholder="https://tiktok.com/@your-store"
          />
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('admin.settings.title')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DeliveryRulesCard />
            <ContactInfoCard />
            <StoreInfoCard />
            <LogoCard />
            <SocialMediaCard />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-ecommerce-purple hover:bg-ecommerce-deep-purple px-8"
              disabled={loading || logoUploading}
            >
              {(loading || logoUploading) ? t('admin.settings.savingButton') : t('admin.settings.saveButton')}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage; 