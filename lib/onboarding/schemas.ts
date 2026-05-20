import { z } from 'zod';

/**
 * Zod schemas for the onboarding wizard. Kept in a no-imports file so they
 * can be safely consumed from both server actions and client form resolvers
 * (e.g. react-hook-form's zodResolver) without dragging server-only modules
 * into the browser bundle.
 */

export const E164_REGEX = /^\+\d{10,15}$/;

export const businessFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Business name must be at least 2 characters')
    .max(80, 'Business name must be at most 80 characters'),
  ownerWhatsApp: z
    .string()
    .trim()
    .regex(E164_REGEX, 'WhatsApp must be E.164 (e.g. +919876543210)'),
  language: z.enum(['en', 'hi', 'ta', 'te']),
  websiteUrl: z
    .string()
    .trim()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional(),
});

export type BusinessFormValues = z.infer<typeof businessFormSchema>;

export const websiteUrlSchema = z.object({
  url: z.string().trim().url('Must be a valid URL'),
});

export type WebsiteUrlValues = z.infer<typeof websiteUrlSchema>;
