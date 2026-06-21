import { auth } from '@relipay/nextjs/server';
import { redirect } from 'next/navigation';
import { logoutAction } from './actions';
import { getTodos, getUserPlan, countTasksCreatedThisMonth } from '../../lib/db';
import TodoWorkspace from './todo-workspace';
import Link from 'next/link';

export default async function DashboardPage() {
  let session = null;
  try {
    session = await auth();
  } catch (error) {
    console.warn("Dashboard page: Auth session could not be resolved:", error);
  }

  // If no session exists, redirect back to login (the middleware also handles this, but this is a defensive check)
  if (!session) {
    redirect('/login');
  }

  const { user } = session;

  // Resolve active plan tier and current todos / usage metrics
  const planInfo = await getUserPlan(user.id, session.accessToken);
  const todos = await getTodos(user.id);
  const monthlyCreatedCount = await countTasksCreatedThisMonth(user.id);

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
          <span className="text-xs text-zinc-400 font-mono">
            {user.metadata && (user.metadata as any).name ? `${(user.metadata as any).name} (${user.email})` : user.email}
          </span>
          <form action={logoutAction}>
            <button type="submit" className="btn-secondary py-1 px-3 text-xs">
              Log Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Dashboard Section */}
      <div className="w-full max-w-6xl space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[hsl(var(--card-border))] pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-white font-sans">Task Workspace</h1>
            <p className="text-sm text-zinc-400 mt-1">Manage and organize your personal isolated checklist</p>
          </div>
          
          <div className="flex items-center gap-2 bg-black/40 p-1 border border-zinc-800 rounded-xl">
            <Link 
              href="/dashboard" 
              className="py-1.5 px-4 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shadow-sm"
            >
              Tasks Workspace
            </Link>
            <Link 
              href="/dashboard/billing" 
              className="py-1.5 px-4 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Billing & Plans
            </Link>
          </div>
        </div>

        {/* Workspace Alerts Panel */}
        {planInfo.tier === 'free' && todos.length === 9 && (
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2 animate-fade-in shadow-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>You have created 9 of 10 allowed tasks on the Free tier. Upgrade your subscription under the <Link href="/dashboard/billing" className="underline font-bold text-white hover:text-amber-200">Billing tab</Link> to avoid locking task creation.</span>
          </div>
        )}

        {/* Todo Workspace Component */}
        <TodoWorkspace 
          initialTodos={todos} 
          user={user} 
          planInfo={planInfo}
          monthlyCreatedCount={monthlyCreatedCount}
        />
      </div>
    </main>
  );
}
