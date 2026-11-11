# Robotics Club Equipment Tracker — Full Architecture

---

## How the app is structured (top to bottom)

```
Browser request
      ↓
src/proxy.ts                      ← checks if you're logged in (runs first on every request)
      ↓
src/app/layout.tsx                ← root HTML shell, theme, dark/light mode, toast notifications
      ↓
src/app/dashboard/layout.tsx      ← sidebar + header wrapper (all dashboard pages share this)
      ↓
src/app/dashboard/*/page.tsx      ← the actual page (fetches data, renders components)
      ↓
src/components/*                  ← UI components (tables, forms, dialogs)
      ↓
src/app/actions/*.actions.ts      ← server functions called when buttons are clicked
      ↓
src/server/services/*.service.ts  ← database queries (Prisma)
      ↓
prisma/schema.prisma              ← the database (SQLite)
```

---

## The core loop (how everything works)

```
Filters / search / pagination:
  User changes a filter → URL updates → page.tsx re-runs on server → fresh data → table re-renders

Buttons / forms:
  User clicks → server action runs → validates → calls service → writes to DB → router.refresh() → page re-runs
```

---

## Auth & security

```
Every page load — proxy.ts (middleware) checks:
  ├── not logged in         → redirect to /login
  ├── logged in + on /login → redirect to /dashboard/overview
  └── non-ADMIN on /users   → redirect to /dashboard/overview

Every button click — server action checks:
  1. auth()       → is there a valid session?
  2. role check   → EXECUTIVE is blocked from all writes
  3. Zod schema   → is the submitted data valid?
  4. service call → write to database
```

---

## Database models (prisma/schema.prisma)

```
users       — staff who log in: id, name, email, passwordHash, role, isActive
members     — club students who borrow: id, studentId, fullName, email, phone, department, status
categories  — equipment groups: id, name, description
equipment   — physical items: id, assetTag, name, categoryId, condition, status, storageLocation
loans       — borrow/return events: id, equipmentId, memberId, borrowedAt, dueDate, returnedAt, ...
```

Relationships:
```
categories ──< equipment ──< loans >── members
                                  >── users (issuedBy)
                                  >── users (returnedTo)
```

---

## Roles

| Role | Can do |
|---|---|
| ADMIN | Everything — manage users, all CRUD |
| LAB_ASSISTANT | Issue/return loans, add equipment and members |
| EXECUTIVE | Read only — view everything, change nothing |

---

## Every page — full connection map

---

### `/login`
```
src/app/(auth)/login/page.tsx
  └── form submit → signIn('credentials') from next-auth
        └── src/server/auth.ts → finds user in DB → bcrypt compare password
              └── success → redirect to /dashboard/overview
              └── fail    → show error inline
```

---

### `/dashboard/overview`
```
src/app/dashboard/overview/page.tsx (server component)
  ├── getDashboardStats()   → src/server/services/dashboard.service.ts → DB
  ├── getDueSoon(3)         → loans due within 3 days
  └── getMostOverdue(5)     → top 5 most overdue loans
        ↓
  renders inline (no child components):
    - 4 stat cards: Total Items / Borrowed / Overdue / Available
    - "Due Today / Next 3 Days" table
    - "Most Overdue" table
    - Overdue card pulses red when count > 0
```

---

