import { redirect } from 'next/navigation';

export interface Session {
  user: {
    id: string;
    email: string;
  };
  accessToken: string;
}

export async function auth(): Promise<Session | null> {
  // Mocked session to bypass remote checks
  return {
    user: {
      id: 'mock-user-id',
      email: 'guest-user@example.com',
    },
    accessToken: 'mock-access-token',
  };
}

export async function signIn(input: { email: string }) {
  return {
    kind: 'session' as const,
    session: {
      user: {
        id: 'mock-user-id',
        email: input.email || 'guest-user@example.com',
      },
      accessToken: 'mock-access-token',
    },
  };
}

export async function signUp(input: { email: string }) {
  return {
    user: {
      id: 'mock-user-id',
      email: input.email || 'guest-user@example.com',
    },
    accessToken: 'mock-access-token',
  };
}

export async function signOut(redirectTo?: string) {
  if (redirectTo) {
    redirect(redirectTo);
  }
}
