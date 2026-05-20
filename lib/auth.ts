import 'server-only';

/**
 * Voxa auth shim — drop-in replacement for `@clerk/nextjs/server` after auth
 * was fully removed from the project. Every request is treated as the same
 * demo user; nothing is gated.
 *
 * Call-sites that did:
 *   import { auth, currentUser } from '@/lib/auth';
 * now do:
 *   import { auth, currentUser } from '@/lib/auth';
 *
 * The exported shapes match Clerk's API tightly enough that existing
 * destructuring (`const { userId } = await auth()`) keeps working.
 */

export const DEMO_USER_ID = 'demo-user';
export const DEMO_USER_EMAIL = 'demo@voxa.local';

interface AuthResult {
  userId: string;
  sessionId: string | null;
  /** Stubbed: no real JWT is ever issued. */
  getToken: (opts?: { template?: string }) => Promise<string | null>;
  /** Stubbed: always resolves; nothing to protect. */
  protect: () => Promise<void>;
}

export async function auth(): Promise<AuthResult> {
  return {
    userId: DEMO_USER_ID,
    sessionId: null,
    getToken: async () => null,
    protect: async () => undefined,
  };
}

interface CurrentUserResult {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName: string;
  lastName: string;
  imageUrl: string;
}

export async function currentUser(): Promise<CurrentUserResult> {
  return {
    id: DEMO_USER_ID,
    emailAddresses: [{ emailAddress: DEMO_USER_EMAIL }],
    firstName: 'Demo',
    lastName: 'User',
    imageUrl: '',
  };
}

/** Returns the (always-present) demo user ID. */
export async function currentClerkUserId(): Promise<string | null> {
  return DEMO_USER_ID;
}

/** Returns the demo user's email. */
export async function currentClerkUserEmail(): Promise<string | null> {
  return DEMO_USER_EMAIL;
}

interface ClerkClientUser {
  id: string;
  primaryEmailAddress: { emailAddress: string } | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
}

interface ClerkClientStub {
  users: {
    getUser: (id: string) => Promise<ClerkClientUser>;
  };
}

/** Stub for Clerk's `clerkClient()` — always returns the demo user. */
export async function clerkClient(): Promise<ClerkClientStub> {
  return {
    users: {
      getUser: async (id: string) => ({
        id,
        primaryEmailAddress: { emailAddress: DEMO_USER_EMAIL },
        firstName: 'Demo',
        lastName: 'User',
        username: 'demo',
      }),
    },
  };
}