### `/dashboard/equipment`
```
src/app/dashboard/equipment/page.tsx (server component)
  ├── reads URL: ?page ?search ?categoryId ?status ?condition
  ├── getEquipmentList()  → src/server/services/equipment.service.ts → DB
  ├── listCategories()    → src/server/services/category.service.ts → DB
  └── renders <EquipmentTable> (src/components/equipment/equipment-table.tsx)

EquipmentTable (client component):
  ├── Search box          → updateParam('search', ...) → URL change → page re-runs
  ├── Category dropdown   → updateParam('categoryId', ...) → URL change → page re-runs
  ├── Status dropdown     → updateParam('status', ...) → URL change → page re-runs
  ├── Condition dropdown  → updateParam('condition', ...) → URL change → page re-runs
  ├── Pagination buttons  → updateParam('page', ...) → URL change → page re-runs
  ├── Row click           → router.push('/dashboard/equipment/[id]')
  │
  ├── [Add Equipment] button
  │     └── opens Dialog → <EquipmentForm> (src/components/equipment/equipment-form.tsx)
  │           └── submit → createEquipmentAction() → createEquipment() → DB
  │                 └── auto-generates RC-0001, RC-0002... asset tags
  │
  ├── [Bulk Add] button
  │     └── opens Dialog → <BulkAddForm> (src/components/equipment/bulk-add-form.tsx)
  │           └── submit → bulkCreateEquipmentAction() → bulkCreateEquipment() → DB
  │                 └── creates N items sequentially in one transaction
  │
  └── [Edit] button (pencil icon per row)
        └── opens Sheet → <EquipmentForm> pre-filled
              └── submit → updateEquipmentAction() → updateEquipment() → DB
```

---

### `/dashboard/equipment/[id]`
```
src/app/dashboard/equipment/[id]/page.tsx (server component)
  └── getEquipmentById(id) → equipment + active loan + full loan history
        ↓
  renders:
    - Equipment detail card (name, category, condition, status, location, serial, purchase date)
    - Active loan card (shown if status=BORROWED — member name, due date, issued by)
    - Loan history timeline (colored dots: green=good return, amber=fair, orange=damaged,
                             red=overdue active, blue=active on-time)
    - [Back to Equipment] button → /dashboard/equipment
```

---

### `/dashboard/members`
```
src/app/dashboard/members/page.tsx (server component)
  ├── reads URL: ?page ?search ?status
  ├── getMemberList() → src/server/services/member.service.ts → DB
  │     └── includes openLoansCount + overdueCount per member
  └── renders <MemberTable> (src/components/members/member-table.tsx)

MemberTable (client component):
  ├── Search box        → URL change → page re-runs
  ├── Status dropdown   → URL change → page re-runs
  ├── Pagination        → URL change → page re-runs
  ├── Row click         → router.push('/dashboard/members/[id]')
  │
  ├── [Add Member] button
  │     └── opens Dialog → <MemberForm> (src/components/members/member-form.tsx)
  │           └── submit → createMemberAction() → createMember() → DB
  │
  └── [Edit] button (per row)
        └── opens Sheet → <MemberForm> pre-filled
              └── submit → updateMemberAction() → updateMember() → DB
                    └── blocks deactivation if member has open loans
```

---

### `/dashboard/members/[id]`
```
src/app/dashboard/members/[id]/page.tsx (server component)
  └── getMemberById(id) → member + open loans + full loan history
        ↓
  renders:
    - Overdue warning alert (red banner listing overdue items if any)
    - Member info card (name, student ID, email, phone, department, notes)
    - "Currently Holding" table (items member currently has)
    - Loan history table (all past borrows with return condition)
    - [Back to Members] button → /dashboard/members
```

---

