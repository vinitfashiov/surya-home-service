import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMyProvider } from '@/hooks/useSupabaseData';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProviderTranslation } from '@/hooks/useProviderTranslation';
import { ProviderLanguage } from '@/utils/providerTranslations';
import { 
  UserCheck, History, MapPin, Landmark, 
  GraduationCap, HelpCircle, ShoppingBag, Award, 
  Settings, ChevronRight, Share2, LogOut, MessageSquareCode,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProviderProfile() {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();
  const { data: provider } = useMyProvider(user?.id);
  const { t, language, changeLanguage } = useProviderTranslation();

  // State for whatsapp toggle
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);

  useEffect(() => {
    if (provider) {
      const localWa = localStorage.getItem(`provider_wa_${provider.id}`) !== 'false';
      setWhatsappUpdates(provider.whatsapp_updates ?? localWa);
    }
  }, [provider]);

  const handleWaToggle = async (checked: boolean) => {
    setWhatsappUpdates(checked);
    if (!provider) return;
    try {
      const { error } = await supabase
        .from('providers')
        .update({ whatsapp_updates: checked } as any)
        .eq('id', provider.id);
      if (error) throw error;
      toast.success('WhatsApp updates preference updated');
    } catch {
      localStorage.setItem(`provider_wa_${provider.id}`, String(checked));
      toast.success('WhatsApp preference saved locally');
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/provider/login');
  };

  const handleShareDetails = () => {
    if (navigator.share) {
      navigator.share({
        title: provider?.company_name || 'Surya Service Provider',
        text: `Check out our service profile: ${provider?.company_name}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Profile URL copied to clipboard');
    }
  };

  if (!user) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Please log in as a provider.</div>;
  if (!provider) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">No provider profile found.</div>;

  const menuItems = [
    { label: t('profile.verify_aadhaar'), path: '/provider/verify-aadhaar', icon: UserCheck, desc: t('profile.verify_aadhaar_desc') },
    { label: t('profile.payouts'), path: '/provider/payouts', icon: Wallet, desc: t('profile.payouts_desc') },
    { label: t('profile.past_jobs'), path: '/provider/past-bookings', icon: History, desc: t('profile.past_jobs_desc') },
    { label: t('profile.my_hub'), path: '/provider/hub', icon: MapPin, desc: t('profile.my_hub_desc') },
    { label: t('profile.loans'), path: '/provider/loans', icon: Landmark, desc: t('profile.loans_desc') },
    { label: t('profile.training'), path: '/provider/training', icon: GraduationCap, desc: t('profile.training_desc') },
    { label: t('profile.help'), path: '/provider/help', icon: HelpCircle, desc: t('profile.help_desc') },
    { label: t('profile.shop'), path: '/provider/shop', icon: ShoppingBag, desc: t('profile.shop_desc') },
    { label: t('profile.skill_cert'), path: '/provider/skill-certificate', icon: Award, desc: t('profile.skill_cert_desc') },
  ];

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {/* Header Profile Info Card */}
      <div className="bg-background border-b pt-6 pb-5 px-4 shadow-sm max-w-lg mx-auto">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${provider.owner_name}`} />
            <AvatarFallback>{provider.owner_name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading font-bold text-lg text-foreground truncate">{provider.owner_name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{provider.company_name}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-0 text-[10px] font-bold">
                {provider.rating ? `${provider.rating} ★` : '4.85 ★'}
              </Badge>
              <Badge variant="outline" className={`text-[10px] uppercase font-bold ${
                provider.is_verified ? 'border-emerald-500/30 text-emerald-600 bg-emerald-50/50' : 'border-amber-500/30 text-amber-600 bg-amber-50/50'
              }`}>
                {provider.is_verified ? 'Verified' : 'Pending Verification'}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full shrink-0 text-muted-foreground" onClick={handleShareDetails}>
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
        {/* Navigation Menu List */}
        <Card className="border shadow-sm">
          <CardContent className="p-0 divide-y">
            {menuItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground leading-none">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Bottom Options (Vitteey vivaran, WhatsApp status, App language) */}
        <Card className="border shadow-sm">
          <CardContent className="p-0 divide-y">
            {/* Vitteey vivaran */}
            <Link 
              to="/provider/financial-details"
              className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-9 w-9 rounded-xl bg-violet-600/10 flex items-center justify-center">
                  <Landmark className="h-5 w-5 text-violet-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-none">{t('profile.financial_details')}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{t('profile.financial_details_desc')}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
            </Link>

            {/* WhatsApp Updates Switch Toggle */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <MessageSquareCode className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-none">{t('profile.whatsapp_updates')}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{t('profile.whatsapp_updates_desc')}</p>
                </div>
              </div>
              <Switch checked={whatsappUpdates} onCheckedChange={handleWaToggle} />
            </div>

            {/* Change Language Select Dropdown */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-none">{t('profile.change_lang')}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{t('profile.change_lang_desc')}</p>
                </div>
              </div>
              <div className="w-32 shrink-0">
                <Select value={language} onValueChange={(val) => changeLanguage(val as ProviderLanguage)}>
                  <SelectTrigger className="h-8 text-xs font-semibold">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hinglish">Hinglish</SelectItem>
                    <SelectItem value="hindi">हिन्दी (Hindi)</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button 
          variant="outline" 
          className="w-full h-11 border-destructive/20 text-destructive hover:bg-destructive/5 gap-2 font-bold text-xs rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" /> {t('profile.logout')}
        </Button>
      </div>
    </div>
  );
}
