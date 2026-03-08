import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  bucket: 'avatars' | 'service-images' | 'provider-logos';
  path: string; // e.g. "userId/avatar" or "serviceId/main"
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  className?: string;
  variant?: 'avatar' | 'card' | 'banner';
  accept?: string;
}

export default function ImageUpload({
  bucket,
  path,
  currentUrl,
  onUpload,
  className,
  variant = 'card',
  accept = 'image/jpeg,image/png,image/webp',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const displayUrl = preview || currentUrl;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB.');
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const ext = file.name.split('.').pop();
      const filePath = `${path}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Add cache-busting param
      const url = `${publicUrl}?t=${Date.now()}`;
      onUpload(url);
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
      setPreview(null);
    }
    setUploading(false);
  };

  const handleRemove = () => {
    setPreview(null);
    onUpload('');
    if (fileRef.current) fileRef.current.value = '';
  };

  if (variant === 'avatar') {
    return (
      <div className={cn('relative group', className)}>
        <div className="w-20 h-20 rounded-2xl bg-muted overflow-hidden border-2 border-border">
          {displayUrl ? (
            <img src={displayUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        </button>
        <input ref={fileRef} type="file" accept={accept} onChange={handleUpload} className="hidden" />
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {displayUrl ? (
        <div className="relative rounded-xl overflow-hidden border bg-muted aspect-video">
          <img src={displayUrl} alt="Upload" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4 mr-1" /> Replace</>}
            </Button>
            <Button size="sm" variant="destructive" onClick={handleRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/50 flex flex-col items-center justify-center gap-2 transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload image</span>
              <span className="text-xs text-muted-foreground/60">JPG, PNG, WebP · Max 5MB</span>
            </>
          )}
        </button>
      )}
      <input ref={fileRef} type="file" accept={accept} onChange={handleUpload} className="hidden" />
    </div>
  );
}
