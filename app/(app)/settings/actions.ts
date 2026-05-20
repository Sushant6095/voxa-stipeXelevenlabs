'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import type { Language } from '@/lib/supabase/types';

/**
 * /settings server actions. Edits a single business row scoped via RLS.
 */

const LanguageSchema: z.ZodType<Language> = z.enum([
  'en',
  'hi',
  'ta',
  'te',
]);

const SettingsSchema = z.object({
  name: z.string().trim().min(1).max(200),
  owner_phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : null)),
  owner_whatsapp: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : null)),
  website_url: z
    .string()
    .trim()
    .max(2_048)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : null)),
  language: LanguageSchema,
});

export interface SettingsResult {
  ok: boolean;
  error?: string;
}

export async function updateBusinessSettings(
  formData: FormData,
): Promise<SettingsResult> {
  const raw = {
    name: formData.get('name'),
    owner_phone: formData.get('owner_phone') ?? '',
    owner_whatsapp: formData.get('owner_whatsapp') ?? '',
    website_url: formData.get('website_url') ?? '',
    language: formData.get('language'),
  };
  const parsed = SettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form' };
  }

  const supabase = await createClient();

  // RLS scopes the UPDATE to the caller's row.
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .maybeSingle();

  if (!business) return { ok: false, error: 'No business yet' };

  const { error } = await supabase
    .from('businesses')
    .update(parsed.data)
    .eq('id', business.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/settings');
  return { ok: true };
}
