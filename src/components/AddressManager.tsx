import { useMyAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress } from '@/hooks/useAddresses';
import { useCities } from '@/hooks/useCities';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { toast } from 'sonner';
import GoogleMapsProvider from '@/components/maps/GoogleMapsProvider';
import LocationPicker from '@/components/maps/LocationPicker';

const emptyForm = { label: 'Home', address_line: '', city_id: '', pincode: '', is_default: false, latitude: null as number | null, longitude: null as number | null };

interface AddressManagerProps {
  userId: string;
  selectable?: boolean;
  selectedAddressId?: string;
  onSelect?: (address: any) => void;
}

export default function AddressManager({ userId, selectable, selectedAddressId, onSelect }: AddressManagerProps) {
  const { data: addresses = [] } = useMyAddresses(userId);
  const { data: cities = [] } = useCities();
  const createMut = useCreateAddress();
  const updateMut = useUpdateAddress();
  const deleteMut = useDeleteAddress();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAddr, setEditAddr] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => { setEditAddr(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (a: any) => {
    setEditAddr(a);
    setForm({
      label: a.label,
      address_line: a.address_line,
      city_id: a.city_id || '',
      pincode: a.pincode || '',
      is_default: a.is_default,
      latitude: a.latitude ? Number(a.latitude) : null,
      longitude: a.longitude ? Number(a.longitude) : null,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.address_line.trim()) { toast.error('Address is required'); return; }
    try {
      const payload = {
        user_id: userId,
        label: form.label,
        address_line: form.address_line,
        city_id: form.city_id || undefined,
        pincode: form.pincode || undefined,
        is_default: form.is_default,
        latitude: form.latitude,
        longitude: form.longitude,
      };
      if (editAddr) {
        await updateMut.mutateAsync({ id: editAddr.id, ...payload });
        toast.success('Address updated');
      } else {
        await createMut.mutateAsync(payload);
        toast.success('Address added');
      }
      setDialogOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id);
      toast.success('Address removed');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-foreground text-sm">
          {selectable ? 'Select Address' : 'My Addresses'}
        </h3>
        <Button variant="outline" size="sm" onClick={openCreate} className="gap-1.5 h-8">
          <Plus className="h-3.5 w-3.5" /> Add New
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg border-dashed">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>No addresses saved yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {addresses.map((a: any) => (
            <div
              key={a.id}
              onClick={() => selectable && onSelect?.(a)}
              className={`border rounded-lg p-3 transition-all ${
                selectable ? 'cursor-pointer hover:border-primary' : ''
              } ${selectedAddressId === a.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs shrink-0">{a.label}</Badge>
                    {a.is_default && (
                      <Badge className="bg-primary/10 text-primary border-0 text-xs gap-1">
                        <Star className="h-2.5 w-2.5 fill-current" /> Default
                      </Badge>
                    )}
                    {a.latitude && a.longitude && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <MapPin className="h-2.5 w-2.5" /> GPS
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground mt-1.5">{a.address_line}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {a.city?.name && <span>{a.city.name}</span>}
                    {a.pincode && <span>• {a.pincode}</span>}
                  </div>
                </div>
                {!selectable && (
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editAddr ? 'Edit Address' : 'New Address'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Map picker for location */}
            <div className="space-y-1.5">
              <Label>📍 Pick Location on Map</Label>
              <p className="text-xs text-muted-foreground">Search or click on map to set your exact location. This helps verify serviceability.</p>
              <GoogleMapsProvider>
                <LocationPicker
                  initialLocation={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : undefined}
                  onLocationSelect={(loc) => {
                    setForm(f => ({
                      ...f,
                      address_line: loc.address,
                      pincode: loc.pincode || f.pincode,
                      latitude: loc.lat,
                      longitude: loc.lng,
                    }));
                  }}
                />
              </GoogleMapsProvider>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Label</Label>
                <Select value={form.label} onValueChange={v => setForm(f => ({ ...f, label: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Work">Work</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            </div>
            <div className="space-y-1.5">
              <Label>Full Address</Label>
              <Textarea
                value={form.address_line}
                onChange={e => setForm(f => ({ ...f, address_line: e.target.value }))}
                placeholder="Enter full address..."
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pincode</Label>
              <Input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="e.g. 800001" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_default} onCheckedChange={v => setForm(f => ({ ...f, is_default: v }))} />
              <Label>Set as default address</Label>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
