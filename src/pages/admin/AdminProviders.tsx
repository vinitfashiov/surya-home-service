import { useProviders } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminProviders() {
  const { data: providers = [], isLoading } = useProviders();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Providers</h1>
          <p className="text-muted-foreground mt-1">Manage registered service providers</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" /> Add Provider</Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl mt-8" />
      ) : (
        <div className="mt-8 bg-card rounded-xl shadow-card border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Company</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Owner</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Contact</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Rating</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p: any) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4 font-medium text-foreground">{p.company_name}</td>
                    <td className="p-4 text-foreground">{p.owner_name}</td>
                    <td className="p-4 text-muted-foreground">{p.email}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-warning fill-warning" />{p.rating}</span>
                    </td>
                    <td className="p-4">
                      <Badge className={`border-0 ${p.status === 'active' ? 'bg-success/10 text-success' : p.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {providers.length === 0 && <p className="text-center py-10 text-muted-foreground">No providers registered yet.</p>}
        </div>
      )}
    </div>
  );
}
