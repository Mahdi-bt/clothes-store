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

interface DeliverySettings {
  id: number;
  min_order_amount: number;
  delivery_cost: number;
  is_active: boolean;
  logo_url?: string;
  logo_height?: number;
  logo_width?: number;
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('admin.settings.title')}</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">{t('admin.settings.deliveryRules.title')}</h2>
          
          <form onSubmit={e => {
            e.preventDefault();
            if (logoUploading) return;
            handleSubmit(e);
          }} className="space-y-6">
            <div className="space-y-4">
              <div className={cn(
                "flex items-center justify-between",
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
                <div>
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
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {t('admin.settings.deliveryRules.minOrderAmount.description')}
                  </p>
                </div>

                <div>
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
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {t('admin.settings.deliveryRules.deliveryCost.description')}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <Label>{t('admin.settings.storeLogo.title')}</Label>
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
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
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
                      />
                    </div>
                    <div>
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
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{t('admin.settings.storeLogo.description')}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-ecommerce-purple hover:bg-ecommerce-deep-purple"
                disabled={loading || logoUploading}
              >
                {(loading || logoUploading) ? t('admin.settings.savingButton') : t('admin.settings.saveButton')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage; 