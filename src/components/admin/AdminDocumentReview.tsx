import { useState } from 'react';
import { useAllProviderDocuments, useReviewDocument, useVerifyProvider, DOCUMENT_TYPES } from '@/hooks/useProviderDocuments';
import { useProviders } from '@/hooks/useSupabaseData';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, CheckCircle, XCircle, ShieldCheck, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDocumentReview() {
  const { user } = useAuthContext();
  const { data: documents = [], isLoading } = useAllProviderDocuments();
  const { data: providers = [] } = useProviders();
  const reviewDoc = useReviewDocument();
  const verifyProvider = useVerifyProvider();
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [reviewDialog, setReviewDialog] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const providerMap = new Map(providers.map((p: any) => [p.id, p]));

  const filtered = documents
    .filter(d => filter === 'all' || d.status === filter)
    .filter(d => {
      if (!search.trim()) return true;
      const provider = providerMap.get(d.provider_id);
      const q = search.toLowerCase();
      return d.document_name.toLowerCase().includes(q) ||
        (provider?.company_name || '').toLowerCase().includes(q);
    });

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!reviewDialog || !user) return;
    try {
      await reviewDoc.mutateAsync({
        documentId: reviewDialog.id,
        status,
        adminNotes,
        reviewedBy: user.id,
      });
      toast.success(`Document ${status}`);
      setReviewDialog(null);
      setAdminNotes('');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleVerifyProvider = async (providerId: string, verified: boolean) => {
    try {
      await verifyProvider.mutateAsync({ providerId, verified });
      toast.success(verified ? 'Provider verified!' : 'Verification removed');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const statusBadge = (status: string) => {
    const cls = status === 'approved' ? 'bg-success/10 text-success' :
                status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                'bg-warning/10 text-warning';
    return <Badge className={`${cls} border-0 capitalize text-xs`}>{status}</Badge>;
  };

  const pendingCount = documents.filter(d => d.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', 'all'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                filter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {s} {s === 'pending' && pendingCount > 0 && `(${pendingCount})`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No documents found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => {
            const provider = providerMap.get(doc.provider_id);
            return (
              <Card key={doc.id} className="border shadow-sm">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.document_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {provider?.company_name || 'Unknown'} · {DOCUMENT_TYPES.find(dt => dt.value === doc.document_type)?.label || doc.document_type}
                        {' · '}{new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {statusBadge(doc.status)}
                    {provider && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-1 text-xs ${(provider as any).is_verified ? 'text-success' : 'text-muted-foreground'}`}
                        onClick={() => handleVerifyProvider(doc.provider_id, !(provider as any).is_verified)}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {(provider as any).is_verified ? 'Verified' : 'Verify'}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                    {doc.status === 'pending' && (
                      <Button variant="outline" size="sm" onClick={() => { setReviewDialog(doc); setAdminNotes(''); }}>
                        Review
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={o => !o && setReviewDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Document</DialogTitle>
          </DialogHeader>
          {reviewDialog && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <p><span className="text-muted-foreground">Name:</span> {reviewDialog.document_name}</p>
                <p><span className="text-muted-foreground">Type:</span> {DOCUMENT_TYPES.find(dt => dt.value === reviewDialog.document_type)?.label}</p>
                <p><span className="text-muted-foreground">Provider:</span> {providerMap.get(reviewDialog.provider_id)?.company_name || 'Unknown'}</p>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <a href={reviewDialog.file_url} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-2" /> View Document
                </a>
              </Button>
              <div className="space-y-2">
                <Label>Admin Notes (optional)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this document..."
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => handleReview('rejected')}
              disabled={reviewDoc.isPending}
            >
              <XCircle className="h-4 w-4" /> Reject
            </Button>
            <Button
              className="gap-1.5"
              onClick={() => handleReview('approved')}
              disabled={reviewDoc.isPending}
            >
              <CheckCircle className="h-4 w-4" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
