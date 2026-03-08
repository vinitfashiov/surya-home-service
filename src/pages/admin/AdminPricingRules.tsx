import { useState } from 'react';
import { useServices } from '@/hooks/useSupabaseData';
import { useAllPricingRulesForService, useCreatePricingRule, useUpdatePricingRule, useDeletePricingRule, RULE_TYPES, PricingRule } from '@/hooks/usePricingRules';
import { useCategoryCheckoutFields } from '@/hooks/useCheckoutFields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, DollarSign, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPricingRules() {
  const { data: services = [], isLoading: svcLoading } = useServices();
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const selectedService = services.find((s: any) => s.id === selectedServiceId);
  const { data: rules = [], isLoading: rulesLoading } = useAllPricingRulesForService(selectedServiceId || undefined);
  const categoryIds = selectedService ? [selectedService.category_id] : [];
  const { data: checkoutFields = [] } = useCategoryCheckoutFields(categoryIds);

  const createRule = useCreatePricingRule();
  const updateRule = useUpdatePricingRule();
  const deleteRule = useDeletePricingRule();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PricingRule | null>(null);
  const [form, setForm] = useState({
    rule_type: 'flat',
    base_price: 0,
    unit_price: 0,
    unit_label: 'unit',
    min_units: 0,
    max_units: '',
    linked_field_name: '',
  });

  const resetForm = () => {
    setForm({ rule_type: 'flat', base_price: 0, unit_price: 0, unit_label: 'unit', min_units: 0, max_units: '', linked_field_name: '' });
    setEditing(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (r: PricingRule) => {
    setEditing(r);
    setForm({
      rule_type: r.rule_type,
      base_price: r.base_price,
      unit_price: r.unit_price,
      unit_label: r.unit_label,
      min_units: r.min_units ?? 0,
      max_units: r.max_units != null ? String(r.max_units) : '',
      linked_field_name: r.linked_field_name || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedServiceId) return;
    const payload = {
      service_id: selectedServiceId,
      rule_type: form.rule_type,
      base_price: form.base_price,
      unit_price: form.unit_price,
      unit_label: form.unit_label,
      min_units: form.min_units,
      max_units: form.max_units ? Number(form.max_units) : null,
      linked_field_name: form.linked_field_name || null,
      is_active: true,
    };
    try {
      if (editing) {
        await updateRule.mutateAsync({ id: editing.id, ...payload });
        toast.success('Rule updated');
      } else {
        await createRule.mutateAsync(payload);
        toast.success('Rule created');
      }
      setDialogOpen(false);
      resetForm();
    } catch { toast.error('Failed to save rule'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pricing rule?')) return;
    await deleteRule.mutateAsync(id);
    toast.success('Rule deleted');
  };

  const toggleActive = async (r: PricingRule) => {
    await updateRule.mutateAsync({ id: r.id, is_active: !r.is_active });
    toast.success(r.is_active ? 'Rule deactivated' : 'Rule activated');
  };

  const isPerUnit = form.rule_type !== 'flat';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Dynamic Pricing Rules</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure per-hour, per-km, per-guest pricing for services</p>
        </div>
      </div>

      {/* Service selector */}
      <Card className="border shadow-sm mb-6">
        <CardContent className="p-4">
          <Label className="text-sm mb-2 block">Select a service to manage its pricing rules</Label>
          <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Choose a service..." />
            </SelectTrigger>
            <SelectContent>
              {services.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} — ₹{s.price} (base)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedServiceId && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-heading font-semibold text-foreground">
                Rules for: {selectedService?.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                Base service price: ₹{selectedService?.price} · If no active rules exist, the base price is used.
              </p>
            </div>
            <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 mr-1" /> Add Rule</Button>
          </div>

          {rulesLoading ? (
            <Skeleton className="h-32 rounded-xl" />
          ) : rules.length === 0 ? (
            <Card className="border shadow-sm">
              <CardContent className="p-10 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">No pricing rules. The service uses its base price (₹{selectedService?.price}).</p>
                <Button onClick={openCreate} size="sm" className="mt-4"><Plus className="h-4 w-4 mr-1" /> Create First Rule</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rules.map((r: any) => (
                <Card key={r.id} className={`border shadow-sm ${!r.is_active ? 'opacity-50' : ''}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{RULE_TYPES.find(t => t.value === r.rule_type)?.label || r.rule_type}</Badge>
                        {r.linked_field_name && (
                          <Badge variant="outline" className="text-xs">
                            <Link2 className="h-3 w-3 mr-1" />linked to: {r.linked_field_name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {r.base_price > 0 ? `Base: ₹${r.base_price}` : ''}
                        {r.base_price > 0 && r.unit_price > 0 ? ' + ' : ''}
                        {r.unit_price > 0 ? `₹${r.unit_price}/${r.unit_label}` : ''}
                        {r.min_units ? ` · Min: ${r.min_units}` : ''}
                        {r.max_units ? ` · Max: ${r.max_units}` : ''}
                      </p>
                    </div>
                    <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r)} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Linked checkout fields info */}
          {checkoutFields.length > 0 && (
            <Card className="border shadow-sm mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading">Available Checkout Fields to Link</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-xs text-muted-foreground mb-2">
                  These fields are defined for this service's category. Use the <code className="bg-muted px-1 rounded">field_name</code> to link a pricing rule to a checkout field value.
                </p>
                <div className="flex flex-wrap gap-2">
                  {checkoutFields.map((f: any) => (
                    <Badge key={f.id} variant="outline" className="text-xs">
                      {f.field_name} ({f.field_type}) — "{f.field_label}"
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Pricing Rule' : 'New Pricing Rule'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Rule Type</Label>
              <Select value={form.rule_type} onValueChange={(v) => setForm({ ...form, rule_type: v, unit_label: v === 'per_hour' ? 'hour' : v === 'per_km' ? 'km' : v === 'per_guest' ? 'guest' : v === 'per_day' ? 'day' : v === 'per_room' ? 'room' : 'unit' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RULE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Base Price (₹)</Label>
              <Input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })} placeholder="e.g. 50 (base fare)" />
              <p className="text-xs text-muted-foreground mt-1">Fixed starting amount before per-unit calculation</p>
            </div>
            {isPerUnit && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Price per Unit (₹)</Label>
                    <Input type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })} placeholder="e.g. 12" />
                  </div>
                  <div>
                    <Label>Unit Label</Label>
                    <Input value={form.unit_label} onChange={(e) => setForm({ ...form, unit_label: e.target.value })} placeholder="km, hour, guest..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Min Units</Label>
                    <Input type="number" value={form.min_units} onChange={(e) => setForm({ ...form, min_units: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Max Units (optional)</Label>
                    <Input type="number" value={form.max_units} onChange={(e) => setForm({ ...form, max_units: e.target.value })} placeholder="No limit" />
                  </div>
                </div>
                <div>
                  <Label>Linked Checkout Field Name</Label>
                  {checkoutFields.length > 0 ? (
                    <Select value={form.linked_field_name} onValueChange={(v) => setForm({ ...form, linked_field_name: v })}>
                      <SelectTrigger><SelectValue placeholder="Select field..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {checkoutFields.map((f: any) => (
                          <SelectItem key={f.id} value={f.field_name}>{f.field_label} ({f.field_name})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={form.linked_field_name} onChange={(e) => setForm({ ...form, linked_field_name: e.target.value })} placeholder="e.g. distance_km, guest_count" />
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    The checkout field whose value determines the number of units
                  </p>
                </div>
              </>
            )}
            <Button onClick={handleSave} className="w-full" disabled={createRule.isPending || updateRule.isPending}>
              {editing ? 'Update' : 'Create'} Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
