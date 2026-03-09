import { CheckCircle2, Clock, XCircle, Building2, FileText, ShieldCheck, Rocket, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import ProviderDocuments from './ProviderDocuments';

interface ProviderOnboardingProps {
  provider: any;
}

const steps = [
  { key: 'register', label: 'Register Account', description: 'Create your provider account with company details', icon: Building2 },
  { key: 'documents', label: 'Upload Documents', description: 'Upload ID proof, business license & certifications', icon: Upload },
  { key: 'submit', label: 'Submit for Review', description: 'Your application has been submitted to the platform', icon: FileText },
  { key: 'approval', label: 'Admin Approval', description: 'Our team reviews your application & documents', icon: ShieldCheck },
  { key: 'active', label: 'Start Operating', description: 'Add services and servicemen, start receiving bookings', icon: Rocket },
];

export default function ProviderOnboarding({ provider }: ProviderOnboardingProps) {
  const status = provider?.status || 'pending';
  const isPending = status === 'pending';
  const isRejected = status === 'inactive';

  const currentStep = isRejected ? 3 : isPending ? 3 : 5;
  const progress = isRejected ? 50 : isPending ? 50 : 100;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Welcome, {provider?.owner_name || 'Provider'}!
        </h1>
        <p className="text-muted-foreground mt-2">
          {provider?.company_name || 'Your company'} — here's your onboarding status
        </p>
      </div>

      {/* Status Banner */}
      <Card className={`mb-6 border-2 ${isPending ? 'border-warning/40 bg-warning/5' : isRejected ? 'border-destructive/40 bg-destructive/5' : 'border-success/40 bg-success/5'}`}>
        <CardContent className="p-6 flex items-center gap-4">
          {isPending && <Clock className="h-10 w-10 text-warning shrink-0" />}
          {isRejected && <XCircle className="h-10 w-10 text-destructive shrink-0" />}
          {!isPending && !isRejected && <CheckCircle2 className="h-10 w-10 text-success shrink-0" />}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-heading font-bold text-lg text-foreground">
                {isPending ? 'Application Under Review' : isRejected ? 'Application Not Approved' : 'You\'re Approved!'}
              </h2>
              <Badge variant={isPending ? 'secondary' : isRejected ? 'destructive' : 'default'} className="text-xs">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {isPending && 'Our admin team is reviewing your application. This usually takes 1-2 business days.'}
              {isRejected && 'Unfortunately your application was not approved. Please contact support for more details or update your information and resubmit.'}
              {!isPending && !isRejected && 'Your account is active! You can now add services and start receiving bookings.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base font-heading">Approval Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-2 mb-6" />
          <div className="space-y-4">
            {steps.map((step, i) => {
              const stepNum = i + 1;
              const isCompleted = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;
              const isFailed = isRejected && stepNum === 3;

              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                    isFailed ? 'bg-destructive/10 text-destructive' :
                    isCompleted ? 'bg-success/10 text-success' :
                    isCurrent ? 'bg-primary/10 text-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {isFailed ? <XCircle className="h-4 w-4" /> :
                     isCompleted ? <CheckCircle2 className="h-4 w-4" /> :
                     <step.icon className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${
                      isFailed ? 'text-destructive' :
                      isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    }`}>{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">
            {isPending ? 'While You Wait' : isRejected ? 'What You Can Do' : 'Next Steps'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isPending && (
            <>
              <p className="text-sm text-muted-foreground">✅ Your registration is complete</p>
              <p className="text-sm text-muted-foreground">⏳ Admin approval typically takes 1-2 business days</p>
              <p className="text-sm text-muted-foreground">🔔 You'll receive a notification once your account is approved</p>
              <p className="text-sm text-muted-foreground">📋 Meanwhile, plan your services and team — you can add them once approved</p>
            </>
          )}
          {isRejected && (
            <>
              <p className="text-sm text-muted-foreground">📧 Contact support to understand the reason for rejection</p>
              <p className="text-sm text-muted-foreground">📝 Update your company information if needed</p>
              <p className="text-sm text-muted-foreground">🔄 You may re-apply after addressing any concerns</p>
            </>
          )}
          {!isPending && !isRejected && (
            <>
              <Link to="/provider/servicemen">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                  👥 Add your servicemen / team members
                </Button>
              </Link>
              <Link to="/provider/bookings">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                  📅 View and manage bookings
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
