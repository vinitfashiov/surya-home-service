import { useAllCities, useCreateCity, useUpdateCity, useDeleteCity } from '@/hooks/useCities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, MapPin, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const emptyForm = { name: '', state: '' };

export default function AdminCities() {
  const { data: cities = [], isLoading, error: citiesError } = useAllCities();

  useEffect(() => {
    if (citiesError) toast.error(`Failed to load cities: ${citiesError.message}`);
  }, [citiesError]);
  const createMut = useCreateCity();
  const updateMut = useUpdateCity();
  const deleteMut = useDeleteCity();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCity, setEditCity] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  const filtered = cities.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.state.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditCity(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: any) => { setEditCity(c); setForm({ name: c.name, state: c.state || '' }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('City name is required'); return; }
    try {
      if (editCity) {
        await updateMut.mutateAsync({ id: editCity.id, ...form });
        toast.success('City updated');
      } else {
        await createMut.mutateAsync(form);
        toast.success('City created');
      }
      setDialogOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleToggleActive = async (city: any) => {
    try {
      await updateMut.mutateAsync({ id: city.id, is_active: !city.is_active });
      toast.success(city.is_active ? 'City deactivated' : 'City activated');
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
      toast.success('City deleted');
    } catch (e: any) { toast.error(e.message); }
    setDeleteId(null);
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Cities / Zones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage service areas</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add City
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search cities..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <Card className="border shadow-sm">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <MapPin className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No cities found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">City</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">State</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((c: any) => (
                      <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" /> {c.name}
                        </td>
                        <td className="px-6 py-3.5 text-muted-foreground">{c.state || '—'}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <Switch checked={c.is_active} onCheckedChange={() => handleToggleActive(c)} />
                            <Badge className={`border-0 font-medium ${c.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                              {c.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
          <DialogHeader><DialogTitle>{editCity ? 'Edit City' : 'New City'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>City Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mumbai" /></div>
            <div className="space-y-1.5"><Label>State</Label><Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="e.g. Maharashtra" /></div>
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete city?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this city.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
