import { useState, useEffect } from 'react';
import { useAuth, useMyProvider } from '@/hooks/useSupabaseData';
import { useCities } from '@/hooks/useCities';
import { supabase } from '@/integrations/supabase/client';
import ImageUpload from '@/components/ImageUpload';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Building2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProviderProfile() {
  const { user } = useAuth();
  const { data: provider, isLoading } = useMyProvider(user?.id);
  const { data: cities = [] } = useCities();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company_name: '',
    owner_name: '',
    email: '',
    phone: '',
    address: '',
    city_id: '',
  });

  useEffect(() => {
    if (provider) {
      setForm({
        company_name: provider.company_name || '',
        owner_name: provider.owner_name || '',
        email: provider.email || '',
        phone: provider.phone || '',
        address: provider.address || '',
        city_id: provider.city_id || '',
      });
    }
  }, [provider]);

  if (!user) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Please log in as a provider.</div>;
  }

  if (isLoading) {
    return <div className="container mx-auto px-4 py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!provider) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">No provider profile found.</div>;
  }

  const handleSave = async () => {
    if (!form.company_name.trim() || !form.owner_name.trim() || !form.email.trim()) {
      toast.error('Company name, owner name, and email are required.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('providers')
      .update({
        company_name: form.company_name.trim(),
        owner_name: form.owner_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city_id: form.city_id || null,
      })
      .eq('id', provider.id);
    setSaving(false);
    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['my-provider'] });
    }
  };

  const statusColor: Record<string, string> = {
    active: 'bg-success/10 text-success',
    pending: 'bg-warning/10 text-warning',
    rejected: 'bg-destructive/10 text-destructive',
    inactive: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Provider Profile</h1>
          <p className="text-sm text-muted-foreground">Update your company details and contact information</p>
        </div>
        <Badge className={`ml-auto ${statusColor[provider.status] || statusColor.inactive} border-0`}>
          {provider.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input id="company_name" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_name">Owner Name *</Label>
              <Input id="owner_name" value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} maxLength={100} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} maxLength={20} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Select value={form.city_id} onValueChange={v => setForm(f => ({ ...f, city_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}{c.state ? `, ${c.state}` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} maxLength={500} rows={3} />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
