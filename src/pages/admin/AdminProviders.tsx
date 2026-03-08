import { useProviders } from '@/hooks/useSupabaseData';
import { useUpdateProvider, useDeleteProvider, useCreateProvider } from '@/hooks/useAdminMutations';
import { useCreateNotification } from '@/hooks/useNotifications';
import { useCities } from '@/hooks/useCities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Pencil, Trash2, Building2, Search, CheckCircle, XCircle, Shield, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner';

const emptyForm = { company_name: '', owner_name: '', email: '', phone: '', address: '', status: 'pending', city_id: '' };

export default function AdminProviders() {
  const { data: providers = [], isLoading } = useProviders();
  const { data: cities = [] } = useCities();
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
    setForm({ company_name: p.company_name, owner_name: p.owner_name, email: p.email, phone: p.phone || '', address: p.address || '', status: p.status, city_id: p.city_id || '' });
  };

  const openAdd = () => {
    setEditProvider(null);
    setIsAdding(true);
    setForm({ ...emptyForm, status: 'active' });
  };

  const handleApprove = async (provider: any) => {
    try {
      await updateMut.mutateAsync({ id: provider.id, status: 'active' });
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
      const updates: any = { id: editProvider.id, company_name: form.company_name, owner_name: form.owner_name, email: form.email, phone: form.phone, address: form.address, status: form.status };
      if (form.city_id) updates.city_id = form.city_id;
      await updateMut.mutateAsync(updates);
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
        status: form.status,
      });
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
          <p className="text-sm text-muted-foreground mt-0.5">Manage & approve service providers</p>
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
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Rating</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((p: any) => (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-foreground">{p.company_name}</td>
                        <td className="px-6 py-3.5 text-foreground">{p.owner_name}</td>
                        <td className="px-6 py-3.5">
                          <div className="text-muted-foreground">{p.email}</div>
                          {p.phone && <div className="text-xs text-muted-foreground/70">{p.phone}</div>}
                        </td>
                        <td className="px-6 py-3.5 text-muted-foreground">{cityName(p.city_id)}</td>
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

      <Dialog open={dialogOpen} onOpenChange={o => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isAdding ? 'Add Provider' : 'Edit Provider'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Company Name</Label><Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Owner Name</Label><Input value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
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
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
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
