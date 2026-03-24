import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  ExternalLink,
  MessageSquare,
  PauseCircle,
  PlayCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function AdminAdsPage() {
  const queryClient = useQueryClient();
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Fetch all campaigns
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['admin_ad_campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select(`
          *,
          provider:providers(company_name, owner_name),
          category:service_categories(name),
          city:cities(name)
        `)
        .order('status', { ascending: false }) // Pending first usually
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string, status: string, notes?: string }) => {
      const { error } = await supabase
        .from('ad_campaigns')
        .update({ status, admin_notes: notes, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_ad_campaigns'] });
      toast.success('Campaign updated successfully');
      setIsRejectDialogOpen(false);
      setRejectNotes('');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleApprove = (id: string) => {
    statusMutation.mutate({ id, status: 'active' });
  };

  const handleReject = () => {
    if (!rejectNotes.trim()) {
      toast.error('Please provide rejection notes');
      return;
    }
    statusMutation.mutate({ id: selectedAd.id, status: 'rejected', notes: rejectNotes });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'pending': return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      case 'rejected': return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
      case 'paused': return <Badge variant="secondary">Paused</Badge>;
      case 'completed': return <Badge variant="outline">Completed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Ad Campaign Management</h1>
          <p className="text-muted-foreground mt-1">Review, approve, and manage provider advertisements</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Overview</CardTitle>
            <CardDescription>Track and moderate all promotional activity on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-10 text-center">Loading campaigns...</div>
            ) : campaigns.length > 0 ? (
              <div className="relative w-full overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Provider & Campaign</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Targeting</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Bid / Budget</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Insights</th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c: any) => (
                      <tr key={c.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            {c.image_url && (
                              <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                                <img src={c.image_url} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold">{c.name}</div>
                              <div className="text-xs text-primary">{c.provider?.company_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-xs">
                              <Badge variant="outline" className="text-[10px]">{c.city?.name || 'All Cities'}</Badge>
                              <Badge variant="secondary" className="text-[10px]">{c.category?.name || 'All Categories'}</Badge>
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {format(new Date(c.start_date), 'MMM d')} - {c.end_date ? format(new Date(c.end_date), 'MMM d') : 'Ongoing'}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="font-medium text-primary">₹{c.bid_amount} / bid</div>
                          <div className="text-[10px] text-muted-foreground">Total: ₹{c.total_budget}</div>
                        </td>
                        <td className="p-4 align-middle">
                          {getStatusBadge(c.status)}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="text-xs">
                            <span className="font-bold">₹{c.spent_amount.toFixed(2)}</span> spent
                          </div>
                          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${Math.min((c.spent_amount / c.total_budget) * 100, 100)}%` }} 
                            />
                          </div>
                        </td>
                        <td className="p-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                            {c.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 text-success hover:text-success hover:bg-success/10 border-success/20"
                                  onClick={() => handleApprove(c.id)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                  onClick={() => { setSelectedAd(c); setIsRejectDialogOpen(true); }}
                                >
                                  <XCircle className="h-4 w-4 mr-1" /> Reject
                                </Button>
                              </>
                            )}
                            {c.status === 'active' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8"
                                onClick={() => statusMutation.mutate({ id: c.id, status: 'paused' })}
                              >
                                <PauseCircle className="h-4 w-4 mr-1" /> Pause
                              </Button>
                            )}
                            {c.status === 'paused' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8"
                                onClick={() => statusMutation.mutate({ id: c.id, status: 'active' })}
                              >
                                <PlayCircle className="h-4 w-4 mr-1" /> Resume
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center gap-2">
                <AlertCircle className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-muted-foreground">No campaigns found in the system.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Campaign</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting the campaign "{selectedAd?.name}". This will be visible to the provider.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="notes">Rejection Reason</Label>
              <Textarea 
                id="notes" 
                placeholder="Invalid image quality, inappropriate content, etc." 
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={statusMutation.isPending}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