### `/dashboard/loans`
```
src/app/dashboard/loans/page.tsx (server component)
  ├── reads URL: ?tab ?page
  ├── getLoanList({ tab })          → loans filtered by tab
  ├── getMemberList({ pageSize: 1000 })       → for member picker in New Loan
  ├── getEquipmentList({ status: AVAILABLE }) → for equipment picker in New Loan
  └── renders <LoansHeader> + <LoanTable>

LoansHeader (src/components/loans/loans-header.tsx — client component):
  ├── Tab buttons: Active / Overdue / Returned / All → updates ?tab= in URL
  └── [New Loan] button (hidden for EXECUTIVE)
        └── opens <NewLoanDialog> (src/components/loans/new-loan-dialog.tsx)

NewLoanDialog:
  ├── Asset tag quick-fill field
  │     └── [Fill] button → lookupEquipmentByTagAction() → checks DB → shows availability
  ├── Member search box   → filters passed members list (max 10 shown)
  ├── Equipment search    → filters available equipment list (max 10 shown)
  │     └── auto-selects if exact asset tag match typed
  ├── Due date presets    → [3 days] [1 week] [2 weeks] or custom date input
  ├── Purpose field       → required
  └── [Submit] → createLoanAction() → createLoan() → DB
        └── shows amber warning banners if:
              - member has 5+ open loans
              - member already has overdue items

LoanTable (src/components/loans/loan-table.tsx — client component):
  ├── Overdue rows get red background tint
  ├── [Return] button → opens <ReturnDialog>
  │     └── condition select (Good/Fair/Damaged/Lost) + notes
  │           └── submit → returnLoanAction() → returnLoan() → DB
  │                 └── updates equipment status:
  │                       Good/Fair → AVAILABLE
  │                       Damaged   → DAMAGED
  │                       Lost      → LOST
  ├── [Extend] button → opens <ExtendDialog>
  │     └── new due date + reason
  │           └── submit → extendLoanAction() → extendLoan() → DB
  │                 └── appends extension note to loan notes
  └── [Mark Lost] button → opens <AlertModal> confirm
        └── confirmed → markLostAction() → markLost() → DB
              └── closes loan + sets equipment status to LOST
```

---

### `/dashboard/overdue`
```
src/app/dashboard/overdue/page.tsx (server component)
  └── getOverdueReport() → all overdue loans sorted by days late (most overdue first)
        ↓
  renders <OverdueTable> (src/components/overdue/overdue-table.tsx)

OverdueTable (client component):
  ├── [Copy Reminder] button (per row)
  │     └── copies message to clipboard:
  │           "Hi [name], the [item] ([tag]) borrowed on [date] was due on [date].
  │            Please return it as soon as possible."
  └── [Copy All Reminders] button
        └── copies all reminders at once
```

---

### `/dashboard/reports`
```
src/app/dashboard/reports/page.tsx (server component)
  ├── reads URL: ?tab ?from ?to
  ├── calls all 6 report functions in parallel:
  │     getCurrentlyBorrowed()         → src/server/services/report.service.ts
  │     getOverdueReport()
  │     getLostOrDamagedEquipment()
  │     getMostBorrowedItems({ from, to })
  │     getLoansByMember({ from, to })
  │     getNeverBorrowedItems()
  └── renders <ReportsTabs> (src/components/reports/reports-tabs.tsx)

ReportsTabs (client component):
  ├── 6 tab buttons → updates ?tab= in URL
  │     - Currently Borrowed
  │     - Overdue
  │     - Lost / Damaged
  │     - Most Borrowed
  │     - Loans by Member
  │     - Never Borrowed
  ├── Date range picker (shown on Most Borrowed + Loans by Member tabs)
  │     └── updates ?from= ?to= in URL → page re-runs with filtered data
  └── [Export CSV] button (each tab)
        └── builds CSV string from current tab data → downloads as .csv file
```

---

### `/dashboard/users`  *(Admin only — others are redirected by proxy.ts)*
```
src/app/dashboard/users/page.tsx (server component)
  └── listUsers() → src/server/services/user.service.ts → DB
        ↓
  renders <UsersTable> (src/components/users/users-table.tsx)

UsersTable (client component):
  ├── [Add User] button
  │     └── opens Dialog → name, email, password, role fields
  │           └── submit → createUserAction() → createUser() → DB
  │                 └── hashes password with bcrypt before storing
  ├── [Role] button (per row)
  │     └── opens Dialog → role select
  │           └── submit → changeRoleAction() → changeRole() → DB
  ├── [Reset PW] button (per row)
  │     └── opens Dialog → auto-generates password (editable)
  │           └── submit → resetPasswordAction() → resetPassword() → DB
  │                 └── shows new password once after reset
  └── [Activate] / [Deactivate] button (per row)
        └── activateUserAction() / deactivateUserAction() → DB
```

