import { useServices, useCategories, useProviders } from '@/hooks/useSupabaseData';
import { useCreateService, useUpdateService, useDeleteService } from '@/hooks/useAdminMutations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Star, Clock, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const emptyForm = { name: '', description: '', price: 0, duration: 60, category_id: '', provider_id: '', image_url: '' };

export default function AdminServices() {
  const { data: services = [], isLoading } = useServices();
  const { data: categories = [] } = useCategories();
  const { data: providers = [] } = useProviders();
  const createMut = useCreateService();
  const updateMut = useUpdateService();
  const deleteMut = useDeleteService();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({ name: s.name, description: s.description || '', price: s.price, duration: s.duration, category_id: s.category_id, provider_id: s.provider_id, image_url: s.image_url || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.category_id || !form.provider_id) { toast.error('Name, category, and provider are required'); return; }
    try {
      if (editId) {
        await updateMut.mutateAsync({ id: editId, ...form });
        toast.success('Service updated');
      } else {
        await createMut.mutateAsync(form);
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Services</h1>
          <p className="text-muted-foreground mt-1">Manage all services across providers</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Service</Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl mt-8" />
      ) : (
        <div className="mt-8 bg-card rounded-xl shadow-card border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Service</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Provider</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Price</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Duration</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Rating</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s: any) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>
                      </div>
                    </td>
                    <td className="p-4"><Badge variant="outline">{s.category?.name || '—'}</Badge></td>
                    <td className="p-4 text-foreground">{s.provider?.company_name || '—'}</td>
                    <td className="p-4"><span className="flex items-center gap-1 text-primary font-medium"><DollarSign className="h-3.5 w-3.5" />{s.price}</span></td>
                    <td className="p-4"><span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" />{s.duration}m</span></td>
                    <td className="p-4"><span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-warning fill-warning" />{s.rating}</span></td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {services.length === 0 && <p className="text-center py-10 text-muted-foreground">No services yet.</p>}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Service' : 'New Service'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price ($)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} /></div>
              <div><Label>Duration (min)</Label><Input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} /></div>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Provider</Label>
              <Select value={form.provider_id} onValueChange={v => setForm(f => ({ ...f, provider_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  {providers.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Image URL (optional)</Label><Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete service?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this service. Existing bookings for it will remain.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
