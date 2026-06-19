'use server';

import { signOut } from '@/lib/auth';

export async function logoutAction() {
  // Revokes the refresh token and clears session cookies, then bounces to /login
  await signOut('/login');
}
