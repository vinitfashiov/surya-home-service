import { useProviders } from '@/hooks/useSupabaseData';
import { useUpdateProvider, useDeleteProvider } from '@/hooks/useAdminMutations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminProviders() {
  const { data: providers = [], isLoading } = useProviders();
  const updateMut = useUpdateProvider();
  const deleteMut = useDeleteProvider();

  const [editProvider, setEditProvider] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ company_name: '', owner_name: '', email: '', phone: '', address: '', status: 'pending' });

  const openEdit = (p: any) => {
    setEditProvider(p);
    setForm({ company_name: p.company_name, owner_name: p.owner_name, email: p.email, phone: p.phone || '', address: p.address || '', status: p.status });
  };

  const handleSave = async () => {
    if (!editProvider) return;
    try {
      await updateMut.mutateAsync({ id: editProvider.id, ...form });
      toast.success('Provider updated');
      setEditProvider(null);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Providers</h1>
          <p className="text-muted-foreground mt-1">Manage registered service providers</p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl mt-8" />
      ) : (
        <div className="mt-8 bg-card rounded-xl shadow-card border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Company</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Owner</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Contact</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Rating</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p: any) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4 font-medium text-foreground">{p.company_name}</td>
                    <td className="p-4 text-foreground">{p.owner_name}</td>
                    <td className="p-4 text-muted-foreground">{p.email}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-warning fill-warning" />{p.rating}</span>
                    </td>
                    <td className="p-4">
                      <Badge className={`border-0 ${p.status === 'active' ? 'bg-success/10 text-success' : p.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {providers.length === 0 && <p className="text-center py-10 text-muted-foreground">No providers registered yet.</p>}
        </div>
      )}

      <Dialog open={!!editProvider} onOpenChange={o => !o && setEditProvider(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Provider</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Company Name</Label><Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} /></div>
            <div><Label>Owner Name</Label><Input value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div>
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
          <DialogFooter><Button onClick={handleSave} disabled={updateMut.isPending}>{updateMut.isPending ? 'Saving…' : 'Save'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete provider?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this provider and may affect related services and bookings.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
