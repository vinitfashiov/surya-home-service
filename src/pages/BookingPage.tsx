import { useParams, useNavigate } from 'react-router-dom';
import { useService, useCreateBooking, useAuth } from '@/hooks/useSupabaseData';
import { useState } from 'react';
import { Star, Clock, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function BookingPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: service, isLoading } = useService(serviceId);
  const createBooking = useCreateBooking();

  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-32 rounded-xl mb-6" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Service not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/services')}>Browse Services</Button>
      </div>
    );
  }

  const handleConfirm = async () => {
    if (!user) {
      toast.error('Please log in to book a service.');
      return;
    }
    try {
      await createBooking.mutateAsync({
        customer_id: user.id,
        service_id: service.id,
        provider_id: service.provider_id,
        booking_date: date,
        booking_time: time,
        address,
        notes: notes || undefined,
        amount: Number(service.price),
      });
      setConfirmed(true);
      toast.success('Booking placed successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create booking');
    }
  };

  const providerName = service.provider?.company_name || 'Provider';

  if (confirmed) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="bg-card rounded-2xl p-10 shadow-card border">
          <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Booking Confirmed!</h2>
          <p className="text-muted-foreground mt-2">Your booking for {service.name} has been placed.</p>
          <div className="mt-6 space-y-2 text-sm text-left bg-muted rounded-xl p-4">
            <p><span className="text-muted-foreground">Date:</span> <span className="font-medium text-foreground">{date}</span></p>
            <p><span className="text-muted-foreground">Time:</span> <span className="font-medium text-foreground">{time}</span></p>
            <p><span className="text-muted-foreground">Address:</span> <span className="font-medium text-foreground">{address}</span></p>
            <p><span className="text-muted-foreground">Amount:</span> <span className="font-medium text-primary">${service.price}</span></p>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/my-bookings')}>View Bookings</Button>
            <Button className="flex-1" onClick={() => navigate('/')}>Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="bg-card rounded-xl p-6 shadow-card border mb-6">
        <h2 className="font-heading font-bold text-xl text-foreground">{service.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">{providerName}</p>
        <div className="flex items-center gap-4 mt-3 text-sm">
          <span className="flex items-center gap-1"><Star className="h-4 w-4 text-warning fill-warning" /> {service.rating}</span>
          <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4" /> {service.duration} min</span>
          <span className="font-heading font-bold text-primary text-lg">${service.price}</span>
        </div>
      </div>

      {!user && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6 text-sm text-warning">
          You need to log in to place a booking.
        </div>
      )}

      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{s}</div>
            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl p-6 shadow-card border">
        {step === 1 && (
          <div>
            <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Select Date & Time</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Time Slot</label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <button key={slot} onClick={() => setTime(slot)} className={`px-3 py-2 rounded-lg text-sm border transition-colors ${time === slot ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground hover:bg-muted'}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Button className="w-full mt-6" disabled={!date || !time} onClick={() => setStep(2)}>Continue</Button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Your Address</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Full Address</label>
                <Textarea placeholder="Enter your complete address..." value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Special Instructions (Optional)</label>
                <Textarea placeholder="Any special instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" disabled={!address} onClick={() => setStep(3)}>Continue</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Confirm Booking</h3>
            <div className="space-y-3 bg-muted rounded-xl p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium text-foreground">{service.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Provider</span><span className="font-medium text-foreground">{providerName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium text-foreground">{date}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium text-foreground">{time}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="font-medium text-foreground text-right max-w-[200px]">{address}</span></div>
              <hr className="border-border" />
              <div className="flex justify-between text-base"><span className="font-semibold text-foreground">Total</span><span className="font-heading font-bold text-primary">${service.price}</span></div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-1" onClick={handleConfirm} disabled={createBooking.isPending || !user}>
                {createBooking.isPending ? 'Placing...' : 'Confirm & Pay'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