---

### `/dashboard/settings`
```
src/app/dashboard/settings/page.tsx (server component, no data fetching)
  └── renders <ChangePasswordForm> (src/components/settings/change-password-form.tsx)

ChangePasswordForm (client component):
  ├── client-side Zod validation (passwords match, min 8 chars)
  └── submit → changePasswordAction() → changePassword() → DB
        └── verifies current password before updating
```

---

## The sidebar

```
src/components/layout/app-sidebar.tsx (client component)

  Logo area
    └── links to /dashboard/overview

  Navigation (from src/config/nav-config.ts)
    ├── Dashboard  → /dashboard/overview
    ├── Equipment  → /dashboard/equipment
    ├── Members    → /dashboard/members
    ├── Loans      → /dashboard/loans
    ├── Overdue    → /dashboard/overdue  [red badge = overdue count]
    ├── Reports    → /dashboard/reports
    └── Users      → /dashboard/users   [hidden for non-ADMIN]

  Overdue badge:
    └── useQuery polls /api/stats/overdue-count every 60 seconds
          └── src/app/api/stats/overdue-count/route.ts → DB count → returns { count }

  User menu (bottom of sidebar)
    ├── Shows logged-in user name + role
    ├── Settings → /dashboard/settings
    └── Sign out → signOut() → redirect to /login
```

---

## The header

```
src/components/layout/header.tsx

  ├── Sidebar toggle button (collapse/expand sidebar)
  ├── Breadcrumbs (src/components/breadcrumbs.tsx)
  │     └── uses src/hooks/use-breadcrumbs.tsx → reads current URL path
  │           e.g. /dashboard/equipment → Dashboard > Equipment
  └── Search input (src/components/search-input.tsx)
        └── opens kbar (Cmd+K) command palette
```

---

## Cmd+K command palette (kbar)

```
src/components/kbar/index.tsx

  Opens with Cmd+K or Ctrl+K
  Shows all nav items as searchable actions
  Selecting an item → router.push(url)
  RBAC-aware: hides /users for non-ADMIN (same as sidebar)
```

---

## File map

