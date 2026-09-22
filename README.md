# SalesBound NoteSpace

A private notes workspace. Sign in, and you get a three-pane workspace for
writing notes, grouping them into collections, labelling them with tags, and
searching across all of it.

Everything is stored in Supabase and **isolated per account**: each signed-in
user sees only the notes, collections and tags they created. Isolation is
enforced by the database through row level security, not by application code,
so it cannot be lost by forgetting a filter in one query.

![NoteSpace workspace](docs/final%20final-ui-reference.png)

## Features

**Accounts**

- Email and password sign-in, through Supabase Auth
- Self-service account creation from the same form
- Google sign-in, through Supabase Auth's Google provider
- A profile menu in the top right showing the signed-in account's name, email
  and avatar, with sign-out
- Every page under `/workspace` is protected on the server; a request with no
  authenticated user is redirected to `/login` before the page renders

**Notes**

- Create, read, update and delete notes
- Collections — create them, assign a note to one, and browse notes by
  collection in the sidebar tree. A note may sit outside every collection.
- Tags — create them, add and remove them on a note, and filter the list by one
  or more tags (a note must carry all selected tags)
- Search across note titles, bodies and tag names, updating as you type and
  respecting any active tag filter
- Notes, collections and tags are private to the account that created them

## Tech stack

- **Next.js 16** (App Router) and **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Supabase** — Postgres for storage, and **Supabase Auth** for sign-in
- **`@supabase/supabase-js`** for queries, **`@supabase/ssr`** for the
  cookie-backed server session

## Local setup

```bash
git clone https://github.com/SPoursch/spr.2-p5-notes-app-collections-search.git
cd spr.2-p5-notes-app-collections-search
npm install
cp .env.local.example .env.local   # then fill in the two values below
npm run dev
```

Open <http://localhost:3000>. You will land on `/login`, since the workspace
requires an account.

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## Environment variables

Both are required, and both live in `.env.local`, which is git-ignored and must
never be committed. `.env.local.example` is the committed template.

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase dashboard → Project Settings → API → the **publishable** key |

Use the publishable key only. A secret or `service_role` key bypasses row level
security entirely and must never go in a `NEXT_PUBLIC_` variable, because
Next.js inlines those into browser JavaScript.

## Authentication setup

Email and password sign-in works through Supabase Auth with no extra
configuration beyond the two variables above. If your project has **Confirm
email** enabled, a newly created account must follow the emailed link before it
can sign in — the form says so when that happens.

Google sign-in needs the Google provider configured in the Supabase dashboard
(Authentication → Providers → Google) with a Google OAuth client ID and secret.
This project's local configuration uses:

- Site URL `http://localhost:3000`
- `http://localhost:3000/auth/callback` in the redirect allow-list — where
  Google sign-in returns to
- `http://localhost:3000/auth/confirm` in the redirect allow-list — where a
  password-reset link returns to (see below)

The application builds its callback URL from the request's own origin, so no
extra environment variable is needed. The provider redirects back to
`/auth/callback`, which exchanges the authorization code for a session
server-side and then sends the user to `/workspace`.

### Password reset

"Forgot your password?" on the login form leads to `/forgot-password`, which
asks Supabase Auth to send a recovery email. No custom SMTP is configured, so
the project uses Supabase's built-in email service and its stock "Reset
Password" template — which means the emailed link goes to Supabase's own verify
endpoint, and Supabase redirects the browser to `/auth/confirm` afterwards.
That URL must therefore be in the redirect allow-list, or the link will land on
the Site URL instead and the flow will silently fail.

`/auth/confirm` is a route handler: it turns what Supabase appends onto the URL
into a session, writes that session to cookies, and forwards to
`/reset-password`, which collects the new password. No token is ever exposed to
browser JavaScript.

Two consequences worth knowing before testing:

- `@supabase/ssr` uses the PKCE flow, and the code verifier is a cookie in the
  browser that requested the reset. **The link has to be opened in that same
  browser**; opening it on another device fails and returns to
  `/forgot-password` with a message saying so.
- Supabase's built-in email service is rate-limited (a small number of messages
  per hour), so repeated test requests will start failing to send.

## Data ownership and security

- `collections`, `notes` and `tags` each carry a `user_id` referencing
  `auth.users(id)`, `not null`, with `on delete cascade`.
- **Row level security enforces access.** One policy per table restricts every
  statement to rows whose `user_id` matches `auth.uid()`, so a signed-in user
  cannot read, change or delete another account's data — including by calling
  the API directly rather than going through the app.
- `note_tags` has no `user_id` of its own. A pairing's owner is already a fact
  about its note and its tag, so its policy derives ownership from those two
  relationships: you must own the note, and also own the tag to attach it.
- New rows take their `user_id` from the verified server session. No function
  accepts a user id as an argument and no form submits one, so ownership cannot
  be supplied by a client.
- Sessions are verified by signature on the server before a protected page
  renders, and every mutating Server Action authorises the request itself.
- Nothing is persisted in the browser — no `localStorage` or `sessionStorage`.
  Workspace state lives in the URL; the session lives in cookies.

Full schema, policies and migrations: [`docs/supabase-schema.md`](docs/supabase-schema.md)
and [`supabase/migrations/`](supabase/migrations/).

## Optional tasks completed

- **Self-service signup** — an account can be created from the login form
  without an invitation or an administrator.
- **Password reset** — a signed-out user can request a recovery email from the
  login form and set a new password without an administrator. See
  "Password reset" under "Authentication setup" for the flow, and
  [`docs/part8-password-reset-validation.md`](docs/part8-password-reset-validation.md)
  for what was manually verified.

Not implemented: GitHub sign-in and image uploads. Loading states are only
partially done — every form that writes shows a pending state while it submits,
but there is no route-level loading UI and no feedback during search or
navigation, so it is not claimed here.

## Project notes

- [`CLAUDE.md`](CLAUDE.md) — architecture rules, ownership rules, workflow and
  project state
- [`docs/supabase-schema.md`](docs/supabase-schema.md) — tables, columns,
  relationships, RLS policies and indexes, verified against the live database
- [`REFLECTION.md`](REFLECTION.md) — review evidence and reflection

Supabase Agent Skills are installed repository-local under `.agents/skills/` and
are committed, so they travel with the repository.
