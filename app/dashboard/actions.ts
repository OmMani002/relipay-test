'use server';

import { signOut } from '@relipay/nextjs/server';

export async function logoutAction() {
  // Revokes the refresh token and clears session cookies, then bounces to /login
  await signOut('/login');
}
