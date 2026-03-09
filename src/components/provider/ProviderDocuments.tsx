import { useState } from 'react';
import { useProviderDocuments, useUploadProviderDocument, DOCUMENT_TYPES } from '@/hooks/useProviderDocuments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProviderDocumentsProps {
  providerId: string;
}

export default function ProviderDocuments({ providerId }: ProviderDocumentsProps) {
  const { data: documents = [], isLoading } = useProviderDocuments(providerId);
  const uploadDoc = useUploadProviderDocument();
  const [docType, setDocType] = useState('id_proof');
  const [docName, setDocName] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file || !docName.trim()) {
      toast.error('Please provide document name and file');
      return;
    }
    try {
      await uploadDoc.mutateAsync({
        providerId,
        documentType: docType,
        documentName: docName.trim(),
        file,
      });
      toast.success('Document uploaded successfully');
      setFile(null);
      setDocName('');
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const statusBadge = (status: string) => {
    const cls = status === 'approved' ? 'bg-success/10 text-success' :
                status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                'bg-warning/10 text-warning';
    return <Badge className={`${cls} border-0 capitalize`}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Upload new document */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Verification Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(dt => (
                    <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Document Name</Label>
              <Input
                placeholder="e.g. Aadhaar Card Front"
                value={docName}
                onChange={e => setDocName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>File (PDF, JPG, PNG)</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button
            onClick={handleUpload}
            disabled={uploadDoc.isPending || !file || !docName.trim()}
            className="gap-2"
          >
            {uploadDoc.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload Document
          </Button>
        </CardContent>
      </Card>

      {/* Existing documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Submitted Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading...</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No documents uploaded yet. Upload your verification documents to get verified.</p>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    {statusIcon(doc.status)}
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc.document_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {DOCUMENT_TYPES.find(dt => dt.value === doc.document_type)?.label || doc.document_type}
                        {' · '}
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                      {doc.status === 'rejected' && doc.admin_notes && (
                        <p className="text-xs text-destructive mt-1">Reason: {doc.admin_notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(doc.status)}
                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">View</a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
