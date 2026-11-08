# Auth.js v5 auth, Next.js 16 proxy, and role-based permissions

Phase 5 wires Auth.js v5 to the existing Prisma `User` table using the JWT strategy with bcryptjs password verification (the same library and cost factor the seed uses), adds a `/login` page, a Next.js 16 `proxy.ts` that gates every non-login route, server-side role checks in all five server-action files, a `/dashboard/settings` change-password page, logout from the sidebar, and EXECUTIVE read-only UI on the equipment, members, and loans pages. The scaffolding commit's build breakers are fixed in `8e6915a`: `LoadingButton` replaces the non-existent `Button.isLoading`, `isReadOnly` is threaded through the table/header components, the v5 `AUTH_*` env vars replace `NEXTAUTH_*`, and `src/middleware.ts` is deleted in favor of `src/proxy.ts` (Next.js 16's rename). `bun run typecheck` and `bun run build` pass per the recorded results, with runtime smoke tests confirming login, logout, and the EXECUTIVE/ADMIN route split.

**Watch for:** an open redirect through the unvalidated login `callbackUrl`, and the fact that JWT sessions stay stale after a role change or deactivation — a demoted or deactivated user keeps their old privileges until the token expires or they re-login. Both are worth fixing before this faces real users, though neither breaks the explicit Phase 5 acceptance bar.

**Verdict**: APPROVED

## High-level view

Auth.js v5 reads the user by email in the credentials provider, checks `isActive`, and compares the submitted password against `passwordHash` with bcryptjs at cost 12 — identical to the seed's `bcrypt.hash(pw, 12)`. The JWT and session callbacks stamp `id` and `role` onto the token and session, backed by a `next-auth.d.ts` module augmentation. The role is available in the proxy (`req.auth.user.role`), confirmed by the runtime smoke test where EXECUTIVE is bounced from `/dashboard/users` and ADMIN is not.

Route protection moved entirely into `src/proxy.ts`. Unauthenticated users hitting any non-login path redirect to `/login`; logged-in users hitting `/login` redirect to the dashboard; `/dashboard/users` additionally requires ADMIN. The matcher excludes `api`, static assets, and favicon, so the only API route (the NextAuth handler) stays reachable. There is no public sign-up page, and the root `/` is just a redirect to `/dashboard/overview`, so nothing is unintentionally public.

Every server action calls `auth()` and rejects disallowed roles with a clear error before doing any work: loan, equipment, and member writes block EXECUTIVE; user management requires ADMIN; change-password accepts any authenticated user. EXECUTIVE read-only is reinforced in the UI by an `isReadOnly` flag threaded through the equipment, member, and loan tables and headers. The detail pages for equipment and members are display-only, so nothing needs hiding there.

Login and change-password share Zod schemas from `src/lib/schemas/auth.ts` between the client forms and the server, so validation is identical on both sides. The one gap is that the equipment/member/loan create dialogs validate client-side with native `required` plus manual checks and lean on the server actions' Zod — consistent client Zod is only on the two auth forms.

Two security caveats survive the implementation. The login `callbackUrl` is read from the URL and passed to `router.push` without a same-origin check, which is an open redirect on a crafted link. And because the JWT strategy bakes `role` and never re-reads `isActive` from the DB, a user who is demoted or deactivated keeps their old permissions until re-login — the server actions enforce against the token, not the current DB row.

## Issues (5)

<details>
<summary>Issues (5)</summary>

1. **Open redirect via login `callbackUrl`** — `/login` reads `callbackUrl` from the query string and calls `router.push(callbackUrl)` after a successful sign-in with no same-origin check. A crafted `/login?callbackUrl=https://evil.com` (or `//evil.com`) can bounce a legitimately authenticated user off-site. Validate that `callbackUrl` starts with a single `/` and not `//` before using it, or drop the parameter.
2. **Stale JWT after role change or deactivation** — the JWT strategy stamps `role` at sign-in and never re-reads `isActive`/`role` from the DB, so the proxy and server actions enforce against the token. A user demoted from ADMIN to EXECUTIVE, or deactivated, keeps their old access until the token expires or they re-login. Re-check `isActive`/`role` against the DB in the server actions (cheap), shorten the JWT `maxAge`, or move to database sessions.
3. **Client-side Zod only on auth forms** — the brief says all inputs are Zod-validated on client and server. Login and change-password run Zod client-side; the equipment/member/loan create dialogs use native `required` plus manual checks and rely on the server actions' Zod. Server enforcement is complete (no security hole), but client Zod is inconsistent with the brief's wording. Extend client Zod to the CRUD dialogs, or record the scoping decision in `ASSUMPTIONS.md`.
4. **`activateUserAction` bypasses the service layer** — it calls `prisma.user.update` directly while its siblings (`deactivate`, `resetPassword`, `changeRole`) go through `user.service.ts`, which the AGENTS.md service-layer convention asks for. Move the activate logic into the service.
5. **Auth type casts and beta dependency** — `auth.ts` casts `(user as { role: string })` and `(session.user as { role: string })` despite the `next-auth.d.ts` augmentation, and `next-auth` is pinned to a `^5.0.0-beta.32` caret range. The casts are harmless but redundant; consider pinning `next-auth`/`bcryptjs` to exact versions per the AGENTS.md dependency guidance.

