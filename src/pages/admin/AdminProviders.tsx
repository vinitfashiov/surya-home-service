import { useProviders } from '@/hooks/useSupabaseData';
import { useUpdateProvider, useDeleteProvider, useCreateProvider } from '@/hooks/useAdminMutations';
import { useCreateNotification } from '@/hooks/useNotifications';
import { useCities } from '@/hooks/useCities';
import { useActiveZones } from '@/hooks/useZones';
import { useVerifyProvider } from '@/hooks/useProviderDocuments';
import AdminDocumentReview from '@/components/admin/AdminDocumentReview';
import LocationPicker from '@/components/maps/LocationPicker';
import GoogleMapsProvider from '@/components/maps/GoogleMapsProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Pencil, Trash2, Building2, Search, CheckCircle, XCircle, Shield, Plus, ShieldCheck, FileText, UserCheck, CreditCard, Landmark } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const emptyForm = {
  company_name: '',
  owner_name: '',
  email: '',
  phone: '',
  address: '',
  status: 'pending',
  city_id: '',
  zone_id: 'none',
  latitude: null as number | null,
  longitude: null as number | null,
  aadhaar_number: '',
  aadhaar_verified: false,
  gst_number: '',
  pan_number: '',
  bank_account_number: '',
  bank_name: '',
  bank_ifsc: '',
  bank_account_name: '',
  is_verified: false
};

