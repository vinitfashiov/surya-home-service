import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMyBookings } from '@/hooks/useSupabaseData';
import { useMyAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress } from '@/hooks/useAddresses';
import { useCities } from '@/hooks/useCities';
import { supabase } from '@/integrations/supabase/client';
import ImageUpload from '@/components/ImageUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, CalendarDays, DollarSign, Star, MapPin, Plus, Trash2, Edit, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function ProfilePage() {
  const { user } = useAuthContext();
  const { data: bookings = [], isLoading: bLoading } = useMyBookings(user?.id);
  const { data: addresses = [], isLoading: aLoading } = useMyAddresses(user?.id);
  const { data: cities = [] } = useCities();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const qc = useQueryClient();

  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [saving, setSaving] = useState(false);

  // Address dialog
  const [addrOpen, setAddrOpen] = useState(false);
  const [addrEditing, setAddrEditing] = useState<any>(null);
  const [addrForm, setAddrForm] = useState({ label: 'Home', address_line: '', city_id: '', pincode: '', is_default: false });

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => {
        setProfile(data);
        if (data) setForm({ full_name: data.full_name || '', phone: data.phone || '' });
        setProfileLoading(false);
      });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      phone: form.phone,
    }).eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Failed to update profile'); return; }
    setProfile({ ...profile, ...form });
    setEditing(false);
    toast.success('Profile updated');
  };

  const totalSpent = bookings.filter((b: any) => b.payment_status === 'paid').reduce((s: number, b: any) => s + Number(b.amount), 0);
  const completedBookings = bookings.filter((b: any) => b.status === 'completed').length;

  const handleSaveAddress = async () => {
    if (!addrForm.address_line.trim()) { toast.error('Address is required'); return; }
    try {
      if (addrEditing) {
        await updateAddress.mutateAsync({ id: addrEditing.id, user_id: user!.id, ...addrForm, city_id: addrForm.city_id || undefined });
      } else {
        await createAddress.mutateAsync({ user_id: user!.id, ...addrForm, city_id: addrForm.city_id || undefined });
      }
      toast.success(addrEditing ? 'Address updated' : 'Address added');
      setAddrOpen(false);
      setAddrEditing(null);
      setAddrForm({ label: 'Home', address_line: '', city_id: '', pincode: '', is_default: false });
    } catch { toast.error('Failed to save address'); }
  };

  const handleEditAddr = (a: any) => {
    setAddrEditing(a);
    setAddrForm({ label: a.label, address_line: a.address_line, city_id: a.city_id || '', pincode: a.pincode || '', is_default: a.is_default });
    setAddrOpen(true);
  };

  const handleDeleteAddr = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    await deleteAddress.mutateAsync(id);
    toast.success('Address deleted');
  };

  if (!user) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Please log in to view your profile.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-heading font-bold text-foreground mb-8">My Profile</h1>

      {/* Profile Card */}
      <Card className="border shadow-sm mb-6">
        <CardContent className="p-6">
          {profileLoading ? (
            <Skeleton className="h-32 rounded-xl" />
          ) : (
            <div className="flex items-start gap-5">
              <ImageUpload
                bucket="avatars"
                path={`${user.id}/avatar`}
                currentUrl={profile?.avatar_url}
                variant="avatar"
                onUpload={async (url) => {
                  await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
                  setProfile({ ...profile, avatar_url: url });
                }}
              />
              <div className="flex-1">
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <Label>Full Name</Label>
                      <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91..." />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} disabled={saving} size="sm">Save</Button>
                      <Button variant="outline" size="sm" onClick={() => { setEditing(false); setForm({ full_name: profile?.full_name || '', phone: profile?.phone || '' }); }}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-heading font-bold text-foreground">{profile?.full_name || 'No name set'}</h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {profile?.email}</span>
                      {profile?.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {profile.phone}</span>}
                    </div>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setEditing(true)}>
                      <Edit className="h-3.5 w-3.5 mr-1" /> Edit Profile
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="border shadow-sm">
          <CardContent className="p-4 text-center">
            <CalendarDays className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold text-foreground">{bookings.length}</p>
            <p className="text-xs text-muted-foreground">Total Bookings</p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold text-foreground">₹{totalSpent.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Spent</p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 text-center">
            <Check className="h-5 w-5 text-success mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold text-foreground">{completedBookings}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Saved Addresses */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-heading font-bold text-foreground">Saved Addresses</h2>
        <Dialog open={addrOpen} onOpenChange={(o) => { setAddrOpen(o); if (!o) { setAddrEditing(null); setAddrForm({ label: 'Home', address_line: '', city_id: '', pincode: '', is_default: false }); } }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add Address</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{addrEditing ? 'Edit Address' : 'Add Address'}</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-4">
              <div>
                <Label>Label</Label>
                <Select value={addrForm.label} onValueChange={(v) => setAddrForm({ ...addrForm, label: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Work">Work</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Address *</Label>
                <Input value={addrForm.address_line} onChange={(e) => setAddrForm({ ...addrForm, address_line: e.target.value })} placeholder="Full address..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>City</Label>
                  <Select value={addrForm.city_id} onValueChange={(v) => setAddrForm({ ...addrForm, city_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent>
                      {cities.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input value={addrForm.pincode} onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })} placeholder="123456" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={addrForm.is_default} onChange={(e) => setAddrForm({ ...addrForm, is_default: e.target.checked })} id="default-addr" className="rounded" />
                <Label htmlFor="default-addr" className="text-sm">Set as default address</Label>
              </div>
              <Button className="w-full" onClick={handleSaveAddress} disabled={createAddress.isPending || updateAddress.isPending}>
                {addrEditing ? 'Update' : 'Add'} Address
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {aLoading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : addresses.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground">No saved addresses.</p>
      ) : (
        <div className="space-y-3">
          {addresses.map((a: any) => (
            <Card key={a.id} className="border shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground text-sm">{a.label}</p>
                    {a.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{a.address_line}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleEditAddr(a)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteAddr(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
