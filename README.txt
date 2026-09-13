WASKARA PUBLIC WEBSITE — SUPABASE CONNECTED

This version keeps the existing Waskara public design and connects the public website to the same Supabase database used by the admin dashboard.

WHAT IS CONNECTED
- Articles page loads published articles from public.articles.
- Articles are sorted newest first by created_at.
- Draft articles are not shown publicly.
- Article detail pages load dynamically using the article slug (or UUID as fallback).
- Article title, excerpt, date, content, and estimated reading time come from Supabase.
- Search searches published articles from Supabase.
- Existing navbar, footer, About, Contact, responsive layout, and automatic system dark mode are preserved.

SETUP
1. Open config.js.
2. Put the same Supabase project URL used by the admin dashboard into SUPABASE_URL.
3. Put the browser-safe publishable/anon key into SUPABASE_KEY.
4. Do NOT use a service_role/secret key in the public website.
5. Deploy the whole folder to Vercel/Cloudflare Pages/etc.

EXAMPLE
window.WASKARA_CONFIG = {
  SUPABASE_URL: "https://your-project.supabase.co",
  SUPABASE_KEY: "your-publishable-or-anon-key"
};

SUPABASE / RLS
The public website uses the anon/publishable key, so the database must allow anonymous SELECT only for published articles. The existing Waskara Supabase setup SQL already contains the required policy:
- anon can SELECT articles where status = 'published'

If your Supabase policies were changed, restore an equivalent SELECT policy before deploying.

CONTENT
The admin dashboard can save article content as HTML. The public page renders common article HTML and removes scripts/event handlers before inserting it into the page.

FILES
- index.html
- article.html
- about.html
- contact.html
- style.css
- script.js
- config.js
- README.txt
