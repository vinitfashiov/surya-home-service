import { useMyProvider } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useSupabaseData';
import { useProviderAvailability, useUpsertAvailability } from '@/hooks/useProviderAvailability';
import { ALL_SLOTS } from '@/hooks/useAvailableTimeSlots';
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Calendar, Clock, Ban, Check, Save, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function ProviderAvailabilityPage() {
  const { user } = useAuth();
  const { data: provider, error: providerError } = useMyProvider(user?.id);

  useEffect(() => {
    if (providerError) toast.error(`Failed to load provider: ${providerError.message}`);
  }, [providerError]);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Form state for selected date
  const [isAvailable, setIsAvailable] = useState(true);
  const [startTime, setStartTime] = useState('9:00 AM');
  const [endTime, setEndTime] = useState('5:00 PM');
  const [maxBookings, setMaxBookings] = useState(0);
  const [note, setNote] = useState('');

  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const { data: availabilityData = [], isLoading } = useProviderAvailability(provider?.id, monthStr);
  const upsertMut = useUpsertAvailability();

  const availabilityMap = useMemo(() => {
    const map: Record<string, typeof availabilityData[0]> = {};
    availabilityData.forEach(a => { map[a.date] = a; });
    return map;
  }, [availabilityData]);

  const days = getMonthDays(viewYear, viewMonth);
  const monthName = new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const handleDateClick = (day: number) => {
    const dateStr = formatDate(viewYear, viewMonth, day);
    setSelectedDate(dateStr);
    const existing = availabilityMap[dateStr];
    if (existing) {
      setIsAvailable(existing.is_available);
      setStartTime(existing.start_time);
      setEndTime(existing.end_time);
      setMaxBookings(existing.max_bookings_per_slot);
      setNote(existing.note || '');
    } else {
      setIsAvailable(true);
      setStartTime('9:00 AM');
      setEndTime('5:00 PM');
      setMaxBookings(0);
      setNote('');
    }
  };

  const handleSave = async () => {
    if (!provider?.id || !selectedDate) return;
    try {
      await upsertMut.mutateAsync({
        provider_id: provider.id,
        date: selectedDate,
        is_available: isAvailable,
        start_time: startTime,
        end_time: endTime,
        max_bookings_per_slot: maxBookings,
        note,
      });
      toast.success('Availability saved');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  if (!provider) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
        Please log in as a provider to manage availability.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-heading font-bold text-foreground">Availability Calendar</h1>
      <p className="text-muted-foreground mt-1">Set your working hours, block holidays, and control booking capacity</p>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="border shadow-card">
            <CardContent className="p-6">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-heading font-bold text-foreground">{monthName}</h2>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => {
                  if (day === null) return <div key={`empty-${i}`} />;
                  const dateStr = formatDate(viewYear, viewMonth, day);
                  const isPast = dateStr < todayStr;
                  const avail = availabilityMap[dateStr];
                  const isSelected = selectedDate === dateStr;
                  const isToday = dateStr === todayStr;
                  const isBlocked = avail && !avail.is_available;
                  const hasCustom = avail && avail.is_available;

                  return (
                    <button
                      key={day}
                      onClick={() => !isPast && handleDateClick(day)}
                      disabled={isPast}
                      className={`
                        relative aspect-square rounded-lg text-sm font-medium transition-all flex flex-col items-center justify-center gap-0.5
                        ${isPast ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'}
                        ${isSelected ? 'ring-2 ring-primary bg-primary/10' : ''}
                        ${isToday ? 'font-bold' : ''}
                        ${isBlocked ? 'bg-destructive/10 text-destructive' : ''}
                        ${hasCustom ? 'bg-success/10' : ''}
                      `}
                    >
                      <span>{day}</span>
                      {isBlocked && <Ban className="h-3 w-3" />}
                      {hasCustom && <Check className="h-3 w-3 text-success" />}
                      {isToday && !isBlocked && !hasCustom && (
                        <div className="w-1 h-1 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-success/10 border border-success/30" />
                  <span>Custom hours</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-destructive/10 border border-destructive/30" />
                  <span>Blocked/Holiday</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded border" />
                  <span>Default</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date config panel */}
        <div>
          {selectedDate ? (
            <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border shadow-card sticky top-24">
                <CardContent className="p-6 space-y-5">
                  <div>
                    <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric'
                      })}
                    </h3>
                  </div>

                  <Separator />

                  {/* Available toggle */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-foreground">Available</Label>
                    <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
                  </div>

                  {!isAvailable ? (
                    <div className="bg-destructive/5 rounded-lg p-4 text-center">
                      <Ban className="h-8 w-8 text-destructive mx-auto mb-2" />
                      <p className="text-sm font-medium text-destructive">Day blocked</p>
                      <p className="text-xs text-muted-foreground mt-1">No bookings will be accepted</p>
                    </div>
                  ) : (
                    <>
                      {/* Working hours */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Start Time</Label>
                          <Select value={startTime} onValueChange={setStartTime}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ALL_SLOTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">End Time</Label>
                          <Select value={endTime} onValueChange={setEndTime}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ALL_SLOTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Max bookings */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Max Bookings Per Slot</Label>
                        <Input
                          type="number"
                          value={maxBookings}
                          onChange={e => setMaxBookings(Number(e.target.value))}
                          min={0}
                          placeholder="0 = use default (servicemen count)"
                        />
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Info className="h-3 w-3" /> 0 means auto-calculate from servicemen count
                        </p>
                      </div>
                    </>
                  )}

                  {/* Note */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Note (optional)</Label>
                    <Textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="e.g. Holiday, Half day..."
                      rows={2}
                    />
                  </div>

                  <Button
                    className="w-full gap-2"
                    onClick={handleSave}
                    disabled={upsertMut.isPending}
                  >
                    <Save className="h-4 w-4" />
                    {upsertMut.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card className="border shadow-card">
              <CardContent className="p-6 text-center py-16">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Select a date to configure availability</p>
                <p className="text-xs text-muted-foreground mt-1">Click any future date on the calendar</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
