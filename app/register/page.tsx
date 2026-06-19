'use client';

// import { useActionState } from 'react';
// import Link from 'next/link';
// import { registerAction } from './actions';

import { redirect } from 'next/navigation';

export default function RegisterPage() {
  redirect('/dashboard');
  return null;
}

/*
export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  return (
    <main className="relative flex flex-col flex-1 items-center justify-center px-4 py-16 min-h-screen">
      <div className="gradient-bg"></div>

      <div className="glass-panel auth-card animate-fade-in">
        <div className="auth-header">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Register to get started with your dashboard</p>
        </div>

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="error-message">
              <svg className="w-5 h-5 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{state.error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="form-input"
              placeholder="name@example.com"
              disabled={isPending}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="form-input"
              placeholder="••••••••"
              disabled={isPending}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
*/
