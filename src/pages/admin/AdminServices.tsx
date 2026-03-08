import { useServices, useCategories, useProviders } from '@/hooks/useSupabaseData';
import { useCities } from '@/hooks/useCities';
import ImageUpload from '@/components/ImageUpload';
import { useCreateService, useUpdateService, useDeleteService } from '@/hooks/useAdminMutations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Star, Clock, DollarSign, Wrench, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const emptyForm = { name: '', description: '', price: 0, duration: 60, category_id: '', provider_id: '', image_url: '', city_id: '' };

export default function AdminServices() {
  const { data: services = [], isLoading } = useServices();
  const { data: categories = [] } = useCategories();
  const { data: providers = [] } = useProviders();
  const { data: cities = [] } = useCities();
  const createMut = useCreateService();
  const updateMut = useUpdateService();
  const deleteMut = useDeleteService();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  const filtered = services.filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({ name: s.name, description: s.description || '', price: s.price, duration: s.duration, category_id: s.category_id, provider_id: s.provider_id, image_url: s.image_url || '', city_id: s.city_id || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.category_id || !form.provider_id) { toast.error('Name, category, and provider are required'); return; }
    const payload = { ...form, city_id: form.city_id || undefined };
    try {
      if (editId) {
        await updateMut.mutateAsync({ id: editId, ...payload });
        toast.success('Service updated');
      } else {
        await createMut.mutateAsync(payload);
        toast.success('Service created');
      }
      setDialogOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
      toast.success('Service deleted');
    } catch (e: any) { toast.error(e.message); }
    setDeleteId(null);
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all services across providers</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Service
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search services..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <Card className="border shadow-sm">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Wrench className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No services found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Service</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Category</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Provider</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Price</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Duration</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Rating</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((s: any) => (
                      <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3.5">
                          <div>
                            <p className="font-medium text-foreground">{s.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-3.5"><Badge variant="outline" className="text-xs">{s.category?.name || '—'}</Badge></td>
                        <td className="px-6 py-3.5 text-foreground">{s.provider?.company_name || '—'}</td>
                        <td className="px-6 py-3.5">
                          <span className="flex items-center gap-1 font-semibold text-foreground">₹{s.price}</span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" />{s.duration}m</span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-warning fill-warning" />{s.rating}</span>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Service' : 'New Service'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Service name" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Price (₹)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} /></div>
              <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Select value={form.city_id} onValueChange={v => setForm(f => ({ ...f, city_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="All cities" /></SelectTrigger>
                  <SelectContent>
                    {cities.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Provider</Label>
              <Select value={form.provider_id} onValueChange={v => setForm(f => ({ ...f, provider_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  {providers.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Service Image</Label>
              <ImageUpload
                bucket="service-images"
                path={editId ? `${editId}/main` : `new-${Date.now()}/main`}
                currentUrl={form.image_url || null}
                onUpload={(url) => setForm(f => ({ ...f, image_url: url }))}
              />
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete service?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this service.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
