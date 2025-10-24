'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/lib/stores/onboarding-store';
import {
  Stethoscope,
  Scissors,
  Scale,
  Briefcase,
  ShoppingBag,
  Home,
  Sparkles,
} from 'lucide-react';

const INDUSTRIES = [
  {
    id: 'healthcare',
    label: 'Healthcare',
    description: 'Doctors, dentists, clinics',
    icon: Stethoscope,
  },
  {
    id: 'beauty',
    label: 'Beauty & Wellness',
    description: 'Salons, spas, estheticians',
    icon: Scissors,
  },
  {
    id: 'legal',
    label: 'Legal Services',
    description: 'Lawyers, notaries',
    icon: Scale,
  },
  {
    id: 'consulting',
    label: 'Consulting & Services',
    description: 'Business services, coaching',
    icon: Briefcase,
  },
  {
    id: 'ecommerce',
    label: 'E-commerce & Retail',
    description: 'Online stores, retail shops',
    icon: ShoppingBag,
  },
  {
    id: 'real-estate',
    label: 'Real Estate',
    description: 'Agencies, property management',
    icon: Home,
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Something else',
    icon: Sparkles,
  },
];

export default function IndustryPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { data, updateIndustry } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(data.industry);

  const handleContinue = () => {
    if (selected) {
      updateIndustry(selected);
      router.push(`/${locale}/onboarding/customize`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">What's your industry?</h1>
        <p className="text-muted-foreground">
          This helps us optimize AVA's responses for your specific business type.
        </p>
      </div>

      {/* Industry Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {INDUSTRIES.map((industry) => {
          const Icon = industry.icon;
          const isSelected = selected === industry.id;

          return (
            <GlassCard
              key={industry.id}
              className={`p-6 cursor-pointer transition-all hover:scale-[1.02] ${
                isSelected
                  ? 'ring-2 ring-brand-500 bg-brand-500/5'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelected(industry.id)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                    isSelected
                      ? 'bg-brand-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{industry.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {industry.description}
                  </p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="ghost"
          onClick={() => router.push(`/${locale}/onboarding/welcome`)}
        >
          ← Back
        </Button>
        <Button
          size="lg"
          disabled={!selected}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