</details>

<details>
<summary>Details</summary>

### Auth.js wired to the existing User table

The credentials provider's `authorize` parses input with the shared `loginSchema`, looks the user up by email, returns `null` if the user is missing or `isActive` is false, and verifies the password with `bcrypt.compare` against `passwordHash`. Returning `null` for both "no user" and "wrong password" avoids user enumeration, and the `isActive` gate means deactivated accounts cannot log in. The returned object carries `id`, `name`, `email`, and `role`.

The `jwt` callback copies `id` and `role` onto the token only when `user` is present (i.e. at sign-in); the `session` callback copies them from the token onto `session.user`. A `next-auth.d.ts` augmentation declares `Session.user.id`/`role` and `JWT.id`/`role` so the rest of the app is typed. `secret: process.env.AUTH_SECRET` is set explicitly and `trustHost: true` is on so the app works behind Docker/proxies, matching the v5 `AUTH_*` convention recorded in `ASSUMPTIONS.md`. The `(user as { role: string })` and `(session.user as { role: string })` casts are redundant given the augmentation — `session.user.role` is already `string`.

### Route protection in the Next.js 16 proxy

`src/proxy.ts` exports `default auth((req) => …)` and a matcher of `/((?!api|_next/static|_next/image|favicon.ico).*)`. The three branches are: not logged in and not on `/login` → redirect to `/login`; logged in and on `/login` → redirect to `/dashboard/overview`; `/dashboard/users` with a non-ADMIN role → redirect to overview. The old `src/middleware.ts` is deleted, which is the right call for Next.js 16 — leaving both would conflict. Because the matcher excludes `api`, API routes bypass the proxy; the only API route is the NextAuth handler, which is correct. The root `/` page is a bare `redirect('/dashboard/overview')`, so there is no public surface to accidentally leave open, and "public routes stay public" is satisfied vacuously. `/dashboard/users` relies on the proxy for the non-ADMIN block; there is no in-page `auth()` check, though the user actions are independently ADMIN-gated.

### Server-action authorization and the stale-token gap

All five action files call `auth()` first and reject before any work. Loan actions (`createLoan`, `returnLoan`, `extendLoan`, `markLost`) and equipment/member actions (`createEquipment`, `updateEquipment`, `bulkCreateEquipment`, `createMember`, `updateMember`) block `EXECUTIVE`. User actions (`createUser`, `deactivate`, `activate`, `resetPassword`, `changeRole`) require `ADMIN`. `changePasswordAction` accepts any authenticated session. The permission errors are returned before the Zod parse and before the service call, so no work runs for a disallowed role.

The enforcement reads `session.user.role` from the JWT. Because the `jwt` callback only writes `role` at sign-in, the token's role never updates after that, and no action re-fetches the user to confirm the role or `isActive` is still current. So an ADMIN who is demoted to EXECUTIVE, or any user who is deactivated, continues to pass the role check until their JWT expires or they sign in again. This is the standard JWT tradeoff, not a coding bug, but it does mean "disallowed actions blocked server-side" is only true for the session as it was at login. A cheap mitigation is to re-read `isActive`/`role` from the DB inside each action (or in a shared guard) and reject if the stored row no longer matches the token.

### Change password

`/dashboard/settings` renders `ChangePasswordForm` for any logged-in user; the brief wants change-password open to all roles, so there is no role gate. The form validates client-side with the shared `changePasswordSchema` (current required, new min 8, confirm matches), then posts `FormData` to `changePasswordAction`, which re-runs the same schema server-side and calls `user.service.changePassword`. The service verifies the current password with `bcrypt.compare` before hashing the new one at cost 12, matching the seed and the create/reset paths.

### Login page and the open redirect

`/login` is a client component styled with the template's `Card`, labeled inputs, and a `LoadingButton`. It runs `loginSchema.safeParse` client-side, then `signIn('credentials', { redirect: false })`; on success it calls `router.push(callbackUrl)` where `callbackUrl` defaults to `/dashboard/overview`. The credentials provider re-validates with `loginSchema` on the server, so input is checked on both sides for the auth flow. The open-redirect issue is that `callbackUrl` comes straight from `useSearchParams` with no validation. The proxy never sets `callbackUrl` when it redirects to `/login`, so in the normal flow the default is used — the risk only materializes on a crafted link. Still, an auth flow that bounces users to an attacker-controlled host after a legitimate login is the textbook open redirect, and the fix is a one-line same-origin check.

### Read-only UI for EXECUTIVE

The equipment, members, and loans pages compute `isReadOnly = session?.user?.role === 'EXECUTIVE'` server-side and pass it to their tables/headers. `EquipmentTable`/`MemberTable` hide the Add buttons, the Actions/Edit column, and adjust the empty-state `colSpan` accordingly; `LoanTable` hides the Actions column and the return/extend/mark-lost dropdown; `LoansHeader` hides the New Loan button. The equipment and member detail pages are display-only (no edit affordances), so `isReadOnly` is not needed there. The server actions are the real enforcement — the UI hiding is the "not just by hiding buttons" layer on top, exactly as the brief asks.

