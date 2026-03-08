import { useCategories } from '@/hooks/useSupabaseData';
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useAdminMutations';
import { Scissors, Zap, Droplets, SprayCan, Wrench, Paintbrush, Bug, Hammer, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner';

const iconOptions = ['Scissors', 'Zap', 'Droplets', 'SprayCan', 'Wrench', 'Paintbrush', 'Bug', 'Hammer'];
const iconMap: Record<string, React.ElementType> = { Scissors, Zap, Droplets, SprayCan, Wrench, Paintbrush, Bug, Hammer };

const emptyForm = { name: '', description: '', icon: 'Wrench' };

export default function AdminCategories() {
  const { data: categories = [], isLoading } = useCategories();
  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();
  const deleteMut = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (cat: any) => { setEditId(cat.id); setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || 'Wrench' }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    try {
      if (editId) {
        await updateMut.mutateAsync({ id: editId, ...form });
        toast.success('Category updated');
      } else {
        await createMut.mutateAsync(form);
        toast.success('Category created');
      }
      setDialogOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
      toast.success('Category deleted');
    } catch (e: any) { toast.error(e.message); }
    setDeleteId(null);
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground mt-1">Manage service categories</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {categories.map((cat: any) => {
            const Icon = iconMap[cat.icon] || Wrench;
            return (
              <div key={cat.id} className="bg-card rounded-xl p-5 shadow-card border flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-foreground">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground">{cat.description}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            );
          })}
          {categories.length === 0 && <p className="text-muted-foreground col-span-full text-center py-10">No categories yet.</p>}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Category' : 'New Category'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div>
              <Label>Icon</Label>
              <Select value={form.icon} onValueChange={v => setForm(f => ({ ...f, icon: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {iconOptions.map(ic => { const I = iconMap[ic]; return <SelectItem key={ic} value={ic}><span className="flex items-center gap-2"><I className="h-4 w-4" />{ic}</span></SelectItem>; })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete category?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this category. Services in this category may become orphaned.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
