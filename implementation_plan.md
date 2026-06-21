# Add Name Field to User Registration

This plan outlines the changes needed to collect a user's name during registration, save it via the ReliPay `signUp` API's metadata parameter, and display the name in the dashboard UI and workspace profile card.

## Proposed Changes

### Registration Flow

#### [MODIFY] [actions.ts](file:///d:/Relipay%20Test/relipay-test/app/register/actions.ts)
- Retrieve the `name` field from the registration `formData`.
- Validate that `name` is provided.
- Pass `metadata: { name }` in the call to `signUp({ email, password, metadata: { name } })`.

#### [MODIFY] [page.tsx](file:///d:/Relipay%20Test/relipay-test/app/register/page.tsx)
- Add a new input field for "Full Name" (under a `form-group` styled container) above the email input field.
- Set name to `name`, placeholder to `"John Doe"`, and make it `required`.

### Mock Authentication

#### [MODIFY] [auth.ts](file:///d:/Relipay%20Test/relipay-test/lib/auth.ts)
- Update the mock `signUp` function to support the optional `metadata` parameter.
- Update the mock session in `auth` to return a fallback `metadata: { name: 'Guest User' }` for development/mock testing.
- Update `Session` user interface type to include `metadata?: Record<string, any> | null`.

### Dashboard UI

#### [MODIFY] [page.tsx](file:///d:/Relipay%20Test/relipay-test/app/dashboard/page.tsx)
- Update the navigation header to display the user's name alongside their email if present:
  `{user.metadata?.name ? `${user.metadata.name} (${user.email})` : user.email}`

#### [MODIFY] [page.tsx](file:///d:/Relipay%20Test/relipay-test/app/dashboard/billing/page.tsx)
- Update the navigation header to display the user's name alongside their email if present.

#### [MODIFY] [todo-workspace.tsx](file:///d:/Relipay%20Test/relipay-test/app/dashboard/todo-workspace.tsx)
- Update `TodoWorkspaceProps`'s `user` type definition to include optional `metadata`.
- Modify the personal workspace card:
  - Display the first two letters of the name in the user avatar, falling back to the email.
  - Display the name in place of the `"Personal Workspace"` header if present, showing the email as a secondary sub-header.

---

## Verification Plan

### Automated Verification
- Validate TypeScript compilation by running:
  ```powershell
  npm run build
  ```

### Manual Verification
- Navigate to the registration page, register a new account with a name, email, and password.
- Verify redirect to the dashboard page works.
- Verify the header displays `[Name] ([Email])` correctly.
- Verify the personal workspace card displays the name and initials properly.
- Verify that logging out and logging back in still displays the name correctly.
