import { useState } from 'react';
import { useAuth, useMyProvider, useCategories, useCities } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Megaphone, Target, BarChart3, Clock, AlertCircle, CheckCircle2, PauseCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ImageUpload from '@/components/ImageUpload';

export default function ProviderAdsPage() {
  const { user } = useAuth();
  const { data: provider } = useMyProvider(user?.id);
  const { data: categories = [] } = useCategories();
  const { data: cities = [] } = useCities();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const hasCampaignPermission = !provider?.is_employee || provider?.permissions?.includes('campaigns');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    target_url: '',
    category_id: 'all',
    city_id: 'all',
    bid_amount: '1.0',
    daily_budget: '100',
    total_budget: '1000',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
  });

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['ad_campaigns', provider?.id],
    queryFn: async () => {
      if (!provider?.id) return [];
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select(`
          *,
          category:service_categories(name),
          city:cities(name)
        `)
        .eq('provider_id', provider.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!provider?.id,
  });

  // Create campaign mutation
  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
      const { error } = await supabase.from('ad_campaigns').insert([{
        ...newData,
        provider_id: provider.id,
        category_id: newData.category_id === 'all' ? null : newData.category_id,
        city_id: newData.city_id === 'all' ? null : newData.city_id,
        bid_amount: parseFloat(newData.bid_amount),
        daily_budget: parseFloat(newData.daily_budget),
        total_budget: parseFloat(newData.total_budget),
        start_date: new Date(newData.start_date).toISOString(),
        end_date: newData.end_date ? new Date(newData.end_date).toISOString() : null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad_campaigns'] });
      toast.success('Campaign submitted for approval');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      target_url: '',
      category_id: 'all',
      city_id: 'all',
      bid_amount: '1.0',
      daily_budget: '100',
      total_budget: '1000',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      toast.error('Please upload an ad banner');
      return;
    }
    createMutation.mutate(formData);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      case 'paused': return <PauseCircle className="h-4 w-4 text-muted-foreground" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (!user) return <div className="p-20 text-center">Please log in.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Promotional Campaigns</h1>
          <p className="text-muted-foreground mt-1">Boost your visibility with targeted ads and smart bidding</p>
        </div>
        
        {hasCampaignPermission ? (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Ad Campaign</DialogTitle>
              <DialogDescription>
                Design your ad, set your target audience, and place your bid.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Summer Special Discount" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Ad Content / Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Get 20% off on all AC services this week!" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Ad Banner / Image</Label>
                  <ImageUpload 
                    bucket="ad-campaigns"
                    path={`campaigns/${provider?.id || 'temp'}/${Date.now()}`}
                    currentUrl={formData.image_url} 
                    onUpload={(url) => setFormData({...formData, image_url: url})} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Target City</Label>
                    <Select 
                      value={formData.city_id} 
                      onValueChange={(v) => setFormData({...formData, city_id: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select City" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cities</SelectItem>
                        {cities.map(city => (
                          <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Target Category</Label>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(v) => setFormData({...formData, category_id: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bid">Bid Amount (₹)</Label>
                    <Input 
                      id="bid" 
                      type="number" 
                      step="0.1"
                      value={formData.bid_amount}
                      onChange={(e) => setFormData({...formData, bid_amount: e.target.value})}
                      required
                    />
                    <p className="text-[10px] text-muted-foreground">Price per impression</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="daily">Daily Budget (₹)</Label>
                    <Input 
                      id="daily" 
                      type="number" 
                      value={formData.daily_budget}
                      onChange={(e) => setFormData({...formData, daily_budget: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="total">Total Budget (₹)</Label>
                    <Input 
                      id="total" 
                      type="number" 
                      value={formData.total_budget}
                      onChange={(e) => setFormData({...formData, total_budget: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input 
                      id="start_date" 
                      type="date" 
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_date">End Date (Optional)</Label>
                    <Input 
                      id="end_date" 
                      type="date" 
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Submitting...' : 'Submit Campaign'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        ) : (
          <Button disabled className="gap-2" variant="outline" title="You don't have permission to create campaigns">
            <Plus className="h-4 w-4" /> New Campaign
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{campaigns.reduce((acc: number, curr: any) => acc + (curr.spent_amount || 0), 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Across all active campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.filter((c: any) => c.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.filter((c: any) => c.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground">Waiting for admin approval</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Campaigns</CardTitle>
          <CardDescription>Manage your ongoing and past promotional activities</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center">Loading campaigns...</div>
          ) : campaigns.length > 0 ? (
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Campaign</th>
                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Targeting</th>
                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Bid / Budget</th>
                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Spent</th>
                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground text-right">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c: any) => (
                    <tr key={c.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-2 align-middle">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{c.description}</div>
                      </td>
                      <td className="p-2 align-middle">
                        <div className="flex items-center gap-1.5 capitalize">
                          {getStatusIcon(c.status)}
                          <span>{c.status}</span>
                        </div>
                      </td>
                      <td className="p-2 align-middle">
                        <div className="flex flex-wrap gap-1">
                          {c.city?.name && <Badge variant="outline" className="text-[10px]">{c.city.name}</Badge>}
                          {c.category?.name && <Badge variant="secondary" className="text-[10px]">{c.category.name}</Badge>}
                          {!c.city?.name && !c.category?.name && <span className="text-xs text-muted-foreground">Broad</span>}
                        </div>
                      </td>
                      <td className="p-2 align-middle">
                        <div className="font-medium text-primary">₹{c.bid_amount} / bid</div>
                        <div className="text-[10px] text-muted-foreground">Limit: ₹{c.total_budget}</div>
                      </td>
                      <td className="p-2 align-middle">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden mt-1">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${Math.min((c.spent_amount / c.total_budget) * 100, 100)}%` }} 
                          />
                        </div>
                        <div className="text-[10px] mt-1">₹{c.spent_amount.toFixed(2)} spent</div>
                      </td>
                      <td className="p-2 align-middle text-right text-xs text-muted-foreground">
                        {format(new Date(c.created_at), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center flex flex-col items-center gap-2">
              <Megaphone className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">No campaigns found. Start your first promotion today!</p>
              {hasCampaignPermission && (
                <Button variant="outline" onClick={() => setIsDialogOpen(true)} className="mt-2">Create Campaign</Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const DollarSign = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
