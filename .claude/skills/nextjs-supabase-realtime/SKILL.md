---
name: nextjs-supabase-realtime
description: Use whenever working with Next.js 15 App Router + Supabase + Clerk together — server clients, Realtime subscriptions, RLS with Clerk JWTs, server actions, middleware. Trigger on terms "Next.js 15", "App Router", "Supabase realtime", "Clerk JWT", "RLS", "createServerClient", "server action".
---

# Next.js 15 + Supabase + Clerk

## Three Supabase clients, three jobs

```
lib/supabase/
├── server.ts       # Server components, Route Handlers, Server Actions
├── client.ts       # Client components (Realtime, browser-side reads)
└── middleware.ts   # Edge middleware (rare in this app)
```

### lib/supabase/server.ts

```typescript
import { auth } from '@clerk/nextjs/server';
import { createServerClient as createSSRClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const { getToken } = await auth();
  const supabaseToken = await getToken({ template: 'supabase' });
  const cookieStore = await cookies();
  
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: supabaseToken
          ? { Authorization: `Bearer ${supabaseToken}` }
          : {},
      },
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* Server Component context — ignore */ }
        },
      },
    }
  );
}

// Service-role client for server-only operations that bypass RLS
// (e.g., webhook handlers, admin scripts)
export function createServiceClient() {
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // ← never expose to client
    {
      cookies: { getAll() { return []; }, setAll() {} },
      auth: { persistSession: false },
    }
  );
}
```

### lib/supabase/client.ts

```typescript
'use client';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@clerk/nextjs';
import { useMemo } from 'react';

export function useSupabase() {
  const { getToken } = useAuth();
  
  return useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          fetch: async (url, options = {}) => {
            const token = await getToken({ template: 'supabase' });
            const headers = new Headers(options.headers);
            if (token) headers.set('Authorization', `Bearer ${token}`);
            return fetch(url, { ...options, headers });
          },
        },
      }
    );
  }, [getToken]);
}
```

## Clerk middleware (Next.js 15)

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/calls(.*)',
  '/leads(.*)',
  '/settings(.*)',
  '/onboarding(.*)',
  '/api/voice(.*)',
  '/api/onboarding(.*)',
]);

const isPublicWebhook = createRouteMatcher([
  '/api/stripe/webhook',
  '/api/elevenlabs/webhook',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicWebhook(req)) return;       // webhooks have their own auth (signature)
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

⚠️ `clerkMiddleware()` — NOT the deprecated `authMiddleware()`.

## Clerk JWT template for Supabase

In Clerk Dashboard → JWT Templates → New → Supabase:
```json
{
  "aud": "authenticated",
  "exp": {{user.public_metadata.exp || (now + 3600)}},
  "iat": {{now}},
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "role": "authenticated"
}
```

The `sub` claim becomes `auth.jwt() ->> 'sub'` in your RLS policies.

## Realtime subscription pattern

```typescript
'use client';
import { useSupabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function LiveCalls({ initial }: { initial: Call[] }) {
  const supabase = useSupabase();
  const [calls, setCalls] = useState(initial);
  
  useEffect(() => {
    const channel = supabase
      .channel('calls-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'calls' },
        (payload) => {
          setCalls(prev => [payload.new as Call, ...prev].slice(0, 50));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'calls' },
        (payload) => {
          setCalls(prev => prev.map(c =>
            c.id === payload.new.id ? (payload.new as Call) : c
          ));
        }
      )
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);
  
  return /* render */;
}
```

Required SQL one-time setup:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE calls;
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
```

Without this, the subscription connects but never fires.

## Server actions pattern

```typescript
// app/(app)/leads/actions.ts
'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateLeadStatus(leadId: string, status: 'new'|'contacted'|'won'|'lost') {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', leadId);
  
  if (error) return { error: error.message };
  
  revalidatePath('/leads');
  return { success: true };
}
```

Used from a client component:
```typescript
'use client';
import { updateLeadStatus } from './actions';
import { useTransition } from 'react';

export function LeadCard({ lead }: { lead: Lead }) {
  const [pending, startTransition] = useTransition();
  
  return (
    <button
      onClick={() => startTransition(() => updateLeadStatus(lead.id, 'won'))}
      disabled={pending}
    >
      Mark won
    </button>
  );
}
```

## Route Handler pattern (API routes)

```typescript
// app/api/voice/clone/route.ts
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });
  
  const formData = await req.formData();
  const audio = formData.get('audio') as File;
  if (!audio) return new Response('Missing audio', { status: 400 });
  
  // Forward to ElevenLabs
  const elForm = new FormData();
  elForm.append('name', `Voice-${userId}`);
  elForm.append('files', audio, 'sample.mp3');
  
  const res = await fetch('https://api.elevenlabs.io/v1/voices/add', {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! },
    body: elForm,
  });
  
  if (!res.ok) return new Response('EL failed', { status: 502 });
  const { voice_id } = await res.json();
  
  const supabase = await createClient();
  await supabase
    .from('businesses')
    .update({ /* save voice_id via agents table */ })
    .eq('clerk_user_id', userId);
  
  return Response.json({ voice_id });
}
```

## Critical gotchas

1. **`createBrowserClient` returns a singleton if called identically.** Wrap in `useMemo` keyed on dependencies, or you get a fresh client each render — Realtime channels break.
2. **Clerk's `auth()` is async in Next 15.** Always `await auth()` and destructure `{ userId }` from the awaited result.
3. **Server Actions can't be called from `route.ts` handlers.** They're a different mechanism. Use direct DB calls in route handlers.
4. **`revalidatePath` doesn't refetch client components.** It invalidates the server cache; the client only re-renders on next navigation unless you also `router.refresh()`.
5. **Realtime over RLS: the JWT must be passed.** The browser client's `global.fetch` override above ensures this. Without it, postgres_changes subscriptions return no rows (RLS denies).
6. **Service role client must NEVER reach the browser.** Keep it in `lib/supabase/server.ts` only, use it only in route handlers / server actions.
7. **Edge runtime can't run Stripe SDK.** Add `export const runtime = 'nodejs'` to webhook routes that use Stripe.

## Don't do these

- Don't roll your own auth context (Clerk's `<ClerkProvider>` + `useAuth` is enough)
- Don't fetch initial data in `useEffect` if you can do it in a server component
- Don't put Supabase queries in client components that could be server components
- Don't use TanStack Query — server components + Realtime + revalidation cover the needs
