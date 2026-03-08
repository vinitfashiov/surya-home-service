import { ArrowLeft, Users, Shield, Zap, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const values = [
  { icon: Shield, title: 'Trust & Safety', desc: 'Every provider is verified and rated by real customers.' },
  { icon: Zap, title: 'Speed & Convenience', desc: 'Book in minutes, get service the same day.' },
  { icon: Heart, title: 'Customer First', desc: 'Transparent pricing, no hidden charges, 100% satisfaction guarantee.' },
  { icon: Users, title: 'Community', desc: 'Empowering local professionals and supporting small businesses.' },
];

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <h1 className="text-3xl font-heading font-bold text-foreground mb-4">About ServisGo</h1>
      <p className="text-lg text-muted-foreground leading-relaxed mb-10">
        ServisGo is a modern home services marketplace connecting skilled professionals with customers who need quality, reliable services — from plumbing and electrical work to deep cleaning and appliance repair.
      </p>

      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8 mb-10 border">
        <h2 className="text-xl font-heading font-semibold text-foreground mb-3">Our Mission</h2>
        <p className="text-muted-foreground leading-relaxed">
          To make professional home services accessible, transparent, and trustworthy for everyone. We believe every home deserves expert care, and every professional deserves fair opportunities.
        </p>
      </div>

      <h2 className="text-xl font-heading font-semibold text-foreground mb-5">Our Values</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {values.map((v) => (
          <Card key={v.title} className="border shadow-sm">
            <CardContent className="p-5">
              <v.icon className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-heading font-semibold text-foreground mb-1">{v.title}</h3>
              <p className="text-sm text-muted-foreground">{v.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-4 rounded-xl bg-muted/50">
          <p className="text-2xl font-heading font-bold text-primary">500+</p>
          <p className="text-xs text-muted-foreground">Verified Providers</p>
        </div>
        <div className="p-4 rounded-xl bg-muted/50">
          <p className="text-2xl font-heading font-bold text-primary">50K+</p>
          <p className="text-xs text-muted-foreground">Bookings Completed</p>
        </div>
        <div className="p-4 rounded-xl bg-muted/50">
          <p className="text-2xl font-heading font-bold text-primary">4.8★</p>
          <p className="text-xs text-muted-foreground">Average Rating</p>
        </div>
      </div>
    </div>
  );
}
