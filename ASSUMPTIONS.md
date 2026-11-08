# Assumptions

## Phase 1

- Template cleanup script behavior: used `bun run cleanup` to strip Clerk and demo features (clerk, kanban, chat, ai-chat, examples). Removed associated routes, features, and dependencies automatically via the script.
- Favicon: using a simple gear emoji favicon as placeholder until a proper icon is designed.
- Navigation: sidebar items added as placeholders for all 7 sections (Dashboard, Equipment, Members, Loans, Overdue, Reports, Users); actual pages built in Phase 4.
- The template's existing data-table, form, and card components are reused as-is.
- The "notifications" feature was kept since it is a useful system-level component; it was cleaned by the script of dead links.
- The template's `product` and `users` demo features were removed entirely (routes, features, API routes) and replaced with placeholder pages for the real features.
- The `(auth)` and `(dashboard)` route groups under `src/app/` are created as directories for Phase 4; the actual auth pages and the real dashboard pages will be built there. Currently the app uses `src/app/dashboard/` (the template's layout) directly.
- Auth.js (next-auth) will be installed in Phase 2/3; the NEXTAUTH_SECRET in `.env.local` is a placeholder string for development.

## Phase 5
- Auth strategy: Auth.js v5 (next-auth beta) with the **JWT session strategy**. No extra Prisma session/account tables were added — Auth.js is wired directly to the existing `User` table (id, name, email, password_hash, role, is_active). The credentials provider reads the user by email, checks `is_active`, and verifies the password with `bcryptjs` (the same library the seed script uses to hash passwords).
- Env vars: Auth.js v5 reads `AUTH_SECRET` and `AUTH_URL` (the v5 convention), **not** the v4 `NEXTAUTH_*` names. `auth.ts` sets `secret: process.env.AUTH_SECRET` explicitly and `trustHost: true` so the app works behind Docker/proxies. `.env.local` (gitignored) holds the real dev secret; `env.example.txt` (tracked) holds placeholders only.
- Login page lives at `/login` (outside `/dashboard` so the middleware does not loop). There is no public sign-up page.
- `src/middleware.ts` protects every non-login route: unauthenticated users are redirected to `/login`; logged-in users hitting `/login` are redirected to `/dashboard/overview`; `/dashboard/users` additionally requires the ADMIN role (non-ADMIN redirected to overview). The API auth route and static assets are excluded from the matcher.
- Role matrix is enforced **server-side in every server action** (loan, equipment, member, user, settings): ADMIN = all incl. Users; LAB_ASSISTANT = create/return/extend/mark-lost + add/edit equipment & members + view/export reports; EXECUTIVE = blocked from all write actions (read-only), can view everything except Users and export reports. Each action calls `auth()` and returns a clear permission error before doing any work.
- Read-only UX: the equipment, members, and loans pages pass `isReadOnly` (true for EXECUTIVE) to their table/header components, which hide the create/edit affordances. This is UX only — the server actions are the real enforcement.
- "Change my password" page at `/dashboard/settings` is open to all logged-in roles; it verifies the current password, enforces min length 8, and is Zod-validated on both client and server.
- Shared Zod schemas live in `src/lib/schemas/auth.ts` (`loginSchema`, `changePasswordSchema`) and are imported by both the client forms and the server action/credentials provider so validation is identical on both sides.
- Logout uses `signOut({ callbackUrl: '/login' })` from the sidebar footer dropdown (SessionProvider wraps the app in `providers.tsx`).

