import { useState } from 'react';
import { useAdminBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from '@/hooks/useBanners';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit, Image } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminBanners() {
  const { data: banners = [], isLoading } = useAdminBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', subtitle: '', image_url: '', link_url: '', display_order: 0 });

  const resetForm = () => {
    setForm({ title: '', subtitle: '', image_url: '', link_url: '', display_order: 0 });
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    try {
      if (editing) {
        await updateBanner.mutateAsync({ id: editing.id, ...form });
        toast.success('Banner updated');
      } else {
        await createBanner.mutateAsync(form);
        toast.success('Banner created');
      }
      resetForm();
      setOpen(false);
    } catch { toast.error('Failed to save banner'); }
  };

  const handleEdit = (b: any) => {
    setEditing(b);
    setForm({ title: b.title, subtitle: b.subtitle || '', image_url: b.image_url || '', link_url: b.link_url || '', display_order: b.display_order });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    await deleteBanner.mutateAsync(id);
    toast.success('Banner deleted');
  };

  const toggleActive = async (b: any) => {
    await updateBanner.mutateAsync({ id: b.id, is_active: !b.is_active });
    toast.success(b.is_active ? 'Banner deactivated' : 'Banner activated');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Promotional Banners</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage homepage promotional banners</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Banner</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Banner' : 'New Banner'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Banner title" />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Optional subtitle" />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label>Link URL</Label>
                <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="/services or https://..." />
              </div>
              <div>
                <Label>Display Order</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
              </div>
              <Button onClick={handleSave} className="w-full" disabled={createBanner.isPending || updateBanner.isPending}>
                {editing ? 'Update' : 'Create'} Banner
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : banners.length === 0 ? (
        <p className="text-center py-16 text-muted-foreground">No banners yet. Create one to show on the homepage.</p>
      ) : (
        <div className="space-y-3">
          {banners.map((b: any) => (
            <Card key={b.id} className="border shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-16 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {b.image_url ? <img src={b.image_url} alt="" className="w-full h-full object-cover" /> : <Image className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{b.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{b.subtitle || '—'}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">Order: {b.display_order}</span>
                <Switch checked={b.is_active} onCheckedChange={() => toggleActive(b)} />
                <Button variant="ghost" size="icon" onClick={() => handleEdit(b)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
