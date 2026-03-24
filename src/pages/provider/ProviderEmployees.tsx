import { useState } from 'react';
import { useAuth, useMyProvider } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, User, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function ProviderEmployees() {
  const { user } = useAuth();
  const { data: provider } = useMyProvider(user?.id);
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    permissions: [] as string[],
  });

  const availablePermissions = [
    { id: 'bookings', label: 'Manage Bookings' },
    { id: 'services', label: 'Manage Services' },
    { id: 'campaigns', label: 'Run Campaigns' },
    { id: 'analytics', label: 'View Analytics' },
    { id: 'team', label: 'Manage Team' },
  ];

  const handlePermissionToggle = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  // Fetch employees
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['provider_employees', provider?.id],
    queryFn: async () => {
      if (!provider?.id) return [];
      const { data, error } = await supabase
        .from('provider_employees' as any)
        .select('*')
        .eq('provider_id', provider.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!provider?.id,
  });

  // Create employee mutation
  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
      const { data, error } = await supabase.rpc('create_provider_employee' as any, {
        p_provider_id: provider.id,
        p_name: newData.name,
        p_email: newData.email,
        p_phone: newData.phone,
        p_password: newData.password,
        p_permissions: newData.permissions,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider_employees'] });
      toast.success('Employee created successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create employee');
    },
  });

  // Delete employee mutation
  const deleteMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      // Just removing them from the provider team for now
      const { error } = await supabase
        .from('provider_employees' as any)
        .delete()
        .eq('id', employeeId)
        .eq('provider_id', provider.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider_employees'] });
      toast.success('Employee removed from team');
    },
    onError: (error: any) => {
      toast.error('Failed to remove employee');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      permissions: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    createMutation.mutate(formData);
  };

  const hasTeamPermission = !provider?.is_employee || provider?.permissions?.includes('team');

  if (!user) return <div className="p-20 text-center">Please log in.</div>;
  
  if (!hasTeamPermission) {
    return (
      <div className="container mx-auto px-4 py-20 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
          <User className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to manage the team.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground mt-1">Add staff members and manage their access to your dashboard</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={resetForm}>
              <Plus className="h-4 w-4" /> Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Create a login for your staff member. They will receive access immediately.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="john@example.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input 
                  id="phone" 
                  placeholder="+91..." 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="password">Temporary Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  placeholder="At least 6 characters" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  minLength={6}
                />
                <p className="text-[10px] text-muted-foreground">They can change this later.</p>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label>Dashboard Permissions</Label>
                <div className="grid grid-cols-2 gap-3">
                  {availablePermissions.map(perm => (
                    <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.permissions.includes(perm.id)}
                        onChange={() => handlePermissionToggle(perm.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-sm">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Login'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Team Members</CardTitle>
          <CardDescription>Manage existing employees and their access rights.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center">Loading team members...</div>
          ) : employees.length > 0 ? (
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Employee</th>
                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Contact</th>
                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Permissions</th>
                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp: any) => (
                    <tr key={emp.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-2 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex flex-col items-center justify-center">
                            <span className="text-xs font-bold text-primary">{emp.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="font-medium text-foreground">{emp.name}</div>
                        </div>
                      </td>
                      <td className="p-2 align-middle">
                        <div className="text-xs">{emp.email}</div>
                        {emp.phone && <div className="text-xs text-muted-foreground">{emp.phone}</div>}
                      </td>
                      <td className="p-2 align-middle">
                        <div className="flex flex-wrap gap-1">
                          {emp.permissions?.length > 0 ? (
                            emp.permissions.map((p: string) => (
                              <Badge key={p} variant="secondary" className="text-[10px] capitalize">
                                {p}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No specific permissions</span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 align-middle text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if(confirm(`Are you sure you want to remove ${emp.name}?`)) {
                              deleteMutation.mutate(emp.id);
                            }
                          }}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center flex flex-col items-center gap-2">
              <User className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">No employees found. Add your team members to get started!</p>
              <Button variant="outline" onClick={() => setIsDialogOpen(true)} className="mt-2">Add First Employee</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
