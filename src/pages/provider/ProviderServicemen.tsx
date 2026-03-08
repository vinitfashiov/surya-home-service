import { useAuth, useMyProvider, useServicemen } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProviderServicemen() {
  const { user } = useAuth();
  const { data: provider } = useMyProvider(user?.id);
  const { data: myServicemen = [], isLoading } = useServicemen(provider?.id);

  if (!user) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Please log in as a provider.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Servicemen</h1>
          <p className="text-muted-foreground mt-1">Manage your team members</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" /> Add Serviceman</Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          {myServicemen.map((sm: any) => (
            <div key={sm.id} className="bg-card rounded-xl p-5 shadow-card border">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{sm.name}</h3>
                  <p className="text-sm text-muted-foreground">{sm.email}</p>
                </div>
                <Badge className={`border-0 ${sm.status === 'available' ? 'bg-success/10 text-success' : sm.status === 'busy' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>
                  {sm.status}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {(sm.skills || []).map((skill: string) => (
                  <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-warning fill-warning" />{sm.rating}</span>
                <span>{sm.completed_jobs} jobs completed</span>
              </div>
            </div>
          ))}
          {myServicemen.length === 0 && <p className="text-muted-foreground col-span-full text-center py-10">No servicemen added yet.</p>}
        </div>
      )}
    </div>
  );
}
