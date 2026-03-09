import { useState, useEffect } from 'react';
import { useZones, useCreateZone, useUpdateZone, useDeleteZone, INDIAN_STATES, ServiceZone } from '@/hooks/useZones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, MapPin, Globe, Building2, Hash, Pencil, Trash2, X } from 'lucide-react';
import GoogleMapsProvider from '@/components/maps/GoogleMapsProvider';
import ZoneMapEditor from '@/components/maps/ZoneMapEditor';

const zoneTypeConfig = {
  all_india: { label: 'All Over India', icon: Globe, color: 'bg-green-500' },
  state: { label: 'State-wise', icon: Building2, color: 'bg-blue-500' },
  pincode: { label: 'Pincode List', icon: Hash, color: 'bg-orange-500' },
  polygon: { label: 'Map Polygon', icon: MapPin, color: 'bg-purple-500' },
};

export default function AdminZones() {
  const { data: zones = [], isLoading, error } = useZones();
  const createZone = useCreateZone();
  const updateZone = useUpdateZone();
  const deleteZone = useDeleteZone();

  const [editingZone, setEditingZone] = useState<ServiceZone | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (error) toast.error(`Failed to load zones: ${(error as Error).message}`);
  }, [error]);

  const handleDelete = (id: string) => {
    if (confirm('Delete this zone? Services and providers in this zone will be unassigned.')) {
      deleteZone.mutate(id, {
        onSuccess: () => toast.success('Zone deleted'),
        onError: (err) => toast.error(err.message),
      });
    }
  };

  const handleToggleActive = (zone: ServiceZone) => {
    updateZone.mutate(
      { id: zone.id, is_active: !zone.is_active },
      {
        onSuccess: () => toast.success(`Zone ${zone.is_active ? 'deactivated' : 'activated'}`),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Service Zones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define areas where your services are available
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Create Zone
        </Button>
      </div>

      {/* Zone cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone) => {
          const config = zoneTypeConfig[zone.zone_type];
          const Icon = config.icon;

          return (
            <Card key={zone.id} className={`relative ${!zone.is_active ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{zone.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{config.label}</p>
                    </div>
                  </div>
                  <Switch
                    checked={zone.is_active}
                    onCheckedChange={() => handleToggleActive(zone)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Zone details */}
                {zone.zone_type === 'state' && zone.state_names.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {zone.state_names.slice(0, 3).map((state) => (
                      <Badge key={state} variant="secondary" className="text-xs">
                        {state}
                      </Badge>
                    ))}
                    {zone.state_names.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{zone.state_names.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {zone.zone_type === 'pincode' && zone.pincodes.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {zone.pincodes.length} pincodes configured
                  </p>
                )}

                {zone.zone_type === 'polygon' && zone.polygon_coordinates && (
                  <p className="text-sm text-muted-foreground">
                    {(zone.polygon_coordinates as any[]).length} boundary points
                  </p>
                )}

                {zone.zone_type === 'all_india' && (
                  <p className="text-sm text-green-600 font-medium">
                    ✓ Serving entire India
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => setEditingZone(zone)}
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(zone.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {zones.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <MapPin className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No zones configured yet</p>
            <p className="text-xs mt-1">Create zones to define your service areas</p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <ZoneFormDialog
        open={isCreateOpen || !!editingZone}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingZone(null);
          }
        }}
        zone={editingZone}
        onSave={(data) => {
          if (editingZone) {
            updateZone.mutate(
              { id: editingZone.id, ...data },
              {
                onSuccess: () => {
                  toast.success('Zone updated');
                  setEditingZone(null);
                },
                onError: (err) => toast.error(err.message),
              }
            );
          } else {
            createZone.mutate(data as any, {
              onSuccess: () => {
                toast.success('Zone created');
                setIsCreateOpen(false);
              },
              onError: (err) => toast.error(err.message),
            });
          }
        }}
      />
    </div>
  );
}

interface ZoneFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: ServiceZone | null;
  onSave: (data: Partial<ServiceZone>) => void;
}

function ZoneFormDialog({ open, onOpenChange, zone, onSave }: ZoneFormDialogProps) {
  const [name, setName] = useState('');
  const [zoneType, setZoneType] = useState<ServiceZone['zone_type']>('polygon');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [pincodes, setPincodes] = useState('');
  const [polygonCoords, setPolygonCoords] = useState<{ lat: number; lng: number }[]>([]);

  useEffect(() => {
    if (zone) {
      setName(zone.name);
      setZoneType(zone.zone_type);
      setSelectedStates(zone.state_names || []);
      setPincodes((zone.pincodes || []).join(', '));
      setPolygonCoords(zone.polygon_coordinates || []);
    } else {
      setName('');
      setZoneType('polygon');
      setSelectedStates([]);
      setPincodes('');
      setPolygonCoords([]);
    }
  }, [zone, open]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Zone name is required');
      return;
    }

    const data: Partial<ServiceZone> = {
      name: name.trim(),
      zone_type: zoneType,
      state_names: zoneType === 'state' ? selectedStates : [],
      pincodes: zoneType === 'pincode' ? pincodes.split(',').map((p) => p.trim()).filter(Boolean) : [],
      polygon_coordinates: zoneType === 'polygon' ? polygonCoords : null,
      is_active: zone?.is_active ?? true,
    };

    // Calculate center for polygon
    if (zoneType === 'polygon' && polygonCoords.length > 0) {
      const lats = polygonCoords.map((p) => p.lat);
      const lngs = polygonCoords.map((p) => p.lng);
      data.center_lat = lats.reduce((a, b) => a + b, 0) / lats.length;
      data.center_lng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
    }

    onSave(data);
  };

  const toggleState = (state: string) => {
    setSelectedStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{zone ? 'Edit Zone' : 'Create New Zone'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>Zone Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Delhi NCR, Bihar"
            />
          </div>

          {/* Zone Type */}
          <div className="space-y-2">
            <Label>Zone Type</Label>
            <Select value={zoneType} onValueChange={(v: any) => setZoneType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_india">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" /> All Over India
                  </div>
                </SelectItem>
                <SelectItem value="state">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> State-wise
                  </div>
                </SelectItem>
                <SelectItem value="pincode">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" /> Pincode List
                  </div>
                </SelectItem>
                <SelectItem value="polygon">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Map Polygon
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Zone Type Specific Fields */}
          {zoneType === 'all_india' && (
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                ✓ This zone will cover all of India
              </p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                Services assigned to this zone will be available everywhere
              </p>
            </div>
          )}

          {zoneType === 'state' && (
            <div className="space-y-3">
              <Label>Select States ({selectedStates.length} selected)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-3 bg-muted/30 rounded-lg">
                {INDIAN_STATES.map((state) => (
                  <div key={state} className="flex items-center gap-2">
                    <Checkbox
                      id={state}
                      checked={selectedStates.includes(state)}
                      onCheckedChange={() => toggleState(state)}
                    />
                    <label htmlFor={state} className="text-sm cursor-pointer">
                      {state}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {zoneType === 'pincode' && (
            <div className="space-y-2">
              <Label>Pincodes (comma-separated)</Label>
              <Input
                value={pincodes}
                onChange={(e) => setPincodes(e.target.value)}
                placeholder="110001, 110002, 110003..."
              />
              <p className="text-xs text-muted-foreground">
                Enter pincodes separated by commas
              </p>
            </div>
          )}

          {zoneType === 'polygon' && (
            <div className="space-y-2">
              <Label>Draw Zone on Map</Label>
              <GoogleMapsProvider>
                <ZoneMapEditor
                  initialPolygon={polygonCoords}
                  onPolygonChange={setPolygonCoords}
                />
              </GoogleMapsProvider>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {zone ? 'Update Zone' : 'Create Zone'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
