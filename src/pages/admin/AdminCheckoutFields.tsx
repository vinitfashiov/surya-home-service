import { useCategories } from '@/hooks/useSupabaseData';
import {
  useAllCheckoutFields,
  useCreateCheckoutField,
  useUpdateCheckoutField,
  useDeleteCheckoutField,
  CheckoutField,
} from '@/hooks/useCheckoutFields';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ListChecks, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'location', label: 'Location' },
];

const emptyForm = {
  category_id: '',
  field_name: '',
  field_label: '',
  field_type: 'text',
  options: [] as string[],
  is_required: false,
  display_order: 0,
  placeholder: '',
};

export default function AdminCheckoutFields() {
  const { data: categories = [], isLoading: catLoading } = useCategories();
  const { data: fields = [], isLoading: fieldsLoading } = useAllCheckoutFields();
  const createMut = useCreateCheckoutField();
  const updateMut = useUpdateCheckoutField();
  const deleteMut = useDeleteCheckoutField();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [optionsText, setOptionsText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const isLoading = catLoading || fieldsLoading;

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setOptionsText('');
    setDialogOpen(true);
  };

  const openEdit = (f: CheckoutField) => {
    setEditId(f.id);
    const opts = (f.options || []).map((o: any) => (typeof o === 'string' ? o : o.label || o.value || ''));
    setForm({
      category_id: f.category_id,
      field_name: f.field_name,
      field_label: f.field_label,
      field_type: f.field_type,
      options: opts,
      is_required: f.is_required,
      display_order: f.display_order,
      placeholder: f.placeholder || '',
    });
    setOptionsText(opts.join('\n'));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.category_id || !form.field_name.trim() || !form.field_label.trim()) {
      toast.error('Category, name, and label are required');
      return;
    }
    const options = form.field_type === 'select'
      ? optionsText.split('\n').map(s => s.trim()).filter(Boolean)
      : [];
    const payload = { ...form, options } as any;
    try {
      if (editId) {
        await updateMut.mutateAsync({ id: editId, ...payload });
        toast.success('Field updated');
      } else {
        await createMut.mutateAsync(payload);
        toast.success('Field created');
      }
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
      toast.success('Field deleted');
    } catch (e: any) {
      toast.error(e.message);
    }
    setDeleteId(null);
  };

  const filteredFields = filterCategory === 'all'
    ? fields
    : fields.filter(f => f.category_id === filterCategory);

  const getCategoryName = (id: string) => categories.find((c: any) => c.id === id)?.name || 'Unknown';

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Checkout Fields</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure custom checkout fields per category</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Field
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Label className="text-sm text-muted-foreground">Filter by category:</Label>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filteredFields.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="text-center py-16">
            <ListChecks className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No checkout fields configured yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Add fields to customize checkout forms per service category.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredFields.map((field) => (
            <Card key={field.id} className="border shadow-sm hover:shadow-md transition-shadow group">
              <CardContent className="p-4 flex items-center gap-4">
                <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground text-sm">{field.field_label}</span>
                    <Badge variant="outline" className="text-xs">{field.field_type}</Badge>
                    {field.is_required && <Badge className="bg-destructive/10 text-destructive border-0 text-xs">Required</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getCategoryName(field.category_id)} · <code className="text-xs">{field.field_name}</code>
                    {field.placeholder && ` · "${field.placeholder}"`}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(field)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(field.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Field' : 'New Checkout Field'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Field Name (key)</Label>
                <Input
                  value={form.field_name}
                  onChange={e => setForm(f => ({ ...f, field_name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                  placeholder="e.g. guest_count"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Display Label</Label>
                <Input
                  value={form.field_label}
                  onChange={e => setForm(f => ({ ...f, field_label: e.target.value }))}
                  placeholder="e.g. Number of Guests"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Field Type</Label>
                <Select value={form.field_type} onValueChange={v => setForm(f => ({ ...f, field_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map(ft => (
                      <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))}
                  min={0}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Placeholder</Label>
              <Input
                value={form.placeholder}
                onChange={e => setForm(f => ({ ...f, placeholder: e.target.value }))}
                placeholder="Hint text for the field..."
              />
            </div>
            {form.field_type === 'select' && (
              <div className="space-y-1.5">
                <Label>Options (one per line)</Label>
                <Textarea
                  value={optionsText}
                  onChange={e => setOptionsText(e.target.value)}
                  placeholder={"Option 1\nOption 2\nOption 3"}
                  rows={4}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_required}
                onCheckedChange={v => setForm(f => ({ ...f, is_required: v }))}
              />
              <Label className="text-sm">Required field</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this field?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this checkout field.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
