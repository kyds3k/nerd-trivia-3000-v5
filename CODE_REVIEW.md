# Nerd Trivia 3000 — Code Review

Focus: admin section and edition creation/editing. Ordered by priority.

> **Status (implemented):** The critical security section (🔴 #1–#5) has been
> addressed in code — superuser auth moved server-side, leaked `NEXT_PUBLIC_`
> secrets removed, `/api/direct` gated, `/api/authenticate` deleted. See
> "What changed" at the bottom. **You still need to (a) rotate the exposed
> secrets and (b) test against your live PocketBase before the next game night.**
> The 🟠/🟡/🟢 items remain as suggested follow-ups.

---

## 🔴 Critical — security (fix before anything else)

### 1. PocketBase **superuser** credentials are shipped to the browser
`new/page.tsx` and `edit/page.tsx` authenticate like this:

```ts
const adminEmail = process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_EMAIL;
const adminPass  = process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_PW;
await pb.admins.authWithPassword(adminEmail, adminPass);
```

Any variable prefixed `NEXT_PUBLIC_` is inlined into the JavaScript bundle that every visitor downloads. So your **database superuser email and password are readable by anyone** who opens devtools → Sources, or just `view-source`. With them, anyone gets full read/write/delete on every collection. This is the single most important thing to fix.

Fix: never let the client authenticate as superuser. Do all privileged writes through your own server routes (Next.js route handlers / server actions) that hold the secret server-side, and gate them on the logged-in user's session. The client should only ever hold a *user* token scoped by collection rules.

### 2. `/api/authenticate` hands a superuser token to anyone
```ts
export async function POST() {
  const authData = await pb.collection("superusers").authWithPassword(adminEmail, adminPass);
  return NextResponse.json(authData, { status: 200 });  // returns the superuser token
}
```
No auth check — any anonymous POST gets back a superuser token. Same blast radius as #1. It also `console.log`s the admin email and password on every call (the comment even says "remove this in production"). And the PocketHost URL is hardcoded. Gate this behind a real session check, stop logging secrets, and return only what the client legitimately needs (ideally nothing — keep the token server-side).

### 3. Other secrets marked `NEXT_PUBLIC_` (also bundled to client)
From `.env`: `NEXT_PUBLIC_PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_APP_ID`, `NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET`. A Pusher *secret* in the client lets anyone sign events and drive every live game; a Spotify *client secret* is similarly not meant to be public. Your code actually reads the non-public versions (`PUSHER_SECRET` etc.) server-side, so the `NEXT_PUBLIC_` copies are pure leakage — delete them. Rule of thumb: only the Pusher **key** + **cluster** and the PocketBase **URL** belong in `NEXT_PUBLIC_`.

### 4. `/api/direct` is unauthenticated
Anyone who POSTs `{type, round, question, active}` can fire directives on the `directives` channel — jump rounds, reveal answers, trigger the final — during a live game. Add a session/secret check so only the host can drive the broadcast.

### 5. Admin gate is client-side only
`admin/page.tsx` decides `isAdmin` by reading `localStorage.pocketbase_auth.record.is_admin`. That's trivially editable in devtools. It's fine as a *UI* hint, but the real protection has to be PocketBase collection API rules — and given everything currently writes with a superuser token, those rules are likely bypassed entirely. Once #1 is fixed, lock down each collection's create/update/delete rules.

> After rotating: change the PocketBase superuser password, Pusher secret, and Spotify secret, since they've been exposed in the bundle/repo. Confirm `.env*` is gitignored (it is) — but check it was never committed historically.

---

## 🟠 High — the new/edit duplication

`new/page.tsx` (1,924 lines) and `edit/page.tsx` (2,247 lines) are two near-identical implementations of the same form that have **drifted apart**:

| | `new` | `edit` |
|---|---|---|
| State | one `editionData` object via `useEditionDraft` | ~50 individual `useState` hooks |
| PB client | shared `getPocketbaseClient()` | `new Pocketbase(...)` inline |

You already did the hard part — `EditionDraftData` is a clean single-object shape. The win is to extract one `<EditionForm value={editionData} onChange={...}/>` component and have both pages render it; `new` starts from a blank draft, `edit` hydrates the draft from PocketBase. That deletes ~2,000 lines and means a field added once shows up in both. Right now every change has to be made twice, which is how they diverged.

### Dead code in `handleCreateEdition`
Right after creating the edition you fetch and "reset to inactive" its questions, impossible rounds, wager, and final rounds — but the edition was *just* created, so none of those child records exist yet. Those four `getFullList` + update loops are no-ops on a fresh edition. Remove them (or move the reset logic to where it's actually needed).

### Slow sequential writes
Creation does serial `await` in loops with `sleep(200)`/`sleep(500)` sprinkled in to dodge rate limits/races. For ~15 questions + rounds that's a lot of round-trips. Once writes go through a server route you can batch them (or at least `Promise.all` independent creates) and drop the sleeps.

### Two parallel persistence systems
Draft autosave lives in `localStorage` (`useEditionDraft`), while "Save Progress" writes to a `wip_editions` collection. Worth deciding on one source of truth — otherwise a user can have a localStorage draft and a server WIP that disagree.

---

## 🟡 Medium — admin page (`admin/page.tsx`)

The navigation logic works but is doing a lot by hand:

**The 15-boolean switch state is really one "what's active right now" value.** `SwitchStatesType` has `switchR1Q1`…`switchR3Q5`, plus separate `switchI1/I2/Wager/Final/Tiebreaker`. Because only one thing can be active at a time, every toggle handler manually sets the other 14 (or 15) back to `false` — that "reset everything else" block is copy-pasted ~5 times. Collapsing this to a single `activeItem` value (e.g. `{kind:'question', round:1, q:3}` | `{kind:'impossible', n:1}` | `'wager'` | …) makes the whole `handleToggle` function a few lines and removes every copy-pasted reset block. It also fixes the `handleToggle` loop that calls `setSwitchStates` inside a `forEach` (one render per key instead of one render).

**Redundant fetch-then-find.** `toggleActive` calls `getFullList({filter: edition_id})` then `.find()` for the matching question/impossible. You can filter on the server (`question_number=... && round_number=...`) and skip pulling the whole list each toggle.

**Tiebreaker isn't scoped to the edition.** `pb.collection('tiebreakers').getFullList()` has no `edition_id` filter, so it deactivates/activates across *all* editions globally. Add the filter.

**Errors are swallowed.** Failures only `console.error` — the host pressing a button during a live show gets no feedback if a write fails. Surface a toast (you already have `react-toastify`).

**`FINISH IT!` uses `confirm()`/`alert()`** and resets `current_edition`, `wager`, `banthashit_card` but not `points_for_game`. Double-check that's intentional, and consider a proper modal so a misclick during a live game doesn't wipe team data.

Lots of leftover `console.log`s throughout (`"Admin Password:"`, "should be:", etc.) — strip before production.

---

## 🟢 Lower — typing & hygiene

- `questions` is `useState<any[]>`; many `as unknown as Array<{…}>` casts. You have `src/types/pocketbase.ts` — leaning on generated types removes the casts and catches field renames at compile time.
- `let formatter =` in `edit` should be `const`.
- `.DS_Store` files are committed throughout `src/` — add to `.gitignore` and `git rm --cached` them.
- `EditionManagementTabs.tsx` appears unused now that both pages use HeroUI `<Tabs>` (you have `knip` configured — `pnpm knip` will list dead files like this).

---

## Suggested order

1. Pull superuser auth out of the client; gate `/api/authenticate` and `/api/direct`; rotate exposed secrets (#1–#5).
2. Extract the shared `<EditionForm>` so new/edit stop diverging.
3. Refactor admin to a single `activeItem` state; scope tiebreakers; add toasts.
4. Type cleanup + remove dead code/logs.

The security items are genuinely urgent — everything else is quality-of-life. Happy to take any one of these and implement it.

---

## What changed (this pass)

**New files**
- `src/lib/serverAuth.ts` — `getSuperuserClient()` (superuser auth, server-only) and `requireAdmin(req)` (validates a caller's PocketBase user token + `is_admin`).
- `src/app/api/pb-elevate/route.ts` — returns a superuser token only to verified admins; replaces shipping the password to the browser.
- `src/lib/elevate.ts` — client helper `elevateAuth(pb)` that calls `/api/pb-elevate` with the user's token.
- `getElevatableClient()` added to `src/lib/pocketbase.ts` — an in-memory-auth client so elevation never clobbers the persisted user login in `localStorage`.

**Edited**
- `new`, `edit`, `dashboard` pages: `refreshAuthState` now calls `elevateAuth`; no more `NEXT_PUBLIC_POCKETBASE_ADMIN_*`. They use `getElevatableClient()`. Removed a `console.log` that printed the PB URL.
- `admin` page: `/api/direct` calls now send `Authorization: Bearer <token>`.
- `src/app/api/direct/route.ts`: gated with `requireAdmin`.
- `new` page: removed dead "reset active states" loops in `handleCreateEdition`.
- `.env` / `.env.local`: removed unused leaked `NEXT_PUBLIC_` secrets (Spotify id/secret, Pusher app-id/secret, Clerk keys). Kept only `NEXT_PUBLIC_` URL, Pusher key+cluster, Tenor, Daily domain.

**Deleted**
- `src/app/api/authenticate/route.ts` — unauthenticated superuser-token endpoint with no callers.

**Must do manually**
1. Rotate the secrets that were exposed in the client bundle / repo history: PocketBase superuser password, Pusher secret, Spotify secret, Clerk secret (if Clerk is/was used), and ideally the Google client secret and `NEXTAUTH_SECRET`.
2. In production (Fly/PocketHost) env, delete any `NEXT_PUBLIC_POCKETBASE_ADMIN_*` and confirm `POCKETBASE_ADMIN_EMAIL` / `POCKETBASE_ADMIN_PW` exist server-side.
3. Test before a live show: log in as admin, create + edit an edition, and drive a game from the admin panel (round/question/impossible/wager/final/tiebreaker toggles). Creating/editing/driving now **requires being logged in as an admin** — the old anonymous-superuser fallback is gone by design.
4. Lock down PocketBase collection API rules so the elevated token isn't the only thing standing between a user and your data.

Typecheck (`tsc --noEmit`) passes clean.
