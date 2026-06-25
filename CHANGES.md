# Nerd Trivia 3000 — Audit, Fixes & Features

Branch: `bugfix/antigravity-audit`

A large batch of security hardening, bug fixes, and new features developed collaboratively. Grouped by area below.

---

## 🔒 Security

- **Removed superuser credentials from the client.** The PocketBase superuser token was previously reachable from the browser. Privileged access now happens only server-side.
- **Added a server-side admin-elevation route** (`/api/pb-elevate`) backed by `serverAuth.ts` (`getSuperuserClient`, `requireAdmin`). It validates the caller's PocketBase *user* token and confirms `is_admin` before ever returning elevated access — the client-side `is_admin` flag is never trusted.
- **Added `getElevatableClient()`** — an in-memory client seeded from the persisted session so elevation never clobbers the user's stored login.
- **Gated `/api/direct`** (the live broadcast endpoint) behind `requireAdmin`, so only a logged-in admin can drive navigation directives.
- **Deleted `/api/authenticate`**, an unauthenticated endpoint that handed out a superuser token.
- **Removed leaked `NEXT_PUBLIC_*` secrets** from env (Spotify, Pusher app-id/secret, Clerk) so they no longer ship to the client bundle.

> ⚠️ **Still outstanding (intentionally deferred):** rotate the secrets that were previously exposed (PocketBase superuser password, Pusher secret, Spotify secret) and audit PocketBase collection access rules so players can't write directly to `answers`/`teams` from the browser.

---

## ✨ New Features

### Player reconnect
- A team that logs back in mid-game (e.g. after closing the browser) is now automatically moved to the live question. On landing, the team asks the presenter to re-announce its location and is navigated there.
- Added `requireUser()` (validates a logged-in user without requiring admin) and relaxed `/api/direct` so any logged-in player may send the harmless `request_location` directive, while every other directive still requires admin.

### Host submission tracker
- New live panel on the admin **Navigation** tab. For the currently-navigated question it shows a running **`submitted / total`** count and a per-team checklist (✓ submitted / ○ waiting), and flashes **"All teams are in!"** when complete. Refreshes instantly off player submission notifications, with a manual Refresh button as backup.

### Tiebreaker scoring & flow
- Added **Tiebreaker** to the admin Scoring round picker plus a read-only **review panel**: shows the correct number, each team's guess, the absolute difference (sorted closest-first), and highlights the winner — mirroring the presenter scoreboard logic.
- **Tiebreaker-of-the-tiebreaker nudge:** when the closest guesses tie exactly, both the presenter scoreboard and the admin review now show a "Still tied — pick a winner or run another tiebreaker" banner instead of silently recording no winner.
- The presenter re-announce (`broadcastLocation`) now covers the tiebreaker case too.

### Final scoreboard medals
- 🥇/🥈/🥉 next to the top three teams **on the final scoreboard only**. Medals are tier-based (by distinct score), and any **contested tier shows ❓** on all tied teams so the host knows a placement still needs resolving.

### Banthashit "last chance" reminder
- On **Round 3, Question 5**, a team still holding an unused Banthashit Card sees a pulsing "Last chance to use your Banthashit Card!" banner above the use-card switch.

### Content editing (admin)
- **Shared `<EditionForm>`** extracted so the new-edition and edit-edition pages use one component (eliminating drift between them).
- **Tiptap tables**: full table editing with controls in the bubble menu, plus a floating menu so a table can be inserted without selecting text first; nested tables are prevented; styled to match the editor.
- **Apple Music search** added to Impossible-round songs (previously only on other rounds).
- **Correct Answer panel** on the admin Scoring tab, including the music answers, so the host can score against the official answer.

---

## 🐛 Bug Fixes

### Auth / navigation
- **Team-join bounce:** teams were briefly redirected back to the join screen because `isAuthenticated` starts `false`; removed the premature redirect.
- **Post-login UI not updating:** `useAuth` now reacts to auth-store changes instead of only checking on mount.
- **Dashboard logout** didn't fully sign out (the in-memory elevatable client's clear didn't touch persisted storage); now clears the persistent client and local storage.
- Removed a premature `router.push("/")` that could bounce players off the team page.

