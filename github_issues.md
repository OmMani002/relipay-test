# ReliPay SDK - GitHub Issue Reports

Here are three templates you can use to report the issues and developer experience improvements on the ReliPay SDK repository.

---

## Issue 1: Peer Dependency Mismatch with Next.js 16.x (Bug/Improvement)

* **Repository**: `@relipay/nextjs`
* **Title**: `[nextjs] ERESOLVE peer dependency conflict when installing in Next.js 16.x`

### Description
When attempting to install `@relipay/nextjs` in a Next.js 16 project, `npm install` fails with a peer dependency error:
```
npm error code ERESOLVE
npm error ERESOLVE unable to resolve dependency tree
npm error While resolving: relipay-test@0.1.0
npm error Found: next@16.2.9
...
npm error Could not resolve dependency:
npm error peer next@"^14.0.0 || ^15.0.0" from @relipay/nextjs@0.1.0-beta.0
```

To resolve this, developers must install using `--legacy-peer-deps`. The middleware, hooks, and server actions run without issues under Next.js 16 once bypassed.

### Steps to Reproduce
1. Create a new Next.js 16.x application (`next: "16.x"`).
2. Run `npm install @relipay/nextjs`.

### Suggested Fix
Update the `peerDependencies` in `@relipay/nextjs/package.json` to allow Next.js 16:
```json
"peerDependencies": {
  "next": "^14.0.0 || ^15.0.0 || ^16.0.0",
  "react": "^18.0.0 || ^19.0.0"
}
```

---

## Issue 2: Unfriendly "fetch failed" Error on Unreachable Server (UX/DX Improvement)

* **Repository**: `@relipay/node` / `@relipay/nextjs`
* **Title**: `[node] Unfriendly generic "TypeError: fetch failed" when RELIPAY_URL is unreachable (ECONNREFUSED)`

### Description
If the self-hosted ReliPay server is offline or not running (e.g. Docker container is down), calling the SDK's auth endpoints (like `signUp` or `signIn`) throws a generic Node.js `TypeError: fetch failed` error with `ECONNREFUSED` deep inside the stack trace. 

While the stack trace does show the cause, it would be much friendlier if the SDK caught network errors and surfaced a cleaner custom error telling the developer to check if the ReliPay server is running or if the `RELIPAY_URL` in `.env.local` is correct.

### Steps to Reproduce
1. Set `RELIPAY_URL=http://localhost:3030` but do not run the backend docker stack.
2. Trigger `signUp({ email, password })`.
3. Catch the raw `fetch failed` error.

### Suggested Fix
In `@relipay/node` internal HTTP client, wrap `fetch` calls in a try/catch block:
```typescript
try {
  return await fetch(url, options);
} catch (err: any) {
  if (err.code === 'ECONNREFUSED') {
    throw new RelipayError({
      code: 'SERVER_UNREACHABLE',
      message: `Could not connect to the ReliPay server at ${this.apiUrl}.`,
      fix: `Ensure your local docker container is running (docker compose up) or that the RELIPAY_URL env variable is correct.`
    });
  }
  throw err;
}
```

---

## Issue 3: Auto-refresh Sync on Client-Side Provider (Feature Request)

* **Repository**: `@relipay/react`
* **Title**: `[react] Auto-refresh session token on mount if SSR initialUser is null`

### Description
Next.js Server Components are unable to write/mutate cookies. When `auth()` is executed inside a layout server component and finds an expired access token, it cannot write the rotated cookie token headers. 

As a result, `initialUser` sent to `<RelipayProvider>` is `null`. Currently, client-side code has to manually trigger `useRelipay().refresh()` in order to force cookie-based rotation on the client. It would be a significant DX boost if the client-side `<RelipayProvider>` automatically attempted a token rotation check on mount if it detects a missing `initialUser` but has active cookies in the browser.

### Suggested Fix
Add a simple `useEffect` hook inside the `<RelipayProvider>` context that runs on mount:
```typescript
useEffect(() => {
  if (!initialUser && hasCookiesActive()) {
    // Attempt client-side rotation/refresh call
    refresh();
  }
}, []);
```
