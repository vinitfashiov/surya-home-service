import { useEmployees } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminEmployees() {
  const { data: employees = [], isLoading } = useEmployees();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground mt-1">Manage admin staff and permissions</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" /> Add Employee</Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {employees.map((emp: any) => (
            <div key={emp.id} className="bg-card rounded-xl p-5 shadow-card border">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{emp.name}</h3>
                  <p className="text-sm text-muted-foreground">{emp.email}</p>
                </div>
                <Badge className={`border-0 ${emp.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                  {emp.status}
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-sm text-muted-foreground flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> {emp.department}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {(emp.permissions || []).map((perm: string) => (
                  <Badge key={perm} variant="outline" className="text-xs capitalize">{perm}</Badge>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1"><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
              </div>
            </div>
          ))}
          {employees.length === 0 && <p className="text-muted-foreground col-span-full text-center py-10">No employees yet.</p>}
        </div>
      )}
    </div>
  );
}