### Scoring
- **Regular & Final scores weren't saving** — the entire submit handler was wrapped in an `if (roundType === "impossible")` guard; unwrapped it.
- **Re-scoring** now correctly syncs in-memory answer/wager state so an immediate re-score computes its delta against the right baseline.
- Differential scoring (apply only the change) preserved across regular, impossible, final, and wager music bonuses.

### Submissions
- **Duplicate-submission guards** on every submission path (regular, impossible, wager, final, tiebreaker): a synchronous lock blocks double-clicks, and a pre-write existence check prevents a second record on reconnect or a second device.

### Realtime / directives
- **`usePrimeDirectives` re-subscribe churn:** consumer callbacks moved into refs so the Pusher subscription only re-binds on real channel/edition/team changes — closing a small window where a directive could be missed.
- Fixed shared-channel teardown: cleanup now unbinds only its own handlers instead of unsubscribing the whole shared channel.

### Editor / forms
- Fixed the Bantha GIF toggle bug, a controlled-input React warning, the broken "Save Progress" (no draft data found), and several save field-name typos (e.g. `home_song_apple`, `song_apple`).
- **Music Artist is now optional**, defaulting to `<none>` when left blank.
- Fixed a focus ring being clipped on the left of switches.

### Presenter / player display
- GIF answer slides now fill the space without overflowing — settled on a consistent `h-[75vh]` for all answer GIFs (regular, bantha, impossible, final).
- Album art now fades in gradually.
- Pixelated the editor's "back to top" arrow.
- GIF select buttons are keyboard-activatable (Enter / Space).
- Cleaned up Next.js dynamic-API (`params`/`searchParams`) warnings on the wager page.

### Admin ↔ presenter sync
- Presenter now follows the admin's navigation clicks (with the interstitial Tardis animation).
- **Exclusive activation:** exactly one game segment is active at a time.
- The current question is highlighted (green) in the admin, and the highlight is **restored after an admin page reload** via a `request_location` round-trip.

---

## 🎵 Apple Music Bridge

- Fixed the Puppeteer-based bridge end-to-end: launch against the user's Chrome, play, **pause/resume** (resume no longer restarts the track), and next/previous.
- Added `.puppeteerrc.cjs` (`skipDownload: true`) and an autoplay-policy flag; filtered browser logs.
- Player polling backs off when the bridge is offline.

---

## ⚙️ Tooling / Performance

- **Faster edition updates:** edits are now diff-based — only changed records are written, dropping large artificial delays.
- Pinned the package manager (`pnpm@9.15.4`) to avoid a `node:sqlite` break on newer Node, and added the Tiptap table extension dependencies.
- TypeScript (`tsc --noEmit`) kept clean throughout.

---

## 🔁 Files of note

- `src/lib/serverAuth.ts`, `src/app/api/pb-elevate/route.ts`, `src/lib/elevate.ts`, `src/lib/pocketbase.ts` — auth/elevation
- `src/app/api/direct/route.ts` — gated broadcasts + `request_location`
- `src/components/EditionForm.tsx`, `src/components/TipTap.tsx` — shared form + tables
- `src/components/Scoring.tsx`, `src/components/RoundSelects.tsx`, `src/components/SubmissionTracker.tsx` — scoring, tiebreaker review, submission tracker
- `src/hooks/usePrimeDirectives.ts`, `src/app/edition/[id]/present/PresenterBroadcaster.tsx` — realtime navigation
- `src/app/edition/[id]/play/[teamId]/**` — player pages (reconnect, duplicate guards, last-chance reminder)
- `src/app/edition/[id]/present/scoreboard/page.tsx`, `.../present/tiebreaker/scoreboard/page.tsx` — medals, tiebreaker nudge
- `apple-music-bridge/server.js`, `apple-music-bridge/.puppeteerrc.cjs` — music bridge
