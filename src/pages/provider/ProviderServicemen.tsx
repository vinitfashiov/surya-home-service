import { useAuth, useMyProvider, useServicemen } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export default function ProviderServicemen() {
  const { user } = useAuth();
  const { data: provider, error: providerError } = useMyProvider(user?.id);
  const { data: myServicemen = [], isLoading, error: servicemenError } = useServicemen(provider?.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', skills: '' });
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleAddServiceman = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error('Name and email are required');
      return;
    }
    if (!provider?.id) {
      toast.error('Provider not found');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('servicemen').insert({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        provider_id: provider.id,
        skills: form.skills ? form.skills.split(',').map(s => s.trim()) : [],
        status: 'available',
        rating: 0,
        completed_jobs: 0,
      });
      if (error) throw error;
      toast.success('Serviceman added successfully!');
      setForm({ name: '', email: '', phone: '', skills: '' });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['servicemen', provider.id] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to add serviceman');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (providerError) toast.error(`Failed to load provider: ${providerError.message}`);
    if (servicemenError) toast.error(`Failed to load servicemen: ${servicemenError.message}`);
  }, [providerError, servicemenError]);

  if (!user) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Please log in as a provider.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Servicemen</h1>
          <p className="text-muted-foreground mt-1">Manage your team members</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Serviceman</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Serviceman</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddServiceman} className="space-y-4 mt-2">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 9876543210" />
              </div>
              <div>
                <Label>Skills (comma separated)</Label>
                <Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Photography, Video, Editing" />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Serviceman'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
