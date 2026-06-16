# Walkthrough - To-Do App & Billing Integration with ReliPay

I have successfully created and integrated the **To-Do Workspace** and a **Billing & Subscriptions** page inside the protected dashboard using the **ReliPay** SDK.

---

## 🛠️ Key Features Added

### 1. Subscription Tiers
I implemented task creation limitations based on the active plan tier:
1. **Free Tier**: Restricted to a maximum of **10 tasks** in total.
2. **100 INR Monthly Plan**: Restricted to **30 tasks created in the current calendar month**.
3. **800 INR Yearly Plan**: Allows **unlimited tasks**.

### 2. Dual-Billing Integration (Checkout + Sandbox Bypass)
Because webhook configurations can be tricky in local sandboxes, I implemented a dual-billing layout:
- **Stripe/Razorpay Checkout**: Initiates a session redirect via `relipay.billing.createCheckout(...)` to let users pay using hosted checkout screens.
- **Sandbox Quick-Pass (Local Bypass)**: Bypasses the gateway to immediately toggle your local account status to Monthly/Yearly to check limits without payments.

### 3. Smart Workspace Alerts
- When a Free tier user hits 9 of 10 tasks, a friendly amber banner alerts them that they are close to the cap.
- When any tier limit is reached, the task creator input is locked client-side, showing a detailed warning card directing them to the Billing tab.
- If a user attempts to bypass client-side checks and call the Server Actions directly, the server checks the database records and rejects the mutation.

---

## 📂 Code Contributions

### 1. Database & Billing Store ([lib/db.ts](file:///d:/Relipay%20Test/relipay-test/lib/db.ts))
- Configured local mock subscriptions saving to [data/subscriptions.json](file:///d:/Relipay%20Test/relipay-test/data/subscriptions.json).
- Implemented `getUserPlan` which queries remote ReliPay endpoints first via `relipay.billing.getSubscription(accessToken)` and falls back to local mocks.
- Added calendar-month creation metrics tracking `countTasksCreatedThisMonth`.

### 2. Billing Portal UI ([app/dashboard/billing/page.tsx](file:///d:/Relipay%20Test/relipay-test/app/dashboard/billing/page.tsx) & [billing-client.tsx](file:///d:/Relipay%20Test/relipay-test/app/dashboard/billing/billing-client.tsx))
- Fetches active plans dynamically from your ReliPay panel and renders comparative feature checklist pricing cards.
- Provides interactive triggers for checkout redirect, quick sandbox mocks, and plan resets.

### 3. Billing Actions ([app/dashboard/billing/actions.ts](file:///d:/Relipay%20Test/relipay-test/app/dashboard/billing/actions.ts))
- Exposes server actions for checkouts, mock upgrades, and downgrades.

### 4. Limit Enforcement in Workspace ([app/dashboard/todo-actions.ts](file:///d:/Relipay%20Test/relipay-test/app/dashboard/todo-actions.ts) & [todo-workspace.tsx](file:///d:/Relipay%20Test/relipay-test/app/dashboard/todo-workspace.tsx))
- Blocks task creation and raises errors when limits are exceeded.
- Renders locking states, banner notifications, and links to the plans tab.

---

## 🧪 Manual Verification Steps

1. Make sure your local Next.js dev server is running (`npm run dev`).
2. Log in at `http://localhost:3000/login` or register a new user.
3. **Test the Free tier**:
   - Add 10 tasks. Verify the warning banner appears when you hit 9 tasks.
   - When you hit 10 tasks, verify the task creation form locks and states that your limit is reached.
4. **Test the Sandbox Quick-Pass**:
   - Click the **Billing & Plans** tab.
   - Select **Sandbox Quick-Pass** under the **Monthly Plan (100 INR)**.
   - Go back to the **Tasks Workspace**. Confirm your active plan updates to *100 INR Monthly* and the form unlocks, allowing you to add more tasks.
5. **Test the Yearly Plan**:
   - Upgrade to **Yearly Plan** using Sandbox Quick-Pass. Verify you have unlimited task space.
6. **Test the Downgrade**:
   - Go back to Billing, click **Downgrade to Free**. Confirm that your workspace re-locks if you have 10 or more tasks.
