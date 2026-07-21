# AKS — Adventurous & Kreative Souls
Website + Admin Panel (HTML/CSS/JS + Supabase backend)

## What's in this folder
- `index.html` — the public website (reads content live from Supabase)
- `admin.html` + `admin.js` — password-protected admin panel to manage everything
- `site.js` — loads hero/about/contact/gallery/trips onto the public site
- `config.js` — your Supabase project URL + public key (already filled in)
- `schema.sql` — run this once in Supabase to create tables + storage
- `assets/logo.jpg` — your AKS logo

---

## Step 1 — Run the database setup (one time only)
1. Go to your Supabase project → **SQL Editor** → **New query**
2. Paste the entire contents of `schema.sql` and click **Run**
3. This creates 3 tables (`site_settings`, `gallery`, `trips`), a public image storage bucket (`aks-images`), security rules, and some starter content so the site isn't empty.

## Step 2 — Create your admin login
Supabase mein sign-up form nahi bana (security ke liye) — admin user manually banega:
1. Supabase Dashboard → **Authentication** → **Users** → **Add user**
2. Apna email + password daalo → **Create user**
3. Ye email/password `admin.html` pe login karne ke kaam aayega

## Step 3 — Try it locally
Bas `index.html` ko browser mein khol lo — site turant Supabase se data uthake dikhayegi.
`admin.html` khol ke Step 2 wale email/password se login karo — hero, about, contact, gallery, trips sab yahin se edit ho sakte hain, images seedha upload ho jaati hain.

## Step 4 — Deploy to GitHub Pages
1. Is poore folder (index.html, admin.html, admin.js, site.js, config.js, assets/) ko apne GitHub repo mein push karo
2. Repo → **Settings** → **Pages**
3. Source: **Deploy from a branch** → Branch: `main` → Folder: `/ (root)` → **Save**
4. Kuch minutes mein site live ho jayegi: `https://<username>.github.io/<repo-name>/`
5. Admin panel available hoga: `https://<username>.github.io/<repo-name>/admin.html`

## New: Photo albums for BOTH "Adventure Gallery" cards AND "Upcoming Trips"
Clicking any card — a gallery photo or a trip — opens a stylish popup with just that card's own photos, with its title on top. Clicking a photo inside opens it full-size. No hover needed anywhere; titles are always visible on the cards.

**If this is your first time setting up:** just run the updated `schema.sql` — it already includes everything.

**If you already ran the old `schema.sql` before:** run these two files once in the Supabase SQL Editor (in this order), each only once:
1. `migration-trip-images.sql` (adds albums to Upcoming Trips)
2. `migration-gallery-images.sql` (adds albums to Adventure Gallery)

Don't re-run the full `schema.sql` on a project you already set up — you'll get duplicate starter rows.

**To add photos to an album from the admin panel:**
- **Trips tab** → any trip card → **"Manage Gallery Photos"**
- **Gallery tab** → any gallery card → **"Manage Album Photos"**
- Choose one or more photos (multi-select supported) → upload
- Delete any photo anytime with the small ✕ on its thumbnail

**If you don't see these changes on your live site:** make sure you've re-uploaded/pushed the latest `index.html`, `site.js`, `admin.html`, and `admin.js` from this folder — and do a hard refresh (Ctrl+Shift+R / Cmd+Shift+R) since browsers cache these files.

## Important notes
- Supabase **anon/public key** ko `config.js` mein rakhna safe hai — ye key sirf **read** kar sakti hai jab tak koi login na kare (Row Level Security ki wajah se). Sirf logged-in admin hi write/edit/delete kar sakta hai.
- Har visitor ko same live data dikhega (localStorage nahi, real database hai) — admin panel se koi bhi change turant sabko dikhega.
- Naya admin user add karna ho to Step 2 dobara karo.
- Contact form abhi sirf visual confirmation deta hai (koi email/database save nahi hota) — agar enquiries Supabase mein save karni ho ya email pe bhejni ho to bata dena, ek `enquiries` table + admin tab add kar dunga.