export default function AdminProviders() {
  const { data: providers = [], isLoading, error: providersError } = useProviders();
  const { data: cities = [], error: citiesError } = useCities();
  const { data: zones = [], error: zonesError } = useActiveZones();

  useEffect(() => {
    if (providersError) toast.error(`Failed to load providers: ${providersError.message}`);
    if (citiesError) toast.error(`Failed to load cities: ${citiesError.message}`);
    if (zonesError) toast.error(`Failed to load zones: ${zonesError.message}`);
  }, [providersError, citiesError, zonesError]);
  const updateMut = useUpdateProvider();
  const deleteMut = useDeleteProvider();
  const createMut = useCreateProvider();
  const createNotification = useCreateNotification();

  const [editProvider, setEditProvider] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = providers
    .filter((p: any) => statusFilter === 'all' || p.status === statusFilter)
    .filter((p: any) =>
      p.company_name.toLowerCase().includes(search.toLowerCase()) ||
      p.owner_name.toLowerCase().includes(search.toLowerCase())
    );

  const pendingCount = providers.filter((p: any) => p.status === 'pending').length;

  const openEdit = (p: any) => {
    setEditProvider(p);
    setIsAdding(false);
    setForm({
      company_name: p.company_name,
      owner_name: p.owner_name,
      email: p.email,
      phone: p.phone || '',
      address: p.address || '',
      status: p.status,
      city_id: p.city_id || '',
      zone_id: p.zone_id || 'none',
      latitude: p.latitude || null,
      longitude: p.longitude || null,
      aadhaar_number: p.aadhaar_number || '',
      aadhaar_verified: !!p.aadhaar_verified,
      gst_number: p.gst_number || '',
      pan_number: p.pan_number || '',
      bank_account_number: p.bank_account_number || '',
      bank_name: p.bank_name || '',
      bank_ifsc: p.bank_ifsc || '',
      bank_account_name: p.bank_account_name || '',
      is_verified: !!p.is_verified
    });
  };

  const openAdd = () => {
    setEditProvider(null);
    setIsAdding(true);
    setForm({ ...emptyForm, status: 'active' });
  };

  const handleApprove = async (provider: any) => {
    try {
      await updateMut.mutateAsync({ id: provider.id, status: 'active' });
      
      // Update role in user_roles if user exists
      if (provider.user_id) {
        const { error: roleErr } = await supabase
          .from('user_roles')
          .upsert({ user_id: provider.user_id, role: 'provider' }, { onConflict: 'user_id,role' });
        if (roleErr) console.error("Failed to assign provider role:", roleErr);
      }

      await createNotification.mutateAsync({
        user_id: provider.user_id,
        title: 'Provider Approved!',
        message: `Your provider account "${provider.company_name}" has been approved. You can now start offering services.`,
        type: 'status',
      });
      toast.success(`${provider.company_name} approved`);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleReject = async (provider: any) => {
    try {
      await updateMut.mutateAsync({ id: provider.id, status: 'inactive' });
      
      // Remove role in user_roles if user exists
      if (provider.user_id) {
        const { error: roleErr } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', provider.user_id)
          .eq('role', 'provider');
        if (roleErr) console.error("Failed to revoke provider role:", roleErr);
      }

      await createNotification.mutateAsync({
        user_id: provider.user_id,
        title: 'Provider Application Rejected',
        message: `Your provider account "${provider.company_name}" has been rejected. Please contact support for more information.`,
        type: 'status',
      });
      toast.success(`${provider.company_name} rejected`);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSave = async () => {
    if (!editProvider) return;
    try {
      const updates: any = {
        id: editProvider.id,
        company_name: form.company_name,
        owner_name: form.owner_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        status: form.status,
        latitude: form.latitude,
        longitude: form.longitude,
        aadhaar_number: form.aadhaar_number,
        aadhaar_verified: form.aadhaar_verified,
        gst_number: form.gst_number,
        pan_number: form.pan_number,
        bank_account_number: form.bank_account_number,
        bank_name: form.bank_name,
        bank_ifsc: form.bank_ifsc,
        bank_account_name: form.bank_account_name,
        is_verified: form.is_verified
      };
      if (form.city_id && form.city_id !== 'none') updates.city_id = form.city_id;
      if (form.zone_id) updates.zone_id = form.zone_id === 'none' ? null : form.zone_id;
      await updateMut.mutateAsync(updates);
      
      // Update role dynamically based on status
      if (editProvider.user_id) {
        if (form.status === 'active') {
          await supabase
            .from('user_roles')
            .upsert({ user_id: editProvider.user_id, role: 'provider' }, { onConflict: 'user_id,role' });
        } else {
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', editProvider.user_id)
            .eq('role', 'provider');
        }
      }

      toast.success('Provider updated');
      setEditProvider(null);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleCreate = async () => {
    if (!form.company_name || !form.owner_name || !form.email) {
      toast.error('Company name, owner name, and email are required');
      return;
    }
    try {
      await createMut.mutateAsync({
        company_name: form.company_name,
        owner_name: form.owner_name,
        email: form.email,
        phone: form.phone || undefined,
        address: form.address || undefined,
        city_id: form.city_id || undefined,
        zone_id: form.zone_id === 'none' ? undefined : form.zone_id,
        latitude: form.latitude || undefined,
        longitude: form.longitude || undefined,
        status: form.status,
        aadhaar_number: form.aadhaar_number || undefined,
        aadhaar_verified: form.aadhaar_verified,
        gst_number: form.gst_number || undefined,
        pan_number: form.pan_number || undefined,
        bank_account_number: form.bank_account_number || undefined,
        bank_name: form.bank_name || undefined,
        bank_ifsc: form.bank_ifsc || undefined,
        bank_account_name: form.bank_account_name || undefined,
        is_verified: form.is_verified
      } as any);
      toast.success('Provider created');
      setIsAdding(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
      toast.success('Provider deleted');
    } catch (e: any) { toast.error(e.message); }
    setDeleteId(null);
  };

  const statusColor = (s: string) =>
    s === 'active' ? 'bg-success/10 text-success' :
    s === 'pending' ? 'bg-warning/10 text-warning' :
    'bg-destructive/10 text-destructive';

  const cityName = (cityId: string | null) => {
    if (!cityId) return '—';
    const city = cities.find((c: any) => c.id === cityId);
    return city ? city.name : '—';
  };

  const dialogOpen = !!editProvider || isAdding;
  const closeDialog = () => { setEditProvider(null); setIsAdding(false); };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Providers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage, approve & verify service providers</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge className="bg-warning/10 text-warning border-0 gap-1.5 py-1.5 px-3">
              <Shield className="h-3.5 w-3.5" /> {pendingCount} pending approval
            </Badge>
          )}
          <Badge variant="outline" className="text-sm gap-1.5 py-1.5 px-3">
            <Building2 className="h-3.5 w-3.5" /> {providers.length} total
          </Badge>
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Provider
          </Button>
        </div>
      </div>

      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Providers
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Document Review
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search providers..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'active', 'inactive'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                    statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <Card className="border shadow-sm">
              <CardContent className="p-0">
                {filtered.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No providers found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Company</th>
                          <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Owner</th>
                          <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Contact</th>
                          <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">City</th>
                          <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">KYC Verification</th>
                          <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Rating</th>
                          <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                          <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filtered.map((p: any) => (
                          <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-3.5 font-medium text-foreground">
                              <span className="flex items-center gap-1.5">
                                {p.company_name}
                                {p.is_verified && <ShieldCheck className="h-4 w-4 text-primary fill-primary/20" />}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-foreground">{p.owner_name}</td>
                            <td className="px-6 py-3.5">
                              <div className="text-muted-foreground">{p.email}</div>
                              {p.phone && <div className="text-xs text-muted-foreground/70">{p.phone}</div>}
                            </td>
                            <td className="px-6 py-3.5 text-muted-foreground">
                              {cityName(p.city_id)}
                              {p.zone_id && <div className="text-xs opacity-70">{zones.find((z:any)=>z.id===p.zone_id)?.name}</div>}
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="flex flex-col gap-1.5">
                                <span className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-semibold text-muted-foreground">Aadhaar:</span>
                                  {p.aadhaar_verified ? (
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px] py-0 px-2 font-black">Verified</Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-0 text-[10px] py-0 px-2 font-black">Pending</Badge>
                                  )}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-semibold text-muted-foreground">Bank A/C:</span>
                                  {p.bank_account_number ? (
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px] py-0 px-2 font-black">Configured</Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-0 text-[10px] py-0 px-2 font-black">Missing</Badge>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-3.5">
                              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-warning fill-warning" />{p.rating}</span>
                            </td>
                            <td className="px-6 py-3.5">
                              <Badge className={`${statusColor(p.status)} border-0 font-medium capitalize`}>{p.status}</Badge>
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="flex gap-1">
                                {p.status === 'pending' && (
                                  <>
                                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-success border-success/30 hover:bg-success/10" onClick={() => handleApprove(p)}>
                                      <CheckCircle className="h-3 w-3" /> Approve
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleReject(p)}>
                                      <XCircle className="h-3 w-3" /> Reject
                                    </Button>
                                  </>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <AdminDocumentReview />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={o => !o && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isAdding ? 'Add Provider' : 'Edit Provider'}</DialogTitle></DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="basic" className="gap-1.5"><Building2 className="h-4 w-4" /> Basic Profile</TabsTrigger>
              <TabsTrigger value="kyc" className="gap-1.5"><UserCheck className="h-4 w-4" /> Identity KYC</TabsTrigger>
              <TabsTrigger value="finance" className="gap-1.5"><Landmark className="h-4 w-4" /> Payout Banking</TabsTrigger>
            </TabsList>

            {/* TAB 1: BASIC PROFILE */}
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-1.5"><Label>Company Name</Label><Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Owner Name</Label><Input value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              </div>
              
              <div className="space-y-1.5 pt-2">
                <Label>Exact Map Location</Label>
                <GoogleMapsProvider>
                  <LocationPicker 
                    initialLocation={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : undefined}
                    onLocationSelect={(loc) => {
                      setForm(f => ({ 
                        ...f, 
                        latitude: loc.lat, 
                        longitude: loc.lng,
                        address: f.address || loc.address
                      }));
                    }}
                    className="bg-muted/10 p-2 rounded-lg border shadow-sm"
                  />
                </GoogleMapsProvider>
              </div>
              
              <div className="space-y-1.5 pt-2">
                <Label>Street Address</Label>
                <Input 
                  value={form.address} 
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))} 
                  placeholder="Auto-filled from map or enter manually"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Select value={form.city_id} onValueChange={v => setForm(f => ({ ...f, city_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent>
                      {cities.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Service Zone</Label>
                  <Select value={form.zone_id} onValueChange={v => setForm(f => ({ ...f, zone_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Zone</SelectItem>
                      {zones.map((z: any) => (
                        <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label>Duty Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* TAB 2: IDENTITY KYC */}
            <TabsContent value="kyc" className="space-y-5">
              <div className="space-y-1.5">
                <Label>Aadhaar Card Number</Label>
                <Input 
                  value={form.aadhaar_number} 
                  onChange={e => setForm(f => ({ ...f, aadhaar_number: e.target.value }))} 
                  maxLength={12} 
                  placeholder="12 Digit Aadhaar Card Number" 
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
                <div>
                  <Label className="font-bold text-foreground block">Aadhaar Status Verification</Label>
                  <span className="text-[10px] text-muted-foreground">Toggle true to mark this Aadhaar ID as verified</span>
                </div>
                <Switch 
                  checked={form.aadhaar_verified} 
                  onCheckedChange={v => setForm(f => ({ ...f, aadhaar_verified: v }))} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>PAN Card Number</Label>
                  <Input 
                    value={form.pan_number} 
                    onChange={e => setForm(f => ({ ...f, pan_number: e.target.value.toUpperCase() }))} 
                    maxLength={10} 
                    placeholder="e.g. ABCDE1234F" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>GST Identification Number (GSTIN)</Label>
                  <Input 
                    value={form.gst_number} 
                    onChange={e => setForm(f => ({ ...f, gst_number: e.target.value.toUpperCase() }))} 
                    maxLength={15} 
                    placeholder="e.g. 22AAAAA1111A1Z1" 
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: PAYOUT BANKING */}
            <TabsContent value="finance" className="space-y-5">
              <div className="space-y-1.5">
                <Label>Bank Account Holder Name</Label>
                <Input 
                  value={form.bank_account_name} 
                  onChange={e => setForm(f => ({ ...f, bank_account_name: e.target.value }))} 
                  placeholder="e.g. Basant Kumar" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Bank Name</Label>
                  <Input 
                    value={form.bank_name} 
                    onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} 
                    placeholder="e.g. HDFC Bank" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>IFSC Code</Label>
                  <Input 
                    value={form.bank_ifsc} 
                    onChange={e => setForm(f => ({ ...f, bank_ifsc: e.target.value.toUpperCase() }))} 
                    placeholder="e.g. HDFC0000123" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Bank Account Number</Label>
                <Input 
                  value={form.bank_account_number} 
                  onChange={e => setForm(f => ({ ...f, bank_account_number: e.target.value }))} 
                  placeholder="Account Number" 
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20 mt-6">
                <div>
                  <Label className="font-bold text-primary block">Verify Provider Profile Badge</Label>
                  <span className="text-[10px] text-muted-foreground">Toggle to show a blue verification checkmark to customers</span>
                </div>
                <Switch 
                  checked={form.is_verified} 
                  onCheckedChange={v => setForm(f => ({ ...f, is_verified: v }))} 
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 border-t pt-4">
            {isAdding ? (
              <Button onClick={handleCreate} disabled={createMut.isPending}>{createMut.isPending ? 'Creating…' : 'Create Provider'}</Button>
            ) : (
              <Button onClick={handleSave} disabled={updateMut.isPending}>{updateMut.isPending ? 'Saving…' : 'Save'}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete provider?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this provider and may affect related services.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
