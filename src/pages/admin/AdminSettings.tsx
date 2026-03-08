import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Building2, Clock, DollarSign, Save, CalendarDays, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function useSettings() {
  return useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('platform_settings')
        .select('*');
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((s: any) => { map[s.key] = s.value; });
      return map;
    },
  });
}

function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Record<string, string>) => {
      const updates = Object.entries(settings).map(([key, value]) =>
        (supabase as any).from('platform_settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key)
      );
      const results = await Promise.all(updates);
      const err = results.find(r => r.error);
      if (err?.error) throw err.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform-settings'] }),
  });
}

export default function AdminSettings() {
  const { data: settings, isLoading } = useSettings();
  const updateMut = useUpdateSettings();
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const workingDays = (form.working_days || '').split(',').filter(Boolean);
  const toggleDay = (day: string) => {
    const days = workingDays.includes(day)
      ? workingDays.filter(d => d !== day)
      : [...workingDays, day];
    set('working_days', days.join(','));
  };

  const handleSave = async () => {
    try {
      await updateMut.mutateAsync(form);
      toast.success('Settings saved successfully');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure your platform settings</p>
        </div>
        <Button onClick={handleSave} disabled={updateMut.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {updateMut.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Business Info */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Business Information</CardTitle>
                <CardDescription className="text-xs">Basic business details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Business Name</Label>
              <Input value={form.business_name || ''} onChange={e => set('business_name', e.target.value)} placeholder="Your business name" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.business_email || ''} onChange={e => set('business_email', e.target.value)} placeholder="contact@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.business_phone || ''} onChange={e => set('business_phone', e.target.value)} placeholder="+1 (555) 000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={form.business_address || ''} onChange={e => set('business_address', e.target.value)} placeholder="123 Main St, City" />
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-info/10 flex items-center justify-center">
                <Clock className="h-4.5 w-4.5 text-info" />
              </div>
              <div>
                <CardTitle className="text-base">Working Hours</CardTitle>
                <CardDescription className="text-xs">Set operating schedule</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start Time</Label>
                <Input type="time" value={form.working_hours_start || '09:00'} onChange={e => set('working_hours_start', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End Time</Label>
                <Input type="time" value={form.working_hours_end || '18:00'} onChange={e => set('working_hours_end', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Working Days</Label>
              <div className="flex flex-wrap gap-2">
                {dayOptions.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      workingDays.includes(day)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Settings */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
                <CalendarDays className="h-4.5 w-4.5 text-warning" />
              </div>
              <div>
                <CardTitle className="text-base">Booking Settings</CardTitle>
                <CardDescription className="text-xs">Configure booking rules</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Advance Notice (hours)</Label>
              <Input type="number" value={form.booking_notice_hours || '24'} onChange={e => set('booking_notice_hours', e.target.value)} />
              <p className="text-xs text-muted-foreground">Minimum hours before a booking can be made</p>
            </div>
            <div className="space-y-1.5">
              <Label>Max Bookings Per Day</Label>
              <Input type="number" value={form.max_bookings_per_day || '50'} onChange={e => set('max_bookings_per_day', e.target.value)} />
              <p className="text-xs text-muted-foreground">Maximum daily bookings allowed</p>
            </div>
          </CardContent>
        </Card>

        {/* Currency */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="h-4.5 w-4.5 text-success" />
              </div>
              <div>
                <CardTitle className="text-base">Payment & Currency</CardTitle>
                <CardDescription className="text-xs">Financial settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={form.currency || 'USD'} onValueChange={v => set('currency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="AED">AED (د.إ)</SelectItem>
                  <SelectItem value="CAD">CAD (C$)</SelectItem>
                  <SelectItem value="AUD">AUD (A$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
