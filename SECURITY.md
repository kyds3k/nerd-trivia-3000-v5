# Security — Lockdown & Rotation Runbook

Branch: `bugfix/security-fixes`

This covers the two remaining hardening tasks: **(1)** locking down PocketBase so the
browser can't write game data directly, and **(2)** rotating the secrets that were
exposed earlier. The code half of #1 is done in this branch; the PocketBase-admin
half and the rotation are manual steps you do in each service's dashboard.

---

## 1. What changed in the code

Players used to write directly to PocketBase from the browser (`answers`, `wagers`,
`teams`). Because there's no user↔team ownership link, collection rules alone can't
stop a logged-in player from submitting as another team or editing `points_for_game`.
So those writes now go through **server routes that run as the superuser** and validate
everything the client can't be trusted with:

| Route | Replaces | Server-side enforcement |
|-------|----------|--------------------------|
| `POST /api/play/answer` | `answers.create` in regular / impossible / final / tiebreaker pages + bantha consumption | logged-in user; team belongs to edition; **question/round is active**; one answer per team (dedup); only answer-content fields accepted (no `answer_correct`/`misc_bonus` injection); identity taken from the DB team record |
| `POST /api/play/wager` | `wagers.create` in the wager page | same, plus **wager ≤ team points** |
| `POST /api/play/register` | `teams.create` / `teams.update` in the join page | logged-in user; name uniqueness; server-generated team identifier |

Admin/content writes (edition editing, scoring, activation toggles) are unchanged —
they already run as the admin (or the elevated superuser client), so they keep working
once the rules below are in place.

---

## 2. PocketBase collection rules to apply

Do this in the PocketBase Admin UI → each collection → **API Rules** tab.

**Set these three rules** — *Create*, *Update*, and *Delete* — to exactly:

```
@request.auth.is_admin = true
```

…on every game collection:

```
editions        rounds          questions
impossible_rounds   final_rounds    wager_rounds
answers         wagers          teams
tiebreakers     wip_editions    loading_quotes
```

Why this works:

- **Players** aren't admins, so all three write ops are denied from the browser. Their
  submissions still succeed because the server routes act as the **superuser, which
  bypasses collection rules entirely**.
- **The admin** (scoring, toggles, edition editing) has `is_admin = true`, so the admin
  app keeps writing directly.

### Leave these ALONE

- **List / View (read) rules** — do **not** tighten them. Several presenter screens read
  with an unauthenticated client (e.g. the scoreboard), so reads must stay as they are
  or those screens break. This change is **write-only**.
- **`users`** collection — leave its rules at the PocketBase/OAuth defaults; Google login
  depends on them.
- **`_superusers`** — never expose; never referenced from the client.

### Verify after applying

1. **Happy path:** play a question as a team — it should still submit (goes through the
   server route).
2. **Locked path:** in a player browser console, try a direct write and confirm it's
   refused:
   ```js
   // should throw 403/400, NOT succeed:
   await pb.collection("teams").update("<someTeamId>", { points_for_game: 999999 });
   ```
3. **Admin path:** score a round and toggle a question active — should still work.

---

## 3. Secret rotation checklist

These were exposed at some point (shipped to the client or committed), so removing them
from env isn't enough — they must be **rotated**. After each, update **both** `.env` and
`.env.local`, then restart the app (and redeploy) so the new values load.

- [ ] **PocketBase superuser password** (`POCKETBASE_ADMIN_PW`)
  PocketBase Admin UI → your superuser account → change password. (Or create a new
  superuser, switch the env to it, then delete the old one.) Update `POCKETBASE_ADMIN_EMAIL`
  /`POCKETBASE_ADMIN_PW`. The `/api/play/*` and elevate routes authenticate with these, so
  restart after changing.

- [x] **Spotify** — *no longer used (replaced by Apple Music).* The `AUTH_SPOTIFY_*`
  env vars and all code references have been removed. Nothing to rotate; just **delete the
  old Spotify app** in the Spotify Developer Dashboard so the exposed secret is dead.

- [ ] **Pusher secret** (`PUSHER_SECRET`)
  Pusher Channels app credentials aren't individually rotatable — create a **new Channels
  app** and replace all of: `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`,
  and the public `NEXT_PUBLIC_PUSHER_KEY` / `NEXT_PUBLIC_PUSHER_CLUSTER`. (The key/cluster are
  public by design — only the secret leaking is the problem, but a new app rotates all of them
  cleanly.)

- [ ] **NextAuth secret** (`NEXTAUTH_SECRET`) — *if it was ever committed*
  Generate a fresh one: `openssl rand -base64 32`. Rotating invalidates existing login
  sessions (everyone re-logs in).

- [ ] **Google OAuth client secret** (`GOOGLE_CLIENT_SECRET`) — *only if you suspect it leaked*
  Google Cloud Console → APIs & Services → Credentials → your OAuth client → **reset secret**.
  This one was server-side only, so likely fine — rotate if in doubt.

### Housekeeping
- Confirm `.env` and `.env.local` are git-ignored (`git check-ignore .env .env.local`).
- A couple of env keys have stray spaces around `=` (e.g. `PUSHER_APP_ID =`). dotenv trims
  these so it works, but tidy them up while you're in there.

---

## 4. Minor / optional

- **`NEXT_PUBLIC_TENOR_API_KEY`** ships to the browser by nature of the GIF picker. It's a
  low-value key, but if you ever see abuse, proxy Tenor calls through a small server route
  and drop the `NEXT_PUBLIC_` prefix. Not urgent.
