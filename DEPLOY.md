# Setting up your accounts

You need three free accounts. None of this costs money on the scale of a 6-team hobby league.
Do these in order — later steps need info from earlier ones.

## 1. Supabase (the database)

1. Go to https://supabase.com and sign up (GitHub login is easiest).
2. Click **New Project**. Name it `spartan-league-2`, pick any region close to you, set a
   database password (save it somewhere — you likely won't need it again, but just in case).
3. Wait ~2 minutes for the project to spin up.
4. In the left sidebar: **Project Settings → API**. You'll see:
   - **Project URL** — looks like `https://xxxxxxxx.supabase.co`
   - **anon public** key — a long string under "Project API keys"
   
   **Send me both of these** — they're safe to share, they only allow the public read/anonymous
   access the app is designed to have.
5. **Do not** send me the `service_role` key if you ever see it — that one bypasses all the
   access rules. This project's design never needs it outside Supabase's own dashboard.
6. In the left sidebar: **Authentication → Users → Add user**. Create one user:
   - Email: anything you like, e.g. `admin@spartanleague.internal` (doesn't need to be real, you won't receive email there)
   - Password: a long random password (a password manager can generate one) — this is **not**
     the league PIN, it's an internal credential the app uses behind the scenes
   - **Send me the email you used** (not the password — that goes straight into Supabase's
     secret storage, see step 8)
7. Pick your league PIN — the short code you and viewers will actually type in the app to log
   in as admin (like the current `SPARTAN2026`). **Send me this PIN.**
8. Once I have all of the above, I'll give you the exact `supabase secrets set` commands to run
   (or the dashboard screen to paste them into) for `ADMIN_PIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
   — these three stay server-side and I never see the password or need to.
9. I'll also give you the exact SQL to paste into **SQL Editor** (from `supabase/migrations/0001_init.sql`
   in this project) and the command to deploy the `admin-login` function.

## 2. GitHub (where the code lives)

1. Go to https://github.com and sign up if you don't have an account.
2. Create a new **private** repository named `spartan-league-2`. Leave it empty (no README/gitignore — this project already has those).
3. **Send me the repository URL** (looks like `https://github.com/your-username/spartan-league-2`).

## 3. Vercel (hosting)

1. Go to https://vercel.com and sign up using **"Continue with GitHub"** — this links the two automatically.
2. Once logged in, click **Add New → Project**, and import the `spartan-league-2` repo you just created.
3. Before clicking Deploy, expand **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = the Project URL from step 1.4
   - `VITE_SUPABASE_ANON_KEY` = the anon public key from step 1.4
4. Click **Deploy**. In about a minute you'll get a live URL like `spartan-league-2.vercel.app`.
5. From then on, every time I push a change, Vercel rebuilds and updates that URL automatically
   — no further action needed from you. You can also add a custom domain later from the Vercel
   project's Settings → Domains if you want one.

## What to send me, all together

- Supabase Project URL
- Supabase anon public key
- The email you used for the admin user (not the password)
- Your chosen league PIN
- GitHub repo URL

Once I have these, I'll wire up the secrets, push the code, and share the live link back to you.
