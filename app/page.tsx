import Link from "next/link";
import { auth } from "@relipay/nextjs/server";

export default async function Home() {
  let session = null;
  try {
    session = await auth();
  } catch (error) {
    console.warn("Home page: Auth session could not be resolved:", error);
  }

  return (
    <main className="relative flex flex-col items-center justify-center px-4 py-24 min-h-screen">
      <div className="gradient-bg"></div>
      
      <div className="w-full max-w-2xl text-center space-y-8 animate-fade-in">
        <div className="flex justify-center">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl">
            <svg className="w-12 h-12 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">ReliPay Portal</span>
          </h1>
          <p className="max-w-md mx-auto text-lg text-zinc-400">
            A premium, secure task management dashboard integrated with the ReliPay authentication and billing network.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {session ? (
            <Link href="/dashboard" className="btn-primary w-full sm:w-auto px-8 py-3">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-primary w-full sm:w-auto px-8 py-3">
                Sign In
              </Link>
              <Link href="/register" className="btn-secondary w-full sm:w-auto px-8 py-3">
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
