import { auth } from '@relipay/nextjs/server';
import { redirect } from 'next/navigation';
import { logoutAction } from '../actions';
import { getTodos, getUserPlan } from '../../../lib/db';
import { relipay } from '../../../lib/relipay';
import Link from 'next/link';
import BillingClient from './billing-client';

interface BillingPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const session = await auth();

  // Redirect back to login if unauthenticated
  if (!session) {
    redirect('/login');
  }

  const { user } = session;

  // 1. Fetch remote plans from the ReliPay SDK (with fallback mock plans if none exist)
  let plans: any[] = [];
  try {
    plans = await relipay.billing.getPlans();
  } catch (error) {
    console.error('Could not fetch plans from ReliPay server:', error);
  }

  // Ensure default plans exist for pricing display if none were returned by API
  if (!plans || plans.length === 0) {
    plans = [
      { id: '100_inr_monthly', slug: '100_inr_monthly', name: 'Monthly Plan', amount: 10000, currency: 'INR', interval: 'MONTH', active: true },
      { id: '800_inr_yearly', slug: '800_inr_yearly', name: 'Yearly Plan', amount: 80000, currency: 'INR', interval: 'YEAR', active: true },
    ];
  }

  // 2. Resolve active tier (either remote subscription or local sandbox mock)
  const currentPlan = await getUserPlan(user.id, session.accessToken);
  const todos = await getTodos(user.id);
  const totalTodosCount = todos.length;

  const status = (await searchParams).status;

  return (
    <main className="relative flex flex-col flex-1 items-center justify-start px-4 py-12 min-h-screen">
      <div className="gradient-bg"></div>

      {/* Navigation Header */}
      <header className="w-full max-w-6xl flex items-center justify-between p-4 mb-8 glass-panel rounded-2xl animate-fade-in">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-indigo-400 font-mono select-none hover:opacity-85">
          <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          ReliPay Portal
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline-block text-xs font-mono text-zinc-400 max-w-[200px] truncate">
            {user.email}
          </span>
          <form action={logoutAction}>
            <button type="submit" className="btn-secondary py-1.5 px-4 text-xs font-semibold">
              Log Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-6xl space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[hsl(var(--card-border))] pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-white font-sans">Billing & Subscription</h1>
            <p className="text-sm text-zinc-400 mt-1">Upgrade your tier to increase task creation capacities</p>
          </div>
          
          <div className="flex items-center gap-2 bg-black/40 p-1 border border-zinc-800 rounded-xl">
            <Link 
              href="/dashboard" 
              className="py-1.5 px-4 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Tasks Workspace
            </Link>
            <Link 
              href="/dashboard/billing" 
              className="py-1.5 px-4 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shadow-sm"
            >
              Billing & Plans
            </Link>
          </div>
        </div>

        {/* Client-side pricing workspace */}
        <BillingClient 
          plans={plans} 
          currentPlan={currentPlan} 
          totalTodosCount={totalTodosCount} 
          status={status}
        />
      </div>
    </main>
  );
}
