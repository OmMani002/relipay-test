# Implementation Plan - Billing Integration with ReliPay

This plan details the implementation of a Billing page in the To-Do application, establishing subscription tiers and enforcing task creation limits based on the user's active tier.

## User Review Required

> [!IMPORTANT]
> - **Subscription Tiers**:
>   1. **Free Tier (0 INR)**: Restricts task creation to **10 tasks** total.
>   2. **100 INR Monthly Tier**: Restricts task creation to **30 tasks per month**.
>   3. **800 INR Yearly Tier**: Allows **unlimited tasks**.
> - **Dual Integration Strategy**:
>   - **Real Relipay Checkouts**: We use `relipay.billing.createCheckout` to redirect users to Stripe/Razorpay hosted pages configured inside your ReliPay application.
>   - **Sandbox Quick-Pass (Local Bypass)**: Because webhooks are not typically configured in standard local development sandboxes, we will build a local bypass option. This lets you mock-subscribe to any tier instantly to test task restriction limits without needing card payments or webhook relays.
> - **Task Enforcement**: We will modify the task creation Server Action to query the user's tier and count their current task totals before executing writes.

## Open Questions

> [!NOTE]
> 1. Should completing/deleting a task in the Free tier free up a slot (limit checked on total *active* tasks), or is it a hard limit of 10 tasks *created in total*? We will check against total tasks in the database by default, but let us know if you prefer active tasks.
> 2. For the 100 INR Monthly tier, we will calculate the count of tasks created within the current calendar month.

---

## Proposed Changes

### Database & Storage

#### [MODIFY] [db.ts](file:///d:/Relipay%20Test/relipay-test/lib/db.ts)
Update the database layer to:
1. Define the subscription data model and save mock user subscriptions to `data/subscriptions.json`.
2. Add a helper `getUserTier(userId: string, accessToken?: string)` to check for:
   - An active subscription on the remote ReliPay server (via `relipay.billing.getSubscription(accessToken)`).
   - If none exists, check for a local mock subscription in `data/subscriptions.json`.
   - Default to the Free tier.
3. Add a helper `countTasksCreatedThisMonth(userId: string)` to get the count of tasks created by the user in the current calendar month.

---

### Server Actions

#### [MODIFY] [todo-actions.ts](file:///d:/Relipay%20Test/relipay-test/app/dashboard/todo-actions.ts)
Update `createTodoAction` to:
1. Fetch the user's active tier via `getUserTier`.
2. Fetch current task metrics (total tasks or tasks created this month).
3. Throw a descriptive billing error if the user has reached their tier limit.

#### [NEW] [billing/actions.ts](file:///d:/Relipay%20Test/relipay-test/app/dashboard/billing/actions.ts)
Create Server Actions for billing checkout redirection and local subscription mock triggers:
- `createCheckoutAction(planSlug: string)`: Generates checkout session URL from the ReliPay billing SDK.
- `upgradeMockSubscriptionAction(planSlug: 'monthly' | 'yearly')`: Sets a local active subscription in `data/subscriptions.json`.
- `resetToFreeAction()`: Removes local subscriptions to revert user to the Free tier.

---

### UI Components & Pages

#### [MODIFY] [page.tsx](file:///d:/Relipay%20Test/relipay-test/app/dashboard/page.tsx)
Add a sub-navigation bar below the header to toggle between **Tasks Workspace** and **Billing & Plans**. Display a warnings banner on the Tasks Workspace if the user is approaching or has reached their tier's limit.

#### [NEW] [billing/page.tsx](file:///d:/Relipay%20Test/relipay-test/app/dashboard/billing/page.tsx)
Create a Billing and Pricing dashboard page:
- Fetch active plans from the ReliPay server using `relipay.billing.getPlans()`.
- Display a comparative pricing grid for the 3 tiers (Free, Monthly, Yearly).
- Include checkout triggers for real checkouts (redirects to Relipay portal).
- Add Sandbox Quick-Pass controls (Local Bypass buttons) to let developers toggle tiers instantly.
- Show active plan statuses, billing intervals, and success/cancellation notices from the URL query params.

---

### Styles & Polish

#### [MODIFY] [globals.css](file:///d:/Relipay%20Test/relipay-test/app/globals.css)
Add styling classes for billing pricing cards, plan benefit checklists, current plan indicators, and success alert banners.

---

### Documentation & Verification

#### [MODIFY] [task.md](file:///d:/Relipay%20Test/relipay-test/task.md)
Update tasks checklist to track billing integration.

---

## Verification Plan

### Automated Build Verification
Ensure clean compilation using Next.js build:
```bash
npm run build
```

### Manual Verification
1. Log in and verify task creation works up to 10 tasks on the **Free tier**.
2. Try creating an 11th task and ensure it fails with a billing warning banner.
3. Navigate to **Billing & Plans** and use the Sandbox Quick-Pass to upgrade to the **100 INR Monthly tier**.
4. Return to **Tasks Workspace**, confirm task limit shows 30 tasks/month, and verify you can create tasks past 10.
5. Upgrade to the **Yearly tier** and confirm task creation has no limits.
6. Test clicking the real checkout button to confirm the redirection to the hosted ReliPay checkout session works.
