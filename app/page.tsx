import Link from "next/link";
import { auth } from "@relipay/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  redirect('/dashboard');
  const session = await auth();

  return (
    <main className="relative flex flex-col flex-1 items-center justify-center px-4 py-24 min-h-screen">
      {/* Decorative gradient overlay */}
      <div className="gradient-bg"></div>

      <div className="w-full max-w-3xl text-center space-y-8 animate-fade-in">
        {/* ReliPay Brand Logo */}
        <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full border border-solid border-[hsl(var(--card-border))] bg-zinc-950/40 text-xs font-semibold tracking-wider text-indigo-400 uppercase select-none">
          <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          ReliPay Auth Integration
        </div>

        {/* Hero Title */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Secure Authentication,<br/>Simplified.
          </h1>
          <p className="max-w-xl mx-auto text-lg text-zinc-400 font-medium leading-relaxed">
            A secure authentication system powered by the ReliPay SDK, featuring server-side route protection, session management, and responsive pages.
          </p>
        </div>

        {/* Visual Call To Action Container */}
        <div className="glass-panel auth-card max-w-md mx-auto space-y-6">
          {session ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-emerald-500/10 text-emerald-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-300">Welcome back!</p>
                <p className="text-xs text-indigo-300 font-mono break-all">{session.user.email}</p>
              </div>
              <Link href="/dashboard" className="btn-primary w-full text-sm block">
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-indigo-500/10 text-indigo-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <p className="text-sm text-zinc-400 font-medium">
                You are currently signed out. Please sign in or register to access the dashboard.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <Link href="/login" className="btn-primary text-sm">
                  Sign In
                </Link>
                <Link href="/register" className="btn-secondary text-sm">
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer info badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-xs font-semibold text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Next.js App Router
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
            httpOnly Cookies
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
            Self-hosted ReliPay
          </div>
        </div>
      </div>
    </main>
  );
}
