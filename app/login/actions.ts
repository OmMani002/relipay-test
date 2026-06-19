'use server';

import { signIn } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return { error: 'Please enter both an email address and password.' };
  }

  let success = false;
  try {
    const outcome = await signIn({ email, password });
    if (outcome.kind === 'session') {
      success = true;
    } else if (outcome.kind === 'mfa_required') {
      return { 
        error: 'Multi-Factor Authentication (MFA) is required for this account, which is not supported in this simple flow.' 
      };
    }
  } catch (err: any) {
    console.error('Login failed:', err);
    const fixText = err.fix ? ` (Suggested Fix: ${err.fix})` : '';
    return { 
      error: `${err.message || 'Invalid email or password.'}${fixText}` 
    };
  }

  if (success) {
    redirect('/dashboard');
  }
}
