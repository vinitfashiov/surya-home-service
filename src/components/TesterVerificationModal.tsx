import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldCheck, Code2, CheckCircle2, FileText, Smartphone, Server, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TesterVerificationModalProps {
  userProfile?: {
    full_name?: string;
    email?: string;
    phone?: string;
  } | null;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function TesterVerificationModal({
  userProfile,
  trigger,
  isOpen: externalOpen,
  onOpenChange: externalSetOpen,
}: TesterVerificationModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const [testerForm, setTesterForm] = useState({
    testerName: userProfile?.full_name || 'DEV Tester 0.22',
    testerEmail: userProfile?.email || 'dev.tester022@suryahomeservice.in',
    environment: 'DEV Team 0.22 QA Sandbox',
    deviceType: 'Android TWA Build (v0.22)',
  });

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalSetOpen || setInternalOpen;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedPolicy) {
      toast.error('Please accept the Privacy Policy to proceed with verification.', {
        icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsVerified(true);
      toast.success('Tester Verification Acknowledged! DEV team 0.22 logged this session.', {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
        duration: 4000,
      });
      setOpen(false);
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden border-2 border-emerald-500/20 shadow-2xl rounded-2xl">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-[#1DA653] to-[#15803D] p-6 text-white relative">
          <div className="flex items-center justify-between mb-2">
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs font-semibold px-2.5 py-0.5 backdrop-blur-sm gap-1">
              <Code2 className="h-3.5 w-3.5 text-emerald-200" />
              DEV TEAM 0.22
            </Badge>
            <span className="text-[11px] font-mono bg-black/20 px-2 py-0.5 rounded text-emerald-100">
              BUILD v0.22 QA
            </span>
          </div>
          <DialogTitle className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-200" />
            Tester Verification through DEV team 0.22
          </DialogTitle>
          <DialogDescription className="text-emerald-100 text-xs mt-1">
            Complete the developer QA verification and privacy policy acknowledgment form.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-card">
          {/* Status Alert */}
          {isVerified ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3 text-emerald-800 text-xs">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Verification Status: ACKNOWLEDGED</p>
                <p className="text-emerald-700">DEV team 0.22 session has been logged for this device.</p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-center gap-3 text-amber-900 dark:text-amber-200 text-xs">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">QA Tester Action Required</p>
                <p className="text-amber-700 dark:text-amber-300">
                  Please review the DEV 0.22 environment metrics and accept privacy terms below.
                </p>
              </div>
            </div>
          )}

          {/* Environment & Device Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-muted/40 p-3.5 rounded-xl border border-border/50">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-muted-foreground block text-[10px]">Environment</span>
                <span className="font-semibold text-foreground truncate block">{testerForm.environment}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-muted-foreground block text-[10px]">Client Target</span>
                <span className="font-semibold text-foreground truncate block">{testerForm.deviceType}</span>
              </div>
            </div>
          </div>

          {/* Tester Info Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tester Full Name</Label>
              <Input
                value={testerForm.testerName}
                onChange={(e) => setTesterForm({ ...testerForm, testerName: e.target.value })}
                placeholder="Enter tester name..."
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tester Contact Email</Label>
              <Input
                value={testerForm.testerEmail}
                onChange={(e) => setTesterForm({ ...testerForm, testerEmail: e.target.value })}
                placeholder="Enter tester email..."
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Privacy Policy Callout Box */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <FileText className="h-3.5 w-3.5 text-emerald-600" />
              Privacy Policy & Acknowledgment Notice
            </Label>
            <div className="bg-muted/60 border border-border/80 rounded-xl p-3 text-[11px] leading-relaxed text-muted-foreground max-h-28 overflow-y-auto space-y-1.5 font-sans">
              <p className="font-medium text-foreground">
                Developer & Tester Telemetry Agreement (DEV team 0.22):
              </p>
              <p>
                By proceeding with this verification, you acknowledge that performance telemetry, diagnostic session logs, API response latency, and test transaction records are captured by DEV team 0.22 exclusively for system stability and quality assurance.
              </p>
              <p>
                No sensitive user credentials or personal financial data are exported. All testing data adheres strictly to standard developer privacy protocols.
              </p>
            </div>
          </div>

          {/* Acceptance Checkbox */}
          <div className="flex items-start gap-2.5 pt-1">
            <Checkbox
              id="privacy-accept"
              checked={acceptedPolicy}
              onCheckedChange={(checked) => setAcceptedPolicy(checked === true)}
              className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
            />
            <Label
              htmlFor="privacy-accept"
              className="text-xs text-foreground font-medium cursor-pointer leading-tight"
            >
              I have read and accept the <span className="text-emerald-600 underline font-semibold">DEV Team 0.22 Privacy Policy</span> and Tester Verification Terms.
            </Label>
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-[#1DA653] hover:bg-[#15803D] text-white text-xs h-9 px-5 font-semibold gap-1.5 shadow-sm"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Acknowledge & Submit
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
