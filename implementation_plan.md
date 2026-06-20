# Restore ReliPay Authentication & UI

This plan outlines the steps required to restore the authentication layers using the `@relipay/nextjs` SDK in our Next.js application, reversing the bypass changes and restoring the login/register flows.

## Proposed Changes

We will restore route-gating via Next.js Middleware, create standard login and registration pages with server actions, restore user identity visual elements, and wire up the logout buttons.

---

### Middleware & Routing

#### [MODIFY] [middleware.ts](file:///d:/Relipay%20Test/relipay-test/middleware.ts)
- Uncomment the `relipayMiddleware` configuration to protect `/dashboard` and make `/`, `/login`, and `/register` public.
- Remove the temporary bypass middleware.

#### [MODIFY] [page.tsx](file:///d:/Relipay%20Test/relipay-test/app/page.tsx)
- Rebuild the landing/welcome page UI with premium styling.
- Check session status using `auth()` from `@relipay/nextjs/server`. If signed in, show a "Go to Dashboard" button; otherwise, show "Sign In" and "Create Account" buttons.

---

### Authentication Pages & Actions

#### [NEW] [actions.ts](file:///d:/Relipay%20Test/relipay-test/app/login/actions.ts)
- Create a server action to handle user log-ins by calling `signIn` from `@relipay/nextjs/server`.
- Handle success by redirecting to `/dashboard`, and return errors dynamically to the login form.

#### [NEW] [page.tsx](file:///d:/Relipay%20Test/relipay-test/app/login/page.tsx)
- Build a glassmorphic login card UI that integrates with `loginAction` using React 19's `useActionState` for handling loading and error states.

#### [NEW] [actions.ts](file:///d:/Relipay%20Test/relipay-test/app/register/actions.ts)
- Create a server action to handle user registration by calling `signUp` from `@relipay/nextjs/server`.
- Automatically redirect to `/dashboard` on success and capture potential registration errors.

#### [NEW] [page.tsx](file:///d:/Relipay%20Test/relipay-test/app/register/page.tsx)
- Build a registration card UI matching the login style, connecting to `registerAction`.

---

### Dashboard, Billing & Layout Updates

#### [NEW] [actions.ts](file:///d:/Relipay%20Test/relipay-test/app/dashboard/actions.ts)
- Add a new server action containing `logoutAction` using `signOut` from `@relipay/nextjs/server`.

#### [MODIFY] [page.tsx](file:///d:/Relipay%20Test/relipay-test/app/dashboard/page.tsx)
- Change the `auth` import from `@/lib/auth` to `@relipay/nextjs/server`.
- Restore the navigation header containing the user's email address and the "Log Out" form action.

#### [MODIFY] [page.tsx](file:///d:/Relipay%20Test/relipay-test/app/dashboard/billing/page.tsx)
- Change the `auth` import from `@/lib/auth` to `@relipay/nextjs/server`.
- Restore the navigation header containing the user's email address and the "Log Out" button.
- Query active billing providers using `relipay.billing.getProviders()` and pass them to the client.

#### [MODIFY] [actions.ts](file:///d:/Relipay%20Test/relipay-test/app/dashboard/billing/actions.ts)
- Update `createCheckoutAction` to accept a `provider` parameter ('stripe' | 'paypal' | 'razorpay') and pass it to the SDK's `createCheckout` method.
- Update the `auth` import statement to target `@relipay/nextjs/server`.

#### [MODIFY] [billing-client.tsx](file:///d:/Relipay%20Test/relipay-test/app/dashboard/billing/billing-client.tsx)
- Accept `providers` list from parent component.
- Dynamically render checkout buttons for "Pay with Stripe" and "Pay with PayPal" depending on active application configurations, styling them nicely to fit brand aesthetics.

#### [MODIFY] [todo-actions.ts](file:///d:/Relipay%20Test/relipay-test/app/dashboard/todo-actions.ts)
- Update the `auth` import statement to target `@relipay/nextjs/server`.

---

## Verification Plan

### Automated Tests
- Validate TypeScript compilation by running:
  ```powershell
  npm run build
  ```

### Manual Verification
1. Open `/dashboard/billing`.
2. Check that pricing cards now list **Pay with Stripe** and **Pay with PayPal** options under the active plans.
3. Click **Pay with Stripe**; verify you are redirected to the Stripe Checkout portal on the ReliPay server.
4. Go back and click **Pay with PayPal**; verify you are redirected to the PayPal checkout flow.
