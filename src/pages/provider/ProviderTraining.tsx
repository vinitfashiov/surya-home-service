import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ChevronLeft, GraduationCap, PlayCircle, Award, CheckCircle2, FileQuestion } from 'lucide-react';
import { toast } from 'sonner';

interface VideoCourse {
  id: string;
  title: string;
  category: string;
  duration: string;
  thumbnail: string;
}

export default function ProviderTraining() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'videos' | 'quiz'>('videos');

  // Video data
  const courses: VideoCourse[] = [
    { id: '1', title: 'Surya SOP: Customer ke ghar entry rule', category: 'SOP', duration: '5 mins', thumbnail: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=60' },
    { id: '2', title: 'Customer handling & communication tips', category: 'Handling', duration: '8 mins', thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&auto=format&fit=crop&q=60' },
    { id: '3', title: 'Hygiene & cleanup post service completion', category: 'Standards', duration: '6 mins', thumbnail: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=500&auto=format&fit=crop&q=60' },
  ];

  // Quiz State
  const [q1, setQ1] = useState<string>('');
  const [q2, setQ2] = useState<string>('');
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const handleSubmitQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q1 || !q2) {
      toast.error('Kripya sabhi sawalo ke jawaab de');
      return;
    }

    let score = 0;
    if (q1 === 'c') score += 50; // Correct answer for Q1
    if (q2 === 'a') score += 50; // Correct answer for Q2

    setQuizScore(score);
    if (score === 100) {
      toast.success('Excellent! You passed the SOP quiz!');
    } else {
      toast.error(`You scored ${score}%. Try again to get 100%.`);
    }
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
            <GraduationCap className="h-5 w-5 text-primary" /> Partner Academy
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
        {/* Academy Overview Banner */}
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 text-white shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-heading font-black">Learn & Earn Gold Badge</h2>
              <p className="text-[11px] opacity-90 max-w-[240px] leading-relaxed">
                Watch standard operating training videos and complete assessments to unlock our high-paying Gold Provider Tier!
              </p>
            </div>
            <Award className="h-14 w-14 opacity-90 shrink-0 text-amber-300" />
          </CardContent>
        </Card>

        {/* Tab Controls */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
          <Button 
            variant={activeTab === 'videos' ? 'default' : 'ghost'} 
            className="text-xs h-9 rounded-lg font-semibold" 
            onClick={() => setActiveTab('videos')}
          >
            Training Videos
          </Button>
          <Button 
            variant={activeTab === 'quiz' ? 'default' : 'ghost'} 
            className="text-xs h-9 rounded-lg font-semibold" 
            onClick={() => setActiveTab('quiz')}
          >
            SOP Assessment
          </Button>
        </div>

        {/* Content Tabs */}
        {activeTab === 'videos' ? (
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-xs text-foreground uppercase tracking-wider">Suggested Courses</h3>
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden border shadow-sm cursor-pointer hover:border-primary/20 transition-all">
                <div className="relative aspect-video">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                    <PlayCircle className="h-12 w-12 text-white/90 hover:scale-110 transition-transform" />
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded">
                    {course.duration}
                  </span>
                </div>
                <CardContent className="p-4">
                  <span className="text-[10px] uppercase font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                    {course.category}
                  </span>
                  <h4 className="font-heading font-bold text-foreground text-sm mt-2 leading-snug">
                    {course.title}
                  </h4>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading font-bold flex items-center gap-1.5 text-primary">
                <FileQuestion className="h-4 w-4" /> SOP Certification Quiz
              </CardTitle>
              <CardDescription className="text-xs">Answer correctly to certify your profile</CardDescription>
            </CardHeader>
            <CardContent>
              {quizScore === 100 ? (
                <div className="text-center py-6 space-y-4">
                  <div className="h-14 w-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-emerald-950 text-sm">Assessment Passed!</h4>
                    <p className="text-xs text-muted-foreground mt-1">You are now a certified Surya Service Professional.</p>
                  </div>
                  <Button variant="outline" className="w-full text-xs" onClick={() => { setQuizScore(null); setQ1(''); setQ2(''); }}>
                    Retake Quiz
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmitQuiz} className="space-y-6">
                  {/* Q1 */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-foreground">
                      1. Customer ke ghar pahunchte hi sabse pehle kya karna chahiye?
                    </p>
                    <RadioGroup value={q1} onValueChange={setQ1} className="space-y-2">
                      <div className="flex items-center space-x-2 border p-2.5 rounded-xl text-xs hover:bg-muted/30">
                        <RadioGroupItem value="a" id="q1a" />
                        <Label htmlFor="q1a" className="cursor-pointer font-medium w-full">Ghar ka darwaza direct kholna</Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-2.5 rounded-xl text-xs hover:bg-muted/30">
                        <RadioGroupItem value="b" id="q1b" />
                        <Label htmlFor="q1b" className="cursor-pointer font-medium w-full">Kaam direct shuru kar dena</Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-2.5 rounded-xl text-xs hover:bg-muted/30">
                        <RadioGroupItem value="c" id="q1c" />
                        <Label htmlFor="q1c" className="cursor-pointer font-medium w-full">Uniform me rahein, ring bell karein and door open hone par namaste bolein</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Q2 */}
                  <div className="space-y-3 border-t pt-4">
                    <p className="text-xs font-semibold text-foreground">
                      2. Service complete hone par customer ko kya check karwana zaroori hai?
                    </p>
                    <RadioGroup value={q2} onValueChange={setQ2} className="space-y-2">
                      <div className="flex items-center space-x-2 border p-2.5 rounded-xl text-xs hover:bg-muted/30">
                        <RadioGroupItem value="a" id="q2a" />
                        <Label htmlFor="q2a" className="cursor-pointer font-medium w-full">Kiya hua kaam check karwaye aur areawise safai check karwayen</Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-2.5 rounded-xl text-xs hover:bg-muted/30">
                        <RadioGroupItem value="b" id="q2b" />
                        <Label htmlFor="q2b" className="cursor-pointer font-medium w-full">Direct payment maange</Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-2.5 rounded-xl text-xs hover:bg-muted/30">
                        <RadioGroupItem value="c" id="q2c" />
                        <Label htmlFor="q2c" className="cursor-pointer font-medium w-full">Khelne chle jaye</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button type="submit" className="w-full h-11 text-xs font-semibold mt-2">
                    Submit Answers
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
