import { useCategories } from '@/hooks/useSupabaseData';
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useAdminMutations';
import ImageUpload from '@/components/ImageUpload';
import { Scissors, Zap, Droplets, SprayCan, Wrench, Paintbrush, Bug, Hammer, Plus, Pencil, Trash2, FolderTree, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const categoryTypes = [
  { value: 'standard', label: 'Standard (Date + Time + Address)' },
  { value: 'event', label: 'Event (Date + Time + Venue + Guests)' },
  { value: 'transport', label: 'Transport (Pickup + Drop + Date)' },
  { value: 'accommodation', label: 'Accommodation (Check-in/out + Rooms)' },
  { value: 'virtual', label: 'Virtual (Date + Time, No Address)' },
];

const emptyForm = { name: '', description: '', icon: 'Wrench', commission_rate: 20, category_type: 'standard' };

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
  const openEdit = (cat: any) => {
    setEditId(cat.id);
    setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || 'Wrench', commission_rate: cat.commission_rate ?? 20, category_type: cat.category_type || 'standard' });
    setDialogOpen(true);
  };

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage service categories & commission rates</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : categories.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="text-center py-16">
            <FolderTree className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No categories yet. Create your first category.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat: any) => {
            const Icon = iconMap[cat.icon] || Wrench;
            return (
              <Card key={cat.id} className="border shadow-sm hover:shadow-md transition-shadow group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-semibold text-foreground">{cat.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{cat.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                       <Badge className="bg-accent/10 text-accent border-0 text-xs gap-1">
                         <Percent className="h-2.5 w-2.5" /> {cat.commission_rate ?? 20}%
                       </Badge>
                       <Badge variant="secondary" className="text-xs capitalize">
                         {cat.category_type || 'standard'}
                       </Badge>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(cat.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Category' : 'New Category'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Plumbing" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Icon</Label>
                <Select value={form.icon} onValueChange={v => setForm(f => ({ ...f, icon: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(ic => { const I = iconMap[ic]; return <SelectItem key={ic} value={ic}><span className="flex items-center gap-2"><I className="h-4 w-4" />{ic}</span></SelectItem>; })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Commission Rate (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.commission_rate}
                  onChange={e => setForm(f => ({ ...f, commission_rate: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Category Type</Label>
              <Select value={form.category_type} onValueChange={v => setForm(f => ({ ...f, category_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoryTypes.map(ct => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Controls which checkout sections appear for this category's services</p>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete category?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this category.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
