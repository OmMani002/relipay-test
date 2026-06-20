# Tasks: Restore ReliPay Authentication

- [x] Re-enable route protection in `middleware.ts`
- [x] Restore homepage (`app/page.tsx`) welcome UI and session checks
- [x] Implement `app/login/actions.ts` and `app/login/page.tsx`
- [x] Implement `app/register/actions.ts` and `app/register/page.tsx`
- [x] Implement `app/dashboard/actions.ts` for logout support
- [x] Restore user email and logout button in `app/dashboard/page.tsx`
- [x] Restore user email and logout button in `app/dashboard/billing/page.tsx`
- [x] Update imports to `@relipay/nextjs/server` in:
  - `app/dashboard/todo-actions.ts`
  - `app/dashboard/billing/actions.ts`
- [x] Verify everything compiles cleanly

## Stripe & PayPal Billing Tasks
- [x] Update `createCheckoutAction` in `app/dashboard/billing/actions.ts` to support provider argument
- [x] Fetch providers using `getProviders()` in `app/dashboard/billing/page.tsx`
- [x] Update `billing-client.tsx` to render Stripe and PayPal buttons
- [x] Verify build compiles cleanly
