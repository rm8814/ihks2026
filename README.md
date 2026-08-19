# IHKS 2026 — Interactive Schedule

An interactive schedule app for the IHKS 2026 congress (Yogyakarta Marriott Hotel,
19–23 Aug 2026), built from the official program book. Browse and filter every
session, bookmark a personal agenda, look up a speaker's full session list, and
(for the committee) reassign a session's speaker or swap which PIC / assist-PIC
is covering it — live, on a shared link.

The app works immediately with no setup (it ships with the program-book data
bundled in, stored to your browser's localStorage when you edit). Wiring it up
to Supabase turns that into a real shared database everyone on the committee
edits together in real time.

## What's included

- `data/events.json` — every session from the program book: day, time, room/track,
  title, speakers, chairman/co-chairman/moderator, course director, and (where
  known) the assigned PIC / assist-PIC.
- `src/` — the React app (Vite + Tailwind).
- `supabase/schema.sql` — the Postgres schema + Row Level Security policies.
- `scripts/seed.mjs` — one-time script to load `data/events.json` into Supabase.

**Note on data accuracy:** most sessions were extracted from clean time/title/
speaker tables in the PDF and should be reliable. A handful of sessions inside
the three Masterclasses (Hip, Knee) had their time/speaker columns jumbled by
the PDF's layout and could not be split with full confidence — those are
flagged with a "verify" note in the Notes field. Everything else uses the
recap sheet's PIC assignments cross-checked against the program book.

## 1. Run it locally first (no Supabase needed)

```bash
npm install
npm run dev
```

Open the printed localhost URL. You'll see "Local mode" in the header — the
app is reading `data/events.json` and any edits you make save to your
browser's localStorage only (per-device, not shared).

## 2. Set up Supabase (to make edits shared/live)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste in the contents of
   `supabase/schema.sql`, and run it. This creates the `events` table, the
   `pic_directory` table, and Row Level Security policies that allow public
   read + write (matching the "no login gate, anyone with the link can edit"
   choice made for this internal tool — see the note below if you want to
   change that later).
3. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key
   - **service_role** key (keep this one secret — never put it in the
     frontend or commit it)
4. Copy `.env.example` to `.env` and fill in all four values.
5. Seed the database from the bundled program-book data:
   ```bash
   npm run seed
   ```
   This clears the `events` table and inserts all rows from
   `data/events.json`. Safe to re-run any time you want to reset to the
   original program-book data.
6. Run `npm run dev` again — the header should now say "Live (Supabase)",
   and edits made in Edit mode are saved to Supabase instantly and visible
   to anyone else with the link.

## 3. Deploy to Netlify

1. Push this project to a GitHub repo (or drag-and-drop the `dist/` folder
   after running `npm run build` into Netlify's manual deploy).
2. In Netlify: **Add new site → Import an existing project**, connect the
   repo. Build command `npm run build`, publish directory `dist` (already
   set in `netlify.toml`).
3. In **Site settings → Environment variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   (Only these two — never add the service role key to Netlify or any
   frontend build.)
4. Deploy. Every visitor now reads/writes the same live Supabase data.

## Using the app

- **Schedule tab** — filter by day, track/room, or free-text search (matches
  title, speaker, room, PIC name, notes). Toggle "PIC gaps only" to instantly
  see every session missing a PIC assignment — this is how the Cadaveric
  Workshop gap (Paulus Ronald Hibono / Aree Tanavalee) was originally found.
- **My Agenda tab** — sessions you've starred, stored per-browser.
- **Speakers tab** — every person in the program book with every session
  they're attached to (as speaker, chairman, co-chairman, moderator, or
  course director).
- **Edit Speakers / PIC** (top-right toggle) — turns every card's speaker
  list, chairman/co-chairman/moderator, PIC, and assist-PIC into click-to-edit
  fields. Existing names autocomplete from a dropdown; you can also type a new
  name. Changes save on Enter / the Save button.

## About the open-edit access model

Per your instructions, editing is currently open to anyone with the link —
there's no login. That's fine for an internal committee tool, but it does mean
anyone with the URL can change speaker/PIC assignments. If you ever need to
lock that down:

- Easiest: keep the Netlify URL unlisted / share only with the committee.
- Stronger: switch to Supabase Auth (magic link or email/password), and
  change the `events` RLS policies in `supabase/schema.sql` from
  `using (true)` to `using (auth.role() = 'authenticated')`. Ask me to wire
  this up if you want it later — the app's data layer (`src/useEvents.js`)
  is already structured to make that a small change.
