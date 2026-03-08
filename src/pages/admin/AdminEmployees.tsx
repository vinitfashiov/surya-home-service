import { useEmployees } from '@/hooks/useSupabaseData';
import { useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '@/hooks/useAdminMutations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Shield, Trash2, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';

const allPermissions = ['bookings', 'categories', 'providers', 'employees', 'services', 'reports'];
const emptyForm = { name: '', email: '', department: 'general', phone: '', permissions: [] as string[], status: 'active' };

export default function AdminEmployees() {
  const { data: employees = [], isLoading } = useEmployees();
  const { user } = useAuthContext();
  const createMut = useCreateEmployee();
  const updateMut = useUpdateEmployee();
  const deleteMut = useDeleteEmployee();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newUserId, setNewUserId] = useState('');

  const openCreate = () => { setEditId(null); setForm(emptyForm); setNewUserId(''); setDialogOpen(true); };
  const openEdit = (emp: any) => { setEditId(emp.id); setForm({ name: emp.name, email: emp.email, department: emp.department || 'general', phone: emp.phone || '', permissions: emp.permissions || [], status: emp.status }); setDialogOpen(true); };

  const togglePerm = (perm: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm) ? f.permissions.filter(p => p !== perm) : [...f.permissions, perm],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email are required'); return; }
    try {
      if (editId) {
        await updateMut.mutateAsync({ id: editId, ...form });
        toast.success('Employee updated');
      } else {
        const userId = newUserId.trim() || user?.id;
        if (!userId) { toast.error('User ID is required'); return; }
        await createMut.mutateAsync({ ...form, user_id: userId });
        toast.success('Employee created');
      }
      setDialogOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
      toast.success('Employee deleted');
    } catch (e: any) { toast.error(e.message); }
    setDeleteId(null);
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage admin staff and permissions</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Employee
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : employees.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="text-center py-16">
            <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No employees yet. Add your first team member.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp: any) => (
            <Card key={emp.id} className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{emp.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-foreground">{emp.name}</h3>
                      <p className="text-xs text-muted-foreground">{emp.email}</p>
                    </div>
                  </div>
                  <Badge className={`border-0 text-xs ${emp.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                    {emp.status}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span className="capitalize">{emp.department}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {(emp.permissions || []).map((perm: string) => (
                    <Badge key={perm} variant="outline" className="text-[10px] capitalize px-1.5 py-0.5">{perm}</Badge>
                  ))}
                  {(!emp.permissions || emp.permissions.length === 0) && (
                    <span className="text-xs text-muted-foreground/60">No permissions</span>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEdit(emp)}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteId(emp.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Employee' : 'New Employee'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!editId && (
              <div className="space-y-1.5"><Label>User ID (from Supabase Auth)</Label><Input placeholder="UUID of the auth user" value={newUserId} onChange={e => setNewUserId(e.target.value)} /></div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editId && (
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="mb-2.5 block">Permissions</Label>
              <div className="grid grid-cols-2 gap-2.5">
                {allPermissions.map(p => (
                  <label key={p} className="flex items-center gap-2 text-sm capitalize cursor-pointer hover:text-foreground transition-colors">
                    <Checkbox checked={form.permissions.includes(p)} onCheckedChange={() => togglePerm(p)} />
                    {p}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete employee?</AlertDialogTitle><AlertDialogDescription>This will permanently remove this employee record.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
