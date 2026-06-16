# How I Built Secure Next.js Authentication in 10 Minutes with ReliPay

Authentication is a cornerstone of any SaaS application, but setting it up from scratch can be tedious. Today, I’ll show you how I built a secure **Login + Registration system** with **Route Protection** using **ReliPay** and the new **Next.js App Router (React 19)**. 

ReliPay is a self-hostable, Clerk-style auth and billing service designed for modern stacks. We'll be using their official Next.js SDK to hook everything up in just a few steps.

Here is a step-by-step guide on how I did it.

---

## 🛠️ The Architecture at a Glance

We implemented a full-stack Next.js App Router application with:
- **Public Routes**: `/` (Welcome), `/login`, `/register`.
- **Protected Routes**: `/dashboard` (gated via Next.js middleware).
- **Security**: httpOnly, secure cookie-based session management (`relipay_access` and `relipay_refresh` rotated automatically by the SDK).
- **UI**: Premium glassmorphic dark-theme design.

---

## 🚀 Step 1: Getting API Credentials

ReliPay offers both a self-hosted Docker Compose stack and a hosted cloud sandbox. Since we wanted to get up and running quickly, we used the cloud panel:
1. Headed over to **[https://panel.relipay.dev](https://panel.relipay.dev)** and registered an account.
2. Created a new Application inside the dashboard.
3. Copied the generated **Application Secret Key** (starts with `rp_test_`).

We stored this in our local environment file:

```env
# .env.local
RELIPAY_URL=https://api.relipay.dev
RELIPAY_SECRET=rp_test_your_secret_key_here
```

---

## 📦 Step 2: Installation

Next, we installed the official ReliPay packages into our Next.js project. We used the `--legacy-peer-deps` flag to bypass peer dependency warnings with our specific React version:

```bash
npm install @relipay/nextjs @relipay/react @relipay/node --legacy-peer-deps
```

---

## 🛡️ Step 3: Protecting Routes with Middleware

To restrict unauthenticated users from visiting our `/dashboard`, we created a `middleware.ts` file in our root directory. The SDK provides a neat `relipayMiddleware` wrapper:

```typescript
// middleware.ts
import { relipayMiddleware } from '@relipay/nextjs/middleware';

export default relipayMiddleware({
  publicRoutes: ['/', '/login', '/register'],
  signInUrl: '/login', // Redirect target for signed-out users
});

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
```

This intercepts requests to protected routes, checks for the presence of the access cookie, and redirects to `/login` if it's missing.

---

## 📝 Step 4: Register Flow (Server Action + React 19 Form)

We created a custom registration form under `/register`. In Next.js, we separated our interactive UI from the secure server action to keep API calls on the server.

### The Server Action
We call the SDK's `signUp` method. If it succeeds, the SDK automatically issues cookies to the browser:

```typescript
// app/register/actions.ts
'use server';

import { signUp } from '@relipay/nextjs/server';
import { redirect } from 'next/navigation';

export async function registerAction(prevState: any, formData: FormData) {
  const email = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return { error: 'Please enter both an email address and password.' };
  }

  let success = false;
  try {
    await signUp({ email, password });
    success = true;
  } catch (err: any) {
    return { error: err.message || 'Registration failed.' };
  }

  if (success) {
    redirect('/dashboard');
  }
}
```

### The UI Form (Client Component)
We leveraged React 19's native `useActionState` to track form submissions, pending loading indicators, and error returns gracefully:

```tsx
// app/register/page.tsx
'use client';

import { useActionState } from 'react';
import { registerAction } from './actions';

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  return (
    <form action={formAction}>
      {state?.error && <div className="error">{state.error}</div>}
      <input name="email" type="email" required placeholder="Email" />
      <input name="password" type="password" required placeholder="Password" />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
```

---

## 🔑 Step 5: Sign In & Sign Out Flow

The login page follows the exact same pattern but uses the SDK's `signIn` helper:

```typescript
// app/login/actions.ts
import { signIn } from '@relipay/nextjs/server';

// inside the server action...
const outcome = await signIn({ email, password });
if (outcome.kind === 'session') {
  redirect('/dashboard');
}
```

To sign out, we created a small logout button on the dashboard that invokes a `'use server'` action calling `signOut()`:

```typescript
// app/dashboard/actions.ts
'use server';
import { signOut } from '@relipay/nextjs/server';

export async function logoutAction() {
  await signOut('/login'); // Revokes tokens and clears cookies
}
```

---

## 📊 Step 6: The Protected Dashboard

Because our middleware handles route protection, we can defensively read session credentials on `/dashboard` safely. We retrieve the session server-side using the `auth()` helper:

```tsx
// app/dashboard/page.tsx
import { auth } from '@relipay/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/login'); // Fallback

  const { user } = session;

  return (
    <div>
      <h1>Welcome to your Dashboard</h1>
      <p>Email: {user.email}</p>
      <p>User ID: {user.id}</p>
      <p>Verified: {user.emailVerified ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

---

## 🎨 Polishing the Experience

To elevate the developer test, I styled all forms and layouts using **Vanilla CSS (in `globals.css`)** to implement:
- Dynamic glass-panel panels (`backdrop-filter: blur()`).
- Modern typography using native systems and Vercel Geist.
- Glowing radial backgrounds.
- High-quality micro-animations (such as loading spinners and fade-in states).

---

## 💭 Verdict: How it Feels

Integrating **ReliPay** with Next.js felt incredibly streamlined. Key takeaways:
1. **Developer Experience**: The `auth()`, `signIn()`, and `signUp()` APIs are extremely simple.
2. **AI-Ready Error Messages**: When connection or credential errors occur, the SDK throws errors that contain a `fix` suggestion (e.g., reminding the dev to run their docker container or verify API keys).
3. **No Auth boilerplate**: We didn't have to write custom JWT verification logic, manage token rotation in cookies, or build complex callback handlers. ReliPay's SDK handles all token lifecycles and HTTP-only cookie headers behind the scenes.
