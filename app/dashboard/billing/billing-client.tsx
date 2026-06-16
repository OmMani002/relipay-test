'use client';

import { useState, useTransition } from 'react';
import { 
  createCheckoutAction, 
  upgradeMockSubscriptionAction, 
  resetToFreeAction 
} from './actions';

interface Plan {
  id: string;
  slug: string;
  name: string;
  amount: number; // in cents/paise
  currency: string;
  interval: 'MONTH' | 'YEAR';
  active: boolean;
}

interface BillingClientProps {
  plans: Plan[];
  currentPlan: {
    tier: 'free' | 'monthly' | 'yearly';
    isMock: boolean;
    expiresAt: string | null;
  };
  totalTodosCount: number;
  status?: string;
}

export default function BillingClient({ 
  plans, 
  currentPlan, 
  totalTodosCount, 
  status 
}: BillingClientProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Locate the Monthly and Yearly plans from fetched list
  const monthlyPlan = plans.find(p => p.interval === 'MONTH' || p.slug.toLowerCase().includes('monthly'));
  const yearlyPlan = plans.find(p => p.interval === 'YEAR' || p.slug.toLowerCase().includes('yearly'));

  // Trigger real checkout redirect
  const handleRealCheckout = (planSlug: string) => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const result = await createCheckoutAction(planSlug);
        if (result.url) {
          window.location.href = result.url; // Redirect to hosted billing portal
        }
      } catch (error: any) {
        setErrorMsg(error.message || 'Failed to open billing portal. Please use Sandbox Quick-Pass.');
      }
    });
  };

  // Trigger local mock subscription bypass
  const handleMockUpgrade = (tier: 'monthly' | 'yearly') => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await upgradeMockSubscriptionAction(tier);
      } catch (error: any) {
        setErrorMsg('Failed to apply sandbox mock subscription.');
      }
    });
  };

  // Downgrade user back to Free
  const handleResetToFree = () => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await resetToFreeAction();
      } catch (error: any) {
        setErrorMsg('Failed to reset account to Free tier.');
      }
    });
  };

  // Format currency display (amount is in smallest units, e.g. cents/paise)
  const formatPrice = (amount: number, currency: string) => {
    const value = amount / 100;
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-8">
      
      {/* 1. Status Alert Banners */}
      {status === 'success' && (
        <div className="success-message p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-500/20 bg-emerald-500/5 animate-fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Payment Succeeded!</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Your subscription was successfully activated via the ReliPay portal.</p>
            </div>
          </div>
        </div>
      )}

      {status === 'cancelled' && (
        <div className="glass-panel p-5 rounded-2xl border-amber-500/20 bg-amber-500/5 flex items-start gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Checkout Cancelled</h4>
            <p className="text-xs text-zinc-400 mt-0.5">No charges were made. You can try checkouts again or use Sandbox Quick-Pass.</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="error-message p-4 rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-300 hover:text-white text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* 2. Active Subscription Overview */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-zinc-900 bg-zinc-950/45">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.02] rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Active Level</span>
              {currentPlan.isMock && (
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase tracking-wider">
                  Sandbox Quick-Pass Active
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white capitalize">
              {currentPlan.tier === 'free' ? 'Free Tier Plan' : currentPlan.tier === 'monthly' ? '100 INR Monthly Tier' : '800 INR Yearly Tier'}
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
              {currentPlan.tier === 'free' 
                ? `You have created ${totalTodosCount} of 10 tasks. Upgrade to increase capacity.` 
                : currentPlan.tier === 'monthly' 
                ? `You are allowed to create up to 30 tasks per calendar month. Excellent for individuals.`
                : `You have unlimited task creation capabilities. Complete freedom to scale.`}
            </p>
          </div>

          <div className="w-full md:w-auto bg-black/30 p-4 rounded-xl border border-[hsl(var(--card-border))] flex flex-col gap-1.5 justify-center min-w-[200px]">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
              <span>Limit Cap</span>
              <span className="text-zinc-300 font-bold capitalize">
                {currentPlan.tier === 'free' ? '10 tasks max' : currentPlan.tier === 'monthly' ? '30 tasks/mo' : 'Unlimited'}
              </span>
            </div>
            
            {/* Free Tier Usage Progress Bar */}
            {currentPlan.tier === 'free' && (
              <div className="mt-2">
                <div className="progress-bar-bg h-1.5">
                  <div 
                    className="progress-bar-fill"
                    style={{ width: `${Math.min((totalTodosCount / 10) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-zinc-500 text-right mt-1 font-mono">
                  {totalTodosCount} / 10 Used
                </div>
              </div>
            )}
            
            {currentPlan.expiresAt && (
              <div className="text-[10px] text-zinc-500 border-t border-zinc-800/80 pt-2 mt-1">
                Expires: {new Date(currentPlan.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: Free Tier */}
        <div className={`glass-panel rounded-2xl p-6 flex flex-col justify-between border relative overflow-hidden transition-all duration-300 ${
          currentPlan.tier === 'free' ? 'border-indigo-500 bg-indigo-500/[0.01]' : 'border-zinc-900 bg-zinc-950/20'
        }`}>
          {currentPlan.tier === 'free' && (
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Current
            </div>
          )}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Free Plan</h3>
              <p className="text-xs text-zinc-500 mt-1">Basic tasks tracking</p>
            </div>
            
            <div className="flex items-baseline gap-1 pt-2">
              <span className="text-3xl font-black text-white">₹0</span>
              <span className="text-xs text-zinc-500 font-semibold">/ forever</span>
            </div>

            <ul className="space-y-2.5 pt-4 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Up to 10 tasks total</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Interactive checklist</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Secure accounts isolation</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              disabled={currentPlan.tier === 'free' || isPending}
              onClick={handleResetToFree}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                currentPlan.tier === 'free'
                  ? 'bg-zinc-800 text-zinc-500 cursor-default border border-transparent'
                  : 'btn-secondary'
              }`}
            >
              {currentPlan.tier === 'free' ? 'Current Plan' : 'Downgrade to Free'}
            </button>
          </div>
        </div>

        {/* CARD 2: Monthly Tier */}
        <div className={`glass-panel rounded-2xl p-6 flex flex-col justify-between border relative overflow-hidden transition-all duration-300 ${
          currentPlan.tier === 'monthly' ? 'border-indigo-500 bg-indigo-500/[0.01]' : 'border-zinc-900 bg-zinc-950/20'
        }`}>
          {currentPlan.tier === 'monthly' && (
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Current
            </div>
          )}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Monthly Plan</h3>
              <p className="text-xs text-zinc-500 mt-1">Light personal workspaces</p>
            </div>
            
            <div className="flex items-baseline gap-1 pt-2">
              <span className="text-3xl font-black text-white">
                {monthlyPlan ? formatPrice(monthlyPlan.amount, monthlyPlan.currency) : '₹100'}
              </span>
              <span className="text-xs text-zinc-500 font-semibold">/ month</span>
            </div>

            <ul className="space-y-2.5 pt-4 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-bold text-zinc-300">Up to 30 tasks / month</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Task priority tags</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Sorting & filtering controls</span>
              </li>
            </ul>
          </div>

          <div className="pt-8 space-y-2">
            {currentPlan.tier === 'monthly' ? (
              <button
                disabled
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-500 cursor-default border border-transparent"
              >
                Current Plan
              </button>
            ) : (
              <>
                <button
                  disabled={isPending}
                  onClick={() => handleRealCheckout(monthlyPlan?.slug || '100_inr_monthly')}
                  className="w-full btn-primary py-2 px-4 text-xs flex items-center justify-center gap-1.5"
                >
                  {isPending && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                  Subscribe (ReliPay Portal)
                </button>
                <button
                  disabled={isPending}
                  onClick={() => handleMockUpgrade('monthly')}
                  className="w-full btn-secondary py-2 px-4 text-xs border-amber-500/20 hover:border-amber-500/40 text-amber-400/90"
                >
                  Sandbox Quick-Pass
                </button>
              </>
            )}
          </div>
        </div>

        {/* CARD 3: Yearly Tier */}
        <div className={`glass-panel rounded-2xl p-6 flex flex-col justify-between border relative overflow-hidden transition-all duration-300 ${
          currentPlan.tier === 'yearly' ? 'border-indigo-500 bg-indigo-500/[0.01]' : 'border-zinc-900 bg-zinc-950/20'
        }`}>
          {currentPlan.tier === 'yearly' && (
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Current
            </div>
          )}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Yearly Plan</h3>
              <p className="text-xs text-zinc-500 mt-1">Total freedom for power users</p>
            </div>
            
            <div className="flex items-baseline gap-1 pt-2">
              <span className="text-3xl font-black text-white">
                {yearlyPlan ? formatPrice(yearlyPlan.amount, yearlyPlan.currency) : '₹800'}
              </span>
              <span className="text-xs text-zinc-500 font-semibold">/ year</span>
            </div>

            <ul className="space-y-2.5 pt-4 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-bold text-white">Unlimited tasks always</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Task priority tags</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Full workspace analytics</span>
              </li>
            </ul>
          </div>

          <div className="pt-8 space-y-2">
            {currentPlan.tier === 'yearly' ? (
              <button
                disabled
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-500 cursor-default border border-transparent"
              >
                Current Plan
              </button>
            ) : (
              <>
                <button
                  disabled={isPending}
                  onClick={() => handleRealCheckout(yearlyPlan?.slug || '800_inr_yearly')}
                  className="w-full btn-primary py-2 px-4 text-xs flex items-center justify-center gap-1.5"
                >
                  {isPending && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                  Subscribe (ReliPay Portal)
                </button>
                <button
                  disabled={isPending}
                  onClick={() => handleMockUpgrade('yearly')}
                  className="w-full btn-secondary py-2 px-4 text-xs border-amber-500/20 hover:border-amber-500/40 text-amber-400/90"
                >
                  Sandbox Quick-Pass
                </button>
              </>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
