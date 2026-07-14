import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Award, CheckCircle2, ShieldCheck, UploadCloud, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function ProviderSkillCertificate() {
  const navigate = useNavigate();
  const [certId, setCertId] = useState('');
  const [fileAdded, setFileAdded] = useState(false);
  const [status, setStatus] = useState<'none' | 'pending' | 'verified'>('none');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId || !fileAdded) {
      toast.error('Kripya NSDC Registration ID aur certificate file daalein');
      return;
    }

    setStatus('pending');
    toast.success('Certificate submitted for review!');
    
    // Simulate verification after 3 seconds
    setTimeout(() => {
      setStatus('verified');
      toast.success('Skill India Certificate Verified Successfully!');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b h-14 flex items-center px-4 justify-between z-30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/provider/profile')} className="-ml-2">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" /> Skill India Certificate
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
        {/* NSDC Banner */}
        <Card className="bg-gradient-to-r from-orange-500 via-white to-emerald-500 border-0 text-slate-900 shadow-md">
          <CardContent className="p-5 space-y-2 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10">
              <Award className="w-32 h-32 text-slate-950" />
            </div>
            <h2 className="text-lg font-heading font-black text-slate-950">NSDC Skill India Partner Program</h2>
            <p className="text-xs text-slate-900 font-medium leading-relaxed max-w-[280px]">
              Surya Home Services supports the Government Skill India initiative. Certified professionals receive:
            </p>
            <ul className="text-[10px] space-y-1 font-bold text-slate-950 pt-1 list-disc list-inside">
              <li>High priority booking allocation</li>
              <li>Lower platform commission (save 3%)</li>
              <li>Official Gold Verification Badge</li>
            </ul>
          </CardContent>
        </Card>

        {status === 'none' && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading font-bold text-primary">Upload NSDC Certificate</CardTitle>
              <CardDescription className="text-xs">Submit your certification details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="certId" className="text-xs font-semibold">NSDC Registration / Certificate ID</Label>
                  <Input 
                    id="certId" 
                    placeholder="Enter Certificate ID e.g. SIND-9284-A" 
                    value={certId}
                    onChange={(e) => setCertId(e.target.value)}
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Upload Certificate PDF or Photo</Label>
                  <div 
                    onClick={() => { setFileAdded(true); toast.info('Certificate file selected'); }}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      fileAdded ? 'border-emerald-500 bg-emerald-50/20' : 'border-muted hover:border-primary/40'
                    }`}
                  >
                    {fileAdded ? (
                      <div className="space-y-1 text-emerald-600">
                        <CheckCircle2 className="h-8 w-8 mx-auto" />
                        <p className="text-xs font-bold">certificate_scan.jpg added</p>
                        <p className="text-[9px] text-muted-foreground">Click to change file</p>
                      </div>
                    ) : (
                      <div className="space-y-1 text-muted-foreground">
                        <UploadCloud className="h-8 w-8 mx-auto text-muted-foreground/75" />
                        <p className="text-xs font-semibold">Click to select certificate file</p>
                        <p className="text-[9px]">Supports PDF, PNG, JPG up to 5MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 text-xs font-semibold mt-2">
                  Submit for Verification
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {status === 'pending' && (
          <Card className="border shadow-sm py-8 text-center">
            <CardContent>
              <div className="h-14 w-14 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-600 animate-pulse">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="font-heading font-bold text-foreground text-sm mt-4">Reviewing Certificate</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto leading-relaxed">
                Our verification desk is validating your NSDC registration. This usually takes under 5 minutes...
              </p>
            </CardContent>
          </Card>
        )}

        {status === 'verified' && (
          <Card className="border shadow-sm py-8 text-center bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="space-y-4">
              <div className="h-14 w-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-emerald-950 text-sm">NSDC Partner Verification Active!</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto leading-relaxed">
                  Your Skill India Certificate was verified successfully. Priority bookings and discount commissions are active on your profile.
                </p>
              </div>
              <div className="bg-background border p-4 rounded-2xl max-w-xs mx-auto text-left space-y-2 relative shadow-sm">
                <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                  Active
                </span>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black">Skill India Portal</p>
                <div>
                  <p className="text-xs font-bold text-foreground">Verified Partner</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">ID: {certId || 'SIND-9284-A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
