import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Ticket, Calendar, Percent, Hash, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useCoupons() {
  return useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (coupon: any) => {
      const { data, error } = await supabase.from('coupons').insert(coupon).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });
}

function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('coupons').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });
}

function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });
}

const emptyForm = {
  code: '',
  discount_type: 'percentage',
  discount_value: 10,
  min_order_amount: 0,
  max_discount: '',
  usage_limit: '',
  expires_at: '',
  is_active: true,
};

export default function AdminCoupons() {
  const { data: coupons = [], isLoading } = useCoupons();
  const createMut = useCreateCoupon();
  const updateMut = useUpdateCoupon();
  const deleteMut = useDeleteCoupon();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_amount: c.min_order_amount,
      max_discount: c.max_discount?.toString() || '',
      usage_limit: c.usage_limit?.toString() || '',
      expires_at: c.expires_at ? new Date(c.expires_at).toISOString().split('T')[0] : '',
      is_active: c.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) { toast.error('Coupon code is required'); return; }
    if (form.discount_value <= 0) { toast.error('Discount value must be positive'); return; }
    const payload: any = {
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order_amount: Number(form.min_order_amount) || 0,
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: form.is_active,
    };
    try {
      if (editId) {
        await updateMut.mutateAsync({ id: editId, ...payload });
        toast.success('Coupon updated');
      } else {
        await createMut.mutateAsync(payload);
        toast.success('Coupon created');
      }
      setDialogOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
      toast.success('Coupon deleted');
    } catch (e: any) { toast.error(e.message); }
    setDeleteId(null);
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Coupons</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage discount codes and promotions</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Coupon
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : coupons.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="text-center py-16">
            <Ticket className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No coupons yet. Create your first coupon.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon: any) => {
            const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
            const usageFull = coupon.usage_limit && coupon.used_count >= coupon.usage_limit;
            return (
              <Card key={coupon.id} className="border shadow-sm hover:shadow-md transition-shadow group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {coupon.code}
                        </code>
                      </div>
                      <p className="text-sm text-foreground mt-2 font-medium">
                        {coupon.discount_type === 'percentage'
                          ? `${coupon.discount_value}% off`
                          : `₹${coupon.discount_value} off`}
                        {coupon.max_discount && coupon.discount_type === 'percentage' && (
                          <span className="text-muted-foreground font-normal"> (max ₹{coupon.max_discount})</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(coupon)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(coupon.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <Badge variant={coupon.is_active && !isExpired && !usageFull ? 'default' : 'secondary'} className="text-xs">
                      {!coupon.is_active ? 'Inactive' : isExpired ? 'Expired' : usageFull ? 'Fully Used' : 'Active'}
                    </Badge>
                    {coupon.min_order_amount > 0 && (
                      <Badge variant="outline" className="text-xs">Min ₹{coupon.min_order_amount}</Badge>
                    )}
                    {coupon.usage_limit && (
                      <Badge variant="outline" className="text-xs">
                        {coupon.used_count}/{coupon.usage_limit} used
                      </Badge>
                    )}
                  </div>

                  {coupon.expires_at && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Expires: {new Date(coupon.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Coupon' : 'New Coupon'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Coupon Code</Label>
              <Input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SAVE20"
                className="font-mono uppercase"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Discount Type</Label>
                <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <span className="flex items-center gap-2"><Percent className="h-3.5 w-3.5" /> Percentage</span>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <span className="flex items-center gap-2"><DollarSign className="h-3.5 w-3.5" /> Fixed Amount</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Discount Value {form.discount_type === 'percentage' ? '(%)' : '(₹)'}</Label>
                <Input
                  type="number"
                  value={form.discount_value}
                  onChange={e => setForm(f => ({ ...f, discount_value: Number(e.target.value) }))}
                  min={0}
                  max={form.discount_type === 'percentage' ? 100 : undefined}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Min Order Amount (₹)</Label>
                <Input
                  type="number"
                  value={form.min_order_amount}
                  onChange={e => setForm(f => ({ ...f, min_order_amount: Number(e.target.value) }))}
                  min={0}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max Discount (₹)</Label>
                <Input
                  type="number"
                  value={form.max_discount}
                  onChange={e => setForm(f => ({ ...f, max_discount: e.target.value }))}
                  placeholder="No limit"
                  min={0}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Usage Limit</Label>
                <Input
                  type="number"
                  value={form.usage_limit}
                  onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))}
                  placeholder="Unlimited"
                  min={1}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))}
              />
              <Label className="text-sm">Active</Label>
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
            <AlertDialogTitle>Delete this coupon?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this coupon code.</AlertDialogDescription>
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