```
e:\tracker\
├── prisma/
│   ├── schema.prisma          ← database schema (source of truth)
│   ├── seed.ts                ← sample data for development
│   └── migrations/            ← migration history (auto-generated)
│
├── src/
│   ├── app/
│   │   ├── (auth)/login/      ← login page
│   │   ├── actions/           ← ALL writes go here
│   │   │   ├── equipment.actions.ts
│   │   │   ├── loan.actions.ts
│   │   │   ├── member.actions.ts
│   │   │   ├── settings.actions.ts
│   │   │   └── user.actions.ts
│   │   ├── api/
│   │   │   ├── auth/          ← NextAuth route handler
│   │   │   └── stats/overdue-count/ ← sidebar badge endpoint
│   │   ├── dashboard/
│   │   │   ├── overview/
│   │   │   ├── equipment/
│   │   │   │   └── [id]/
│   │   │   ├── members/
│   │   │   │   └── [id]/
│   │   │   ├── loans/
│   │   │   ├── overdue/
│   │   │   ├── reports/
│   │   │   ├── users/
│   │   │   └── settings/
│   │   ├── layout.tsx         ← root layout (theme, fonts, providers)
│   │   ├── page.tsx           ← redirects to /dashboard/overview
│   │   └── global-error.tsx   ← catches crashes, reports to Sentry
│   │
│   ├── components/
│   │   ├── ui/                ← shadcn design components (don't modify)
│   │   ├── layout/
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── page-container.tsx
│   │   │   └── providers.tsx
│   │   ├── equipment/
│   │   │   ├── equipment-table.tsx
│   │   │   ├── equipment-form.tsx
│   │   │   └── bulk-add-form.tsx
│   │   ├── members/
│   │   │   ├── member-table.tsx
│   │   │   └── member-form.tsx
│   │   ├── loans/
│   │   │   ├── loan-table.tsx
│   │   │   ├── loans-header.tsx
│   │   │   ├── new-loan-dialog.tsx
│   │   │   ├── return-dialog.tsx
│   │   │   └── extend-dialog.tsx
│   │   ├── overdue/
│   │   │   └── overdue-table.tsx
│   │   ├── reports/
│   │   │   └── reports-tabs.tsx
│   │   ├── settings/
│   │   │   └── change-password-form.tsx
│   │   ├── users/
│   │   │   └── users-table.tsx
│   │   ├── modal/
│   │   │   └── alert-modal.tsx
│   │   ├── kbar/
│   │   │   ├── index.tsx
│   │   │   ├── render-result.tsx
│   │   │   └── result-item.tsx
│   │   ├── themes/
│   │   │   ├── active-theme.tsx
│   │   │   ├── theme-mode-toggle.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   ├── theme-selector.tsx
│   │   │   ├── theme.config.ts
│   │   │   └── font.config.ts
│   │   ├── breadcrumbs.tsx
│   │   ├── search-input.tsx
│   │   ├── form-card-skeleton.tsx
│   │   └── icons.tsx          ← every icon used in the app lives here
│   │
│   ├── server/
│   │   ├── auth.ts            ← NextAuth config (login logic, JWT, roles)
│   │   ├── db.ts              ← Prisma client singleton
│   │   ├── timezone.ts        ← overdue date logic (APP_TIMEZONE)
│   │   └── services/
│   │       ├── index.ts       ← re-exports all services
│   │       ├── dashboard.service.ts
│   │       ├── equipment.service.ts
│   │       ├── loan.service.ts
│   │       ├── member.service.ts
│   │       ├── report.service.ts
│   │       ├── user.service.ts
│   │       └── category.service.ts
│   │
│   ├── config/
│   │   └── nav-config.ts      ← sidebar links (title, url, icon, shortcut)
│   │
│   ├── hooks/
│   │   ├── use-breadcrumbs.tsx
│   │   ├── use-nav.ts         ← filters Users link for non-ADMIN
│   │   ├── use-mobile.ts      ← detects mobile screen
│   │   └── use-debounced-callback.ts
│   │
│   ├── lib/
│   │   ├── utils.ts           ← cn() for Tailwind class merging
│   │   └── query-client.ts    ← TanStack Query setup (sidebar badge only)
│   │
│   ├── types/
│   │   └── index.ts           ← NavItem, NavGroup types
│   │
│   ├── styles/
│   │   ├── globals.css        ← Tailwind imports
│   │   ├── theme.css          ← mono theme import
│   │   └── themes/mono.css    ← the actual colour tokens
│   │
│   ├── proxy.ts               ← auth middleware
│   └── instrumentation.ts     ← Sentry error tracking (optional)
│
├── .env.local                 ← your secrets (never commit this)
├── .env                       ← DATABASE_URL only
├── package.json
├── prisma.schema.prisma
├── next.config.ts
└── tsconfig.json
```

---

## Environment variables

```env
# .env
DATABASE_URL="file:./prisma/dev.db"

# .env.local
AUTH_SECRET="..."              ← signs JWT tokens (required)
AUTH_URL="http://localhost:3000"
APP_TIMEZONE="Asia/Dhaka"      ← affects overdue date calculations
LOAN_DEFAULT_DAYS=7            ← default loan duration
MEMBER_LOAN_WARN_LIMIT=5       ← warn when member has this many open loans
```

---

## Development commands

```bash
npm run dev          # start dev server at localhost:3000
npm run typecheck    # check for TypeScript errors
npm run format       # format all files with Prettier
npm test             # run Vitest tests

# Database
npx prisma migrate deploy        # apply migrations
npx tsx prisma/seed.ts           # seed with sample data
npx prisma studio                # open visual DB browser
npx prisma migrate dev --name x  # create a new migration
```
