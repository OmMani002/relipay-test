# ReliPay Next.js Authentication Integration

This is a Next.js App Router application integrated with **ReliPay** authentication. It features user registration, secure sign-in, session validation, route protection via middleware, and a protected dashboard page.

---

## Architecture & Features

1. **Security**: Uses secure, `httpOnly`, encrypted session cookies (`relipay_access` and `relipay_refresh`) to safeguard tokens against Cross-Site Scripting (XSS).
2. **Middleware Route Protection**: Gated access using Next.js Middleware. All pages (such as `/dashboard`) are protected by default, except the homepage (`/`), registration (`/register`), and login (`/login`).
3. **React 19 Server Actions & `useActionState`**: Integrated natively using the latest React 19 forms API. Forms display validation and server SDK errors natively.
4. **Premium Aesthetics**: Features a dark-themed glassmorphism style system with harmonized indigo colors, custom cards, custom input styling, responsive layouts, and micro-animations.

---

## Setup Instructions

### 1. Prerequisites (ReliPay Instance)
ReliPay is a self-hostable authentication and billing monolith. Before running the Next.js app, ensure you have a running ReliPay instance:
- **Local Dev Stack**: Run `docker compose up` on your local ReliPay instance to boot the auth & billing stack (typically running on `http://localhost:3030`).
- **Configuration**: Visit your ReliPay Administrator Panel, create a **Tenant** and an **Application**, and generate a new **Application API Secret Key**.

### 2. Configure Environment Variables
Create or verify the `.env.local` file in the root of this project:
```env
# The API URL of your ReliPay server
RELIPAY_URL=http://localhost:3030

# The Application Secret Key (starts with rp_test_ or rp_live_)
RELIPAY_SECRET=rp_test_your_secret_key_here
```

*Note: Keep `RELIPAY_SECRET` secret and never expose it to client-side components.*

### 3. Installation
If not already installed, install the required packages. Peer dependencies are resolved using `--legacy-peer-deps` due to the Next.js 16 environment:
```bash
npm install @relipay/nextjs @relipay/react @relipay/node --legacy-peer-deps
```

### 4. Running the Development Server
Start the local server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to test the integration.

---

## Implementation Details

- **Gating routes**: [middleware.ts](file:///d:/Relipay%20Test/relipay-test/middleware.ts) protects internal paths. It checks for cookie presence and handles login redirection.
- **Login**: [app/login/page.tsx](file:///d:/Relipay%20Test/relipay-test/app/login/page.tsx) uses the server action in [actions.ts](file:///d:/Relipay%20Test/relipay-test/app/login/actions.ts) which calls `signIn({ email, password })`.
- **Registration**: [app/register/page.tsx](file:///d:/Relipay%20Test/relipay-test/app/register/page.tsx) uses the server action in [actions.ts](file:///d:/Relipay%20Test/relipay-test/app/register/actions.ts) which calls `signUp({ email, password })`.
- **Dashboard**: [app/dashboard/page.tsx](file:///d:/Relipay%20Test/relipay-test/app/dashboard/page.tsx) retrieves user credentials with the server-side `auth()` helper, and renders verified statuses.
- **Logout**: Handled via [app/dashboard/actions.ts](file:///d:/Relipay%20Test/relipay-test/app/dashboard/actions.ts) which calls `signOut()`.
