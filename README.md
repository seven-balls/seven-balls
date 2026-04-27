# SevenBalls — Deploy guide

This is a complete, deployable version of sevenballs.co.uk. Follow the steps below to get it live on the internet in about 15 minutes. No coding required.

---

## Step 1 — Create accounts (5 minutes)

You need two free accounts:

1. **GitHub** — where your code lives. Sign up at https://github.com/signup if you don't have one.
2. **Vercel** — what hosts your site. Sign up at https://vercel.com/signup using your GitHub account (it'll link them automatically).

---

## Step 2 — Upload the code to GitHub (5 minutes)

1. Go to https://github.com/new
2. Repository name: `sevenballs`
3. Leave it set to **Public**
4. **Don't** tick "Add a README" — you already have one
5. Click **Create repository**
6. On the next page, click the **uploading an existing file** link
7. Drag the entire contents of this folder (everything inside `sevenballs-deploy`) into the upload area. Make sure you upload the *contents* of the folder, not the folder itself.
8. Scroll down, click **Commit changes**

---

## Step 3 — Deploy with Vercel (3 minutes)

1. Go to https://vercel.com/new
2. You'll see a list of your GitHub repos. Click **Import** next to `sevenballs`
3. Leave all settings as default — Vercel auto-detects this is a Vite project
4. Click **Deploy**
5. Wait ~60 seconds. You'll see confetti when it's ready.
6. Click the preview screenshot or the URL shown — your site is live at something like `sevenballs-abc123.vercel.app`

**Test it.** Open the site, paste a TikTok URL, and check the thumbnail and handle auto-fill.

---

## Step 4 — Connect sevenballs.co.uk (5 minutes)

1. In your Vercel project, go to **Settings → Domains**
2. Type `sevenballs.co.uk` and click **Add**
3. Vercel will show you DNS records you need to add at your domain registrar (whoever you bought the domain from — e.g. GoDaddy, Namecheap, 123-Reg)
4. Log into your registrar's DNS settings and add the records exactly as shown
5. Wait 10-30 minutes for DNS to propagate. Vercel will show a green tick when it's connected.
6. Also add `www.sevenballs.co.uk` and set it to redirect to the apex domain.

---

## Step 5 — When you make changes

Every time you (or I) update a file in the GitHub repo, Vercel auto-deploys the new version within a minute. No need to do anything manually.

---

## What's included

- `index.html` — the entry HTML page
- `src/SevenBalls.jsx` — the main React app (the whole site)
- `src/main.jsx` — React initialiser
- `src/index.css` — Tailwind styles
- `api/oembed.js` — serverless proxy that lets the site fetch TikTok and Vimeo thumbnails without CORS issues
- `package.json` — lists the dependencies (React, Tailwind, etc.)
- Other config files for Vite, Tailwind, PostCSS

---

## Important caveats

- **Submissions are session-only.** When you close the browser, any clips you submitted disappear. To make them persist, the site needs a database (next step — Supabase or Firebase, both have free tiers).
- **Anyone can vote multiple times** by clearing their session. Real voting limits also need a backend.
- **No moderation** — clips appear instantly. For a public launch you'll want a queue where you approve clips before they go live.

When you're ready, I can build all of those in.
