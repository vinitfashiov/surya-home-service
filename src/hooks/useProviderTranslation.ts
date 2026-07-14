import { useAuth, useMyProvider } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { providerTranslations, ProviderLanguage } from '@/utils/providerTranslations';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useProviderTranslation() {
  const { user } = useAuth();
  const { data: provider } = useMyProvider(user?.id);
  const [lang, setLang] = useState<ProviderLanguage>('hinglish');

  useEffect(() => {
    if (provider) {
      const localLang = localStorage.getItem(`provider_lang_${provider.id}`) as ProviderLanguage;
      const dbLang = provider.app_language as ProviderLanguage;
      if (dbLang && ['english', 'hindi', 'hinglish'].includes(dbLang)) {
        setLang(dbLang);
      } else if (localLang && ['english', 'hindi', 'hinglish'].includes(localLang)) {
        setLang(localLang);
      }
    } else {
      const globalLang = localStorage.getItem('provider_lang_global') as ProviderLanguage;
      if (globalLang && ['english', 'hindi', 'hinglish'].includes(globalLang)) {
        setLang(globalLang);
      }
    }
  }, [provider]);

  const changeLanguage = async (newLang: ProviderLanguage) => {
    setLang(newLang);
    localStorage.setItem('provider_lang_global', newLang);
    if (provider) {
      localStorage.setItem(`provider_lang_${provider.id}`, newLang);
      try {
        const { error } = await supabase
          .from('providers')
          .update({ app_language: newLang } as any)
          .eq('id', provider.id);
        if (error) throw error;
      } catch {
        // Handled gracefully with local preference
      }
    }
  };

  const t = (key: string): string => {
    const dict = providerTranslations[lang] || providerTranslations['hinglish'];
    return dict[key] || key;
  };

  return { t, language: lang, changeLanguage };
}
