import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import logoMoez from '../assets/logo-moez.png';

interface LogoData {
  url: string | null;
  height: number;
  width: number;
}

export function useAppLogo() {
  const [logoData, setLogoData] = useState<LogoData>({
    url: null,
    height: 100,
    width: 100
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchLogo() {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_settings')
        .select('logo_url, logo_height, logo_width')
        .single();
      if (isMounted) {
        if (error || !data || !data.logo_url) {
          setLogoData({
            url: logoMoez,
            height: 100,
            width: 100
          });
        } else {
          setLogoData({
            url: data.logo_url,
            height: data.logo_height || 100,
            width: data.logo_width || 100
          });
        }
        setLoading(false);
      }
    }
    fetchLogo();
    return () => { isMounted = false; };
  }, []);

  return { logoData, loading };
} 