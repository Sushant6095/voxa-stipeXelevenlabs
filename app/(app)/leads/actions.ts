'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import type { LeadStatus } from '@/lib/supabase/types';

/**
 * Server actions for the /leads kanban.
 *
 * RLS enforces "this business only" — we still validate inputs with Zod
 * because server actions are client-callable and must not trust the payload.
 */

const UuidSchema = z.string().uuid();
const StatusSchema = z.enum(['new', 'contacted', 'won', 'lost']);

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
): Promise<ActionResult> {
  const parsedId = UuidSchema.safeParse(leadId);
  const parsedStatus = StatusSchema.safeParse(status);
  if (!parsedId.success) return { ok: false, error: 'Invalid lead id' };
  if (!parsedStatus.success) return { ok: false, error: 'Invalid status' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('leads')
    .update({ status: parsedStatus.data })
    .eq('id', parsedId.data);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/leads');
  revalidatePath('/dashboard');
  return { ok: true };
}

const NotesSchema = z.string().trim().max(2_000);

export async function updateLeadNotes(
  leadId: string,
  notes: string,
): Promise<ActionResult> {
  const parsedId = UuidSchema.safeParse(leadId);
  const parsedNotes = NotesSchema.safeParse(notes);
  if (!parsedId.success) return { ok: false, error: 'Invalid lead id' };
  if (!parsedNotes.success) return { ok: false, error: 'Notes too long' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('leads')
    .update({ notes: parsedNotes.data })
    .eq('id', parsedId.data);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/leads');
  return { ok: true };
}
