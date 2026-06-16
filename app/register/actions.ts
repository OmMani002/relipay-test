'use server';

import { signUp } from '@relipay/nextjs/server';
import { redirect } from 'next/navigation';

export async function registerAction(prevState: any, formData: FormData) {
  const email = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return { error: 'Please enter both an email address and password.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' };
  }

  let success = false;
  try {
    await signUp({ email, password });
    success = true;
  } catch (err: any) {
    console.error('Registration failed:', err);
    const fixText = err.fix ? ` (Suggested Fix: ${err.fix})` : '';
    return { 
      error: `${err.message || 'An error occurred during registration.'}${fixText}` 
    };
  }

  if (success) {
    redirect('/dashboard');
  }
}