### Logout and session provider

`providers.tsx` wraps the app in `next-auth/react`'s `SessionProvider`, so client components can read the session. The sidebar footer dropdown shows the user's name, role label, and a `Sign out` item that calls `signOut({ callbackUrl: '/login' })`. The runtime smoke test confirms logout clears the session and lands on `/login`.

### Verification and scope

The fix commit records `bun run typecheck: PASS`, `bun run build: PASS` (15 routes including `/login` and `/dashboard/settings`, proxy recognized), `bun run lint` with only pre-existing Phase 4 errors, and a dev-server smoke test covering login as ADMIN/EXECUTIVE, the logged-out redirect, the EXECUTIVE `/dashboard/users` block, ADMIN access to users, logout, and the logged-in `/login` redirect. `.env.local` is gitignored (confirmed) and holds the generated dev secret; `env.example.txt` carries only placeholders. `ASSUMPTIONS.md` records the Phase 5 strategy decisions. No public sign-up page exists. The work stays within Phase 5's scope; the user-management actions back the pre-existing Users page with role-gated server actions rather than introducing a new feature.

### Minor

`activateUserAction` calls `prisma.user.update` inline while every other user action goes through `user.service.ts`, which is an inconsistency against the service-layer convention. `next-auth` is on a `^5.0.0-beta.32` caret and `bcryptjs` on `^3.0.3`; the AGENTS.md prefers exact pins, though caret ranges match the rest of the project. The `user.service.ts` functions return `object`/`object[]` rather than concrete types, looser than the AGENTS.md type-safety guidance.

</details>

<details>
<summary>File map</summary>

Full diff: `git -C f:/equipment-tracker diff cfed7932cc102a0e0780dbef85fc29f95baa399f...HEAD` (the scaffolding commit `cfed7932` plus the fix `8e6915a` make up Phase 5).

- `src/server/auth.ts` — Auth.js v5 config: credentials provider (bcryptjs vs seed), JWT strategy, jwt/session callbacks carrying `id`+`role`, `AUTH_SECRET` + `trustHost`.
- `src/proxy.ts` — Next.js 16 proxy (renamed middleware): gates all non-login routes, `/dashboard/users` ADMIN-only.
- `src/middleware.ts` — deleted (conflicted with `proxy.ts` under Next.js 16).
- `src/app/api/auth/[...nextauth]/route.ts` — re-exports the Auth.js `GET`/`POST` handlers.
- `src/types/next-auth.d.ts` — augments `Session.user` and `JWT` with `id`/`role`.
- `src/lib/schemas/auth.ts` — shared `loginSchema` + `changePasswordSchema` (client and server).
- `src/app/(auth)/login/page.tsx` — `/login` client form: client Zod, `signIn` `redirect:false`, `callbackUrl`.
- `src/app/(auth)/layout.tsx` — centered auth layout.
- `src/app/dashboard/settings/page.tsx` — change-password page, open to all roles.
- `src/components/settings/change-password-form.tsx` — change-password form, client Zod + server action.
- `src/app/actions/loan.actions.ts` — loan CRUD actions, EXECUTIVE blocked, server Zod.
- `src/app/actions/equipment.actions.ts` — equipment CRUD actions, EXECUTIVE blocked, server Zod.
- `src/app/actions/member.actions.ts` — member CRUD actions, EXECUTIVE blocked, server Zod.
- `src/app/actions/user.actions.ts` — user admin actions, ADMIN-only, server Zod (`activateUserAction` bypasses the service layer).
- `src/app/actions/settings.actions.ts` — `changePasswordAction`, any-auth, shared schema.
- `src/server/services/user.service.ts` — user service: bcryptjs hash/compare, `changePassword` verifies current password.
- `src/components/layout/app-sidebar.tsx` — sidebar with session display + `signOut`.
- `src/components/layout/providers.tsx` — `SessionProvider` wrapping the app.
- `src/hooks/use-nav.ts` — hides `/dashboard/users` from non-ADMIN.
- `src/components/equipment/equipment-table.tsx` — `isReadOnly` hides add/edit and the actions column.
- `src/components/members/member-table.tsx` — `isReadOnly` hides add/edit.
- `src/components/loans/loan-table.tsx` — `isReadOnly` hides return/extend/mark-lost.
- `src/components/loans/loans-header.tsx` — `isReadOnly` hides New Loan.
- `src/app/dashboard/equipment/page.tsx`, `members/page.tsx`, `loans/page.tsx` — compute `isReadOnly` for EXECUTIVE and pass it down.
- `env.example.txt` — `AUTH_SECRET`/`AUTH_URL` + app-settings placeholders.
- `ASSUMPTIONS.md` — Phase 5 assumptions recorded.
- `package.json` / `bun.lock` — `next-auth`, `bcryptjs`, `@types/bcryptjs`.

</details>
