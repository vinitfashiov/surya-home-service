import { useCategories } from '@/hooks/useSupabaseData';
import { Scissors, Zap, Droplets, SprayCan, Wrench, Paintbrush, Bug, Hammer, Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap: Record<string, React.ElementType> = { Scissors, Zap, Droplets, SprayCan, Wrench, Paintbrush, Bug, Hammer };

export default function AdminCategories() {
  const { data: categories = [], isLoading } = useCategories();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground mt-1">Manage service categories</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {categories.map((cat: any) => {
            const Icon = iconMap[cat.icon] || Wrench;
            return (
              <div key={cat.id} className="bg-card rounded-xl p-5 shadow-card border flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-foreground">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground">{cat.description}</p>
                </div>
                <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
              </div>
            );
          })}
          {categories.length === 0 && <p className="text-muted-foreground col-span-full text-center py-10">No categories yet.</p>}
        </div>
      )}
    </div>
  );
}
