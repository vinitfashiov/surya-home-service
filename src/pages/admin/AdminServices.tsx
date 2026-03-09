import { useServices, useCategories, useProviders } from '@/hooks/useSupabaseData';
import { useCities } from '@/hooks/useCities';
import ImageUpload from '@/components/ImageUpload';
import { useCreateService, useUpdateService, useDeleteService } from '@/hooks/useAdminMutations';
import { useAllServiceVariants, useCreateVariant, useUpdateVariant, useDeleteVariant, ServiceVariant } from '@/hooks/useSubcategoriesVariants';
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
import { Separator } from '@/components/ui/separator';
import { Plus, Pencil, Trash2, Star, Clock, Wrench, Search, Package, Percent } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const emptyForm = {
  name: '', description: '', price: 0, duration: 60,
  category_id: '', provider_id: '', image_url: '', city_id: '',
  tax_rate: 0, tax_type: 'none' as string,
};

export default function AdminServices() {
  const { data: services = [], isLoading, error: servicesError } = useServices();
  const { data: categories = [], error: categoriesError } = useCategories();
  const { data: providers = [], error: providersError } = useProviders();
  const { data: cities = [], error: citiesError } = useCities();

  useEffect(() => {
    if (servicesError) toast.error(`Failed to load services: ${servicesError.message}`);
    if (categoriesError) toast.error(`Failed to load categories: ${categoriesError.message}`);
    if (providersError) toast.error(`Failed to load providers: ${providersError.message}`);
    if (citiesError) toast.error(`Failed to load cities: ${citiesError.message}`);
  }, [servicesError, categoriesError, providersError, citiesError]);

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
    setForm({
      name: s.name, description: s.description || '', price: s.price, duration: s.duration,
      category_id: s.category_id, provider_id: s.provider_id, image_url: s.image_url || '',
      city_id: s.city_id || '',
      tax_rate: s.tax_rate || 0, tax_type: s.tax_type || 'none',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.category_id || !form.provider_id) {
      toast.error('Name, category, and provider are required'); return;
    }
    const payload = { ...form, city_id: form.city_id || undefined };
    try {
      if (editId) {
        await updateMut.mutateAsync({ id: editId, ...payload });
        toast.success('Service updated');
      } else {
        const newService = await createMut.mutateAsync(payload);
        setEditId(newService.id); // Keep dialog open for variant adding
        toast.success('Service created! Now add variants below.');
        return; // Don't close dialog
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
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Tax</th>
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
                          <span className="font-semibold text-foreground">₹{s.price}</span>
                        </td>
                        <td className="px-6 py-3.5">
                          {s.tax_type && s.tax_type !== 'none' ? (
                            <Badge variant="secondary" className="text-xs">
                              {s.tax_type.toUpperCase()} {s.tax_rate}%
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Service' : 'New Service'}</DialogTitle></DialogHeader>
          <div className="space-y-5">
            {/* Basic Info */}
            <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Service name" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." rows={3} /></div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Base Price (₹)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} /></div>
              <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} /></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Select value={form.city_id} onValueChange={v => setForm(f => ({ ...f, city_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="All cities" /></SelectTrigger>
                  <SelectContent>{cities.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Provider</Label>
              <Select value={form.provider_id} onValueChange={v => setForm(f => ({ ...f, provider_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>{providers.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Tax / GST */}
            <Separator />
            <div>
              <h4 className="font-heading font-semibold text-foreground flex items-center gap-2 mb-3">
                <Percent className="h-4 w-4 text-primary" /> Tax & GST (Optional)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tax Type</Label>
                  <Select value={form.tax_type} onValueChange={v => setForm(f => ({ ...f, tax_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Tax</SelectItem>
                      <SelectItem value="gst">GST</SelectItem>
                      <SelectItem value="igst">IGST</SelectItem>
                      <SelectItem value="cgst_sgst">CGST + SGST</SelectItem>
                      <SelectItem value="custom">Custom Tax</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={form.tax_rate}
                    onChange={e => setForm(f => ({ ...f, tax_rate: Number(e.target.value) }))}
                    disabled={form.tax_type === 'none'}
                    placeholder="e.g. 18"
                  />
                </div>
              </div>
              {form.tax_type !== 'none' && form.tax_rate > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Tax amount on base price: ₹{Math.round(form.price * form.tax_rate / 100)} ({form.tax_type.toUpperCase()} @ {form.tax_rate}%)
                </p>
              )}
            </div>

            {/* Service Image */}
            <div className="space-y-1.5">
              <Label>Service Image</Label>
              <ImageUpload
                bucket="service-images"
                path={editId ? `${editId}/main` : `new-${Date.now()}/main`}
                currentUrl={form.image_url || null}
                onUpload={(url) => setForm(f => ({ ...f, image_url: url }))}
              />
            </div>

            {/* Save service button */}
            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? 'Saving…' : editId ? 'Update Service' : 'Create Service'}
            </Button>

            {/* Variants Section - only show after service is saved */}
            {editId && (
              <>
                <Separator />
                <VariantManager serviceId={editId} />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete service?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this service and its variants.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---- Inline Variant Manager ----
function VariantManager({ serviceId }: { serviceId: string }) {
  const { data: variants = [], isLoading } = useAllServiceVariants(serviceId);
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();
  const deleteVariant = useDeleteVariant();

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState(0);
  const [newDuration, setNewDuration] = useState(60);
  const [newDesc, setNewDesc] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) { toast.error('Variant name is required'); return; }
    try {
      await createVariant.mutateAsync({
        service_id: serviceId,
        name: newName.trim(),
        description: newDesc,
        price: newPrice,
        duration: newDuration,
      });
      toast.success('Variant added');
      setNewName(''); setNewPrice(0); setNewDuration(60); setNewDesc('');
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this variant?')) return;
    try {
      await deleteVariant.mutateAsync(id);
      toast.success('Variant deleted');
    } catch (e: any) { toast.error(e.message); }
  };

  const handleUpdate = async (variant: ServiceVariant, field: string, value: any) => {
    try {
      await updateVariant.mutateAsync({ id: variant.id, [field]: value });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <h4 className="font-heading font-semibold text-foreground flex items-center gap-2 mb-3">
        <Package className="h-4 w-4 text-primary" /> Service Variants / Sub-services
      </h4>
      <p className="text-xs text-muted-foreground mb-4">
        Add variations like SUV, Sedan, Hatchback or Basic, Premium, Luxury with different pricing
      </p>

      {/* Add new variant */}
      <div className="border rounded-lg p-4 bg-muted/20 space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Variant Name *</Label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. SUV, Premium, Luxury Bus" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Optional description" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Price (₹)</Label>
            <Input type="number" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Duration (min)</Label>
            <Input type="number" value={newDuration} onChange={e => setNewDuration(Number(e.target.value))} />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAdd} disabled={createVariant.isPending} className="w-full gap-1.5">
              <Plus className="h-4 w-4" /> Add Variant
            </Button>
          </div>
        </div>
      </div>

      {/* Existing variants table */}
      {isLoading ? (
        <Skeleton className="h-20 rounded-lg" />
      ) : variants.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm border rounded-lg border-dashed">
          <Package className="h-6 w-6 mx-auto mb-2 opacity-40" />
          <p>No variants yet. Add variants above.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs uppercase">Variant</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs uppercase">Price (₹)</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs uppercase">Duration</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs uppercase">Active</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {variants.map((v: any) => (
                <tr key={v.id} className="hover:bg-muted/10">
                  <td className="px-4 py-2">
                    <div>
                      <p className="font-medium text-foreground">{v.name}</p>
                      {v.description && <p className="text-xs text-muted-foreground">{v.description}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      className="w-24 h-8 text-sm"
                      defaultValue={v.price}
                      onBlur={e => {
                        const val = Number(e.target.value);
                        if (val !== v.price) handleUpdate(v, 'price', val);
                      }}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      className="w-20 h-8 text-sm"
                      defaultValue={v.duration}
                      onBlur={e => {
                        const val = Number(e.target.value);
                        if (val !== v.duration) handleUpdate(v, 'duration', val);
                      }}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Badge
                      variant={v.is_active ? 'default' : 'secondary'}
                      className="cursor-pointer text-xs"
                      onClick={() => handleUpdate(v, 'is_active', !v.is_active)}
                    >
                      {v.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(v.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
