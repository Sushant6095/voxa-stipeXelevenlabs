import { updateBusinessSettings } from './actions';
import { revalidatePath } from 'next/cache';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getDashboardData } from '@/lib/dashboard-data';

export const dynamic = 'force-dynamic';

const LANGUAGES: { value: 'en' | 'hi' | 'ta' | 'te'; label: string; native: string }[] = [
  { value: 'en', label: 'English', native: 'English' },
  { value: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { value: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { value: 'te', label: 'Telugu', native: 'తెలుగు' },
];

async function submitSettings(formData: FormData) {
  'use server';
  await updateBusinessSettings(formData);
  revalidatePath('/settings');
}

export default async function SettingsPage() {
  const data = await getDashboardData();
  const business = data.business;

  return (
    <div className="space-y-6">
      <DashboardHeader title="Settings" subtitle="Business profile and preferences." />

      <Card className="p-6">
        <form action={submitSettings} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Business name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={business?.name ?? ''}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner_whatsapp">Owner WhatsApp (E.164)</Label>
            <Input
              id="owner_whatsapp"
              name="owner_whatsapp"
              defaultValue={business?.owner_whatsapp ?? ''}
              placeholder="+919876543210"
              pattern="^\+\d{10,15}$"
            />
            <p className="text-xs text-muted-foreground">
              We send daily call digests and hot-lead alerts here.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Primary language</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {LANGUAGES.map((lang) => {
                const checked = (business?.language ?? 'en') === lang.value;
                return (
                  <label
                    key={lang.value}
                    className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-border/60 px-4 py-3 text-center transition-colors hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="radio"
                      name="language"
                      value={lang.value}
                      defaultChecked={checked}
                      className="sr-only"
                    />
                    <span className="font-heading text-base">{lang.native}</span>
                    <span className="text-xs text-muted-foreground">{lang.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website_url">Website URL</Label>
            <Input
              id="website_url"
              name="website_url"
              type="url"
              defaultValue={business?.website_url ?? ''}
              placeholder="https://yourbusiness.com"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
