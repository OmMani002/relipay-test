# Walkthrough - User Registration Name Collection

We have successfully integrated a new **Full Name** field into the registration flow. The name is saved in the user's account metadata using the ReliPay SDK, and it is displayed across the navigation headers and dashboard workspace card.

## Changes Made

### 1. Registration UI & Server Action
- **[app/register/page.tsx](file:///d:/Relipay%20Test/relipay-test/app/register/page.tsx)**: Added a "Full Name" input field to the glassmorphic registration card. It is positioned above the email address field and styled consistently with the other fields.
- **[app/register/actions.ts](file:///d:/Relipay%20Test/relipay-test/app/register/actions.ts)**: Updated `registerAction` to extract the `name` field from the form data, validate its presence, and pass it under the `metadata: { name }` object when calling `signUp`.

### 2. Mock Session Updates (Development Mode)
- **[lib/auth.ts](file:///d:/Relipay%20Test/relipay-test/lib/auth.ts)**:
  - Updated the local `Session` interface to include the optional `metadata` field.
  - Configured the mock `signUp` function to accept and store the custom `metadata` parameter.
  - Set a dummy `metadata: { name: 'Guest User' }` for mock log-ins and sessions in local testing.

### 3. Dashboard UI Navigation Header
- **[app/dashboard/page.tsx](file:///d:/Relipay%20Test/relipay-test/app/dashboard/page.tsx)**: Updated the navigation header to look for a name in user metadata. If present, it displays `[Name] ([Email])` instead of just the email address. Added a type-safe cast `(user.metadata as any).name` to avoid strict TypeScript `unknown` warnings.
- **[app/dashboard/billing/page.tsx](file:///d:/Relipay%20Test/relipay-test/app/dashboard/billing/page.tsx)**: Replicated the name display enhancement and type safety check in the billing page navigation header.

### 4. Workspace Card Customization
- **[app/dashboard/todo-workspace.tsx](file:///d:/Relipay%20Test/relipay-test/app/dashboard/todo-workspace.tsx)**:
  - Updated the `user` property in `TodoWorkspaceProps` to include `metadata?: Record<string, any> | null`.
  - Adjusted the avatar circle to extract the first 2 letters of the user's name if a name is provided, falling back to the email.
  - Replaced the generic `"Personal Workspace"` text in the card header with the user's name, adding their email underneath as a subtitle.

---

## Verification Plan

### Build Check
To confirm everything compiles correctly with TypeScript and Next.js, run:
```powershell
npm run build
```

### Manual Acceptance Flow
1. Navigate to `/register` and fill out the new **Full Name** field along with your email and password.
2. Submit the form to register.
3. Verify that you are redirected to `/dashboard`.
4. In the top-right navigation header, verify you see your name alongside your email address: `John Doe (you@example.com)`.
5. On the left side of the dashboard, verify the user avatar circle displays your initials (e.g., `JO`) and the workspace card title displays your name (e.g., `John Doe`) with your email underneath.
6. Navigate to the **Billing & Plans** tab and verify the name is also displayed in the header there.
