import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ChevronLeft, AlertOctagon, HelpCircle, Phone, ArrowRight, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface HelpTicket {
  id: string;
  subject: string;
  status: 'Open' | 'Resolved';
  date: string;
  desc: string;
}

export default function ProviderHelp() {
  const navigate = useNavigate();
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<HelpTicket | null>(null);

  const tickets: HelpTicket[] = [
    { id: 'T-9284', subject: 'Short term profile inactivity block', status: 'Resolved', date: '10 Jul 2026', desc: 'Account was blocked due to consecutive declined requests. Profile has been unblocked after SOP training confirmation.' },
    { id: 'T-9481', subject: 'Lead fee refund for customer cancellation', status: 'Open', date: '12 Jul 2026', desc: 'Requested credits refund for Lead #10294. Our support team is validating the customer cancellation reason.' },
    { id: 'T-8924', subject: 'Payment payout delays', status: 'Resolved', date: '05 Jul 2026', desc: 'Payout of ₹3,400 was delayed due to bank server failure. Transferred successfully on 06 Jul 2026.' }
  ];

  return (
    <div className="min-h-screen bg-muted/20 pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b h-14 flex items-center px-4 justify-between z-30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/provider/profile')} className="-ml-2">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="font-heading font-bold text-base text-foreground flex items-center gap-1.5">
            <HelpCircle className="h-5 w-5 text-primary" /> Madad (Help)
          </h1>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setEmergencyOpen(true)} className="gap-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 animate-pulse rounded-full h-8 px-3">
          <AlertOctagon className="h-3.5 w-3.5" /> Emergency 🚨
        </Button>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
        {/* Previous issues Section */}
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-xs text-muted-foreground uppercase tracking-wider">Previous Issues (Purani Samasyaen)</h3>
          
          <div className="space-y-2.5">
            {tickets.map((t) => (
              <Card 
                key={t.id} 
                className="border shadow-sm cursor-pointer hover:border-primary/20 transition-all"
                onClick={() => setSelectedTicket(t)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1 pr-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground font-semibold">{t.id}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                        t.status === 'Open' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <h4 className="font-heading font-bold text-foreground text-sm truncate">{t.subject}</h4>
                    <p className="text-[10px] text-muted-foreground">{t.date}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-3 pt-2">
          <h3 className="font-heading font-bold text-xs text-muted-foreground uppercase tracking-wider">FAQs</h3>
          <Card className="border shadow-sm">
            <CardContent className="p-0 divide-y text-xs font-semibold text-foreground">
              <div className="p-3.5 hover:bg-muted/10 cursor-pointer flex justify-between items-center" onClick={() => toast.info('Credits refund standard processing time is 24 hours.')}>
                <span>Credits refund policy kya hai?</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="p-3.5 hover:bg-muted/10 cursor-pointer flex justify-between items-center" onClick={() => toast.info('Payouts are processed daily at 8:00 PM.')}>
                <span>Weekly payment bank me kab aayega?</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="p-3.5 hover:bg-muted/10 cursor-pointer flex justify-between items-center" onClick={() => toast.info('Aadhaar verification verification takes 1-2 hours.')}>
                <span>Aadhaar verify karne me kitna samay lagta hai?</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Bottom Contact button (Sampark Karein) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 border-t backdrop-blur-lg z-40 max-w-lg mx-auto shadow-lg">
        <Button className="w-full bg-violet-700 hover:bg-violet-800 text-white h-11 text-xs font-bold gap-2" asChild>
          <a href="tel:+918000000000">
            <Phone className="h-4 w-4" /> Support Se Sampark Karein (Call Support)
          </a>
        </Button>
      </div>

      {/* Emergency Helpline Dialog */}
      <Dialog open={emergencyOpen} onOpenChange={setEmergencyOpen}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="font-heading font-bold text-base text-rose-600 flex items-center justify-center gap-1">
              <AlertOctagon className="h-5 w-5" /> Emergency Support
            </DialogTitle>
            <DialogDescription className="text-xs">
              Direct emergency helpline contacts for providers on duty.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 pt-2">
            <Button variant="outline" className="w-full gap-2 border-rose-500/20 text-rose-600 hover:bg-rose-50/50 justify-start" asChild>
              <a href="tel:112">
                <Phone className="h-4 w-4" /> Police Helpline (112)
              </a>
            </Button>
            <Button variant="outline" className="w-full gap-2 border-rose-500/20 text-rose-600 hover:bg-rose-50/50 justify-start" asChild>
              <a href="tel:108">
                <Phone className="h-4 w-4" /> Medical Emergency (108)
              </a>
            </Button>
            <Button className="w-full gap-2 bg-rose-600 hover:bg-rose-700 text-white justify-start" asChild>
              <a href="tel:+918888888888">
                <Phone className="h-4 w-4" /> Surya Safety Desk
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket detail dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-xs rounded-2xl">
            <DialogHeader>
              <span className="text-[10px] font-mono text-muted-foreground font-semibold">{selectedTicket.id}</span>
              <DialogTitle className="font-heading font-bold text-sm text-foreground pr-4">
                {selectedTicket.subject}
              </DialogTitle>
              <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-black uppercase w-max mt-1 ${
                selectedTicket.status === 'Open' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
              }`}>
                {selectedTicket.status}
              </span>
            </DialogHeader>
            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed pt-2">
              <p className="font-bold text-foreground">Issue Description:</p>
              <p className="bg-muted p-3 rounded-xl border font-medium text-foreground">{selectedTicket.desc}</p>
              <p className="text-[10px] text-right mt-1">Ticket Date: {selectedTicket.date}</p>
            </div>
            <Button className="w-full text-xs font-semibold mt-3" onClick={() => setSelectedTicket(null)}>
              Close
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
