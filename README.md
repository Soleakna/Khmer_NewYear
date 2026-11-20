# Khmer Living Archive — starter

This is the starting point for your ICT 340 capstone: a community archive that preserves a piece of Khmer culture. Right now it's one page. By December it will browse, search, take contributions, and publish reviewed entries. Same skeleton for everyone; the collection is yours.

## Lab 1: get this live

Follow the Lab 1 guide on Canvas. The short version:

1. Click **Use this template** (top right) → **Create a new repository**. Name it after your archive.
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, **Add New → Project**, import your new repository, and click **Deploy**.
3. Clone your repo, open it in VS Code, edit `collection.config.js` (the only file you touch today), then commit and push:

   ```bash
   git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   cd YOUR-REPO-NAME
   code .
   # edit collection.config.js, then:
   git add .
   git commit -m "make it mine"
   git push
   ```

4. Watch Vercel redeploy on its own, then submit your live URL to the Lab 1 assignment on Canvas.

## Running it locally (optional today, needed from week 2)

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Rules of the road

You own what you ship. Every line that lands in this repository is yours to explain, whoever or whatever wrote it.










# Khmer New Year Archive

A community archive that preserves Khmer New Year culture. Visitors can browse and search published entries in English and Khmer. Signed-in contributors can submit entries with photos and edit or delete their own entries. A reviewer approves each entry before it becomes public.

This project was built as the ICT 340 capstone at the American University of Phnom Penh (AUPP). The archive's name, description, curator, and source are read from `collection.config.js`.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Supabase Setup](#supabase-setup)
- [Deployment](#deployment)
- [How the Review Workflow Works](#how-the-review-workflow-works)
- [Known Limitations](#known-limitations)
- [Screenshots](#screenshots)
- [Contributors](#contributors)

## Features

- **Browse and search:** the home page lists published entries, 6 per page. A search box filters them by title or description.
- **Hero slideshow:** four slides advance every 5 seconds, with previous and next buttons.
- **Entry detail pages:** each entry at `/entries/[slug]` shows the English description, the Khmer description (when one exists), the contributor, and the place.
- **Accounts:** sign up, log in, and log out with email and password through Supabase Auth.
- **Contribute:** signed-in users submit an entry with a title, a URL slug, an English description, an optional Khmer description, a contributor name, a place, and a photo. The photo is either uploaded (JPG, PNG, or WebP, 5 MB or smaller) or linked by a direct image URL.
- **My Entries:** signed-in users see their own entries in every status.
- **Edit and delete:** owners can edit or delete their own entries. Any edit sends the entry back to Pending.
- **Review queue:** reviewers see pending entries and can publish or return them. Reviewers cannot publish or return their own entries.
- **Session refresh:** `middleware.js` refreshes the Supabase session on each request, so users stay signed in.

Entry statuses: **Pending**, **Published**, and **Returned for changes**.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| UI | React 19, plain JavaScript (no TypeScript) |
| Styling | Inline style objects and one plain CSS file (`app/search.css`) |
| Database, auth, and storage | Supabase (Postgres, Auth, Storage) |
| Supabase libraries | `@supabase/supabase-js`, `@supabase/ssr` |
| Hosting | Vercel |

No UI component library or state library is used. Navbar avatars are image URLs from the DiceBear API, so no extra package is needed.

## Project Structure

```
Khmer_NewYear/
  app/
    page.js                      Home page: hero, search, paginated entry list
    layout.js                    Root layout with navbar, footer, and metadata
    search.css                   Shared styles (hover effects, responsive layout)
    contribute/page.js           Contribution form
    entries/[slug]/page.js       Entry detail page
    entries/[slug]/edit/page.js  Edit page (owner only)
    my-entries/page.js           The signed-in user's entries
    review/page.js               Review queue (reviewers only)
    login/page.js                Log in
    signup/page.js               Sign up
  components/                    One component per file: navbar, footer, cards, forms
  lib/
    statusLabels.js              Status names in English and Khmer
    supabase/client.js           Browser Supabase client
    supabase/server.js           Server Supabase clients
    supabase/proxy.js           Session refresh used by middleware
  middleware.js                  Runs the session refresh on each request
  supabase/migrations/           SQL migrations, to be run in filename order
  public/images/                 Local image files
  collection.config.js           Archive name, description, curator, and source
  JOURNAL.md                     Project journal
  AGENTS.md                      Working rules for AI coding assistants
  package.json                   Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 18.18 or newer (required by Next.js 15)
- npm (installed with Node.js)
- A Supabase project (the free tier is enough)
- Git

### Installation

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
cd YOUR-REPO-NAME
npm install
```

Create a file named `.env.local` in the project root (see [Environment Variables](#environment-variables)). Then start the development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Available Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the development server on port 3000 |
| `npm run build` | Builds the production app |
| `npm start` | Serves the production build (run `npm run build` first) |

## Environment Variables

The app reads two variables. Both start with `NEXT_PUBLIC_` because the browser needs them.

| Variable | Purpose | Where to find the value |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase dashboard, API settings |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key | Supabase dashboard, API settings |

Example `.env.local` (replace the placeholders with your own values):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

- `.env.local` is listed in `.gitignore`. Never commit it.
- Never paste real keys into this README, into code, or into a commit.
- On Vercel, add the same two variables under Environment Variables, then redeploy.
- If the variables are missing, the home page shows a configuration message instead of entries.

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the SQL Editor and run the migrations in `supabase/migrations/` in filename order (the timestamp at the start of each name sets the order). Run the first seven files first:
   1. `20260925091437_create_entries.sql`: creates the `entries` table.
   2. `20260925104311_add_place_to_entries.sql`: backfills `place`, removes duplicate slugs, and adds a unique constraint on `slug`.
   3. `20260926120000_allow_public_read_entries.sql`: enables Row Level Security (RLS) and allows public reads.
   4. `20261002000000_add_contribution_fields_and_photos_bucket.sql`: adds the `photo` column, creates the public `photos` bucket (5 MB, JPG/PNG/WebP only), and adds insert and upload policies.
   5. `20261002120000_owner_update_delete_entries.sql`: adds owner-only update and delete policies.
   6. `20261003120000_entries_insert_must_be_pending.sql`: adds the status check and requires new entries to start as Pending.
   7. `20261004120000_add_description_km_to_entries.sql`: adds the optional `description_km` column.
3. Create the reviewer objects. The repository does not define them, but the last migration needs them. Create a `reviewers` table that lists the user IDs of reviewers, and an `is_reviewer()` function that returns `true` when the current user is in that table. The column layout is up to you. The last migration stops with an error if `is_reviewer()` is missing.
4. Run the last migration: `20261108120000_reviewer_queue.sql`. It adds the reviewer and contributor read and update policies and a trigger that guards entry updates.
5. Check that the Email provider is enabled under Authentication, then Providers. The sign-up page handles both settings. If email confirmation is on, users are asked to check their email. If it is off, users are signed in right away.
6. The `photos` storage bucket is created by migration 4. No other storage setup is needed.

Security depends on the RLS policies in the migrations, not on keeping the publishable key secret.

## Deployment

1. Push the repository to GitHub.
2. In Vercel, choose **Add New > Project** and import the repository.
3. Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Click **Deploy**. Redeploy whenever you change an environment variable.

The home page loads entries in the browser, so newly published entries appear without a rebuild.

## How the Review Workflow Works

1. A visitor creates an account and logs in.
2. The contributor submits an entry. It is saved as **Pending** and is visible only to the contributor and reviewers.
3. A reviewer opens the Review Queue and clicks **Publish** or **Return**.
   - **Published:** the entry appears in the public archive.
   - **Returned:** the entry stays hidden from the public, and the contributor sees the status "Returned for changes".
4. When the owner edits an entry, it goes back to **Pending**.
5. A reviewer cannot publish or return their own entry. Another reviewer must do it.

## Known Limitations

- The navbar avatar links to `/profile`, but no profile page exists yet.
- The project has no automated tests and no lint script.
- Reviewers are added by hand in the database. The app has no admin screen for this.
- The hero images, the page background image, and the navbar avatars load from external websites. If those links break, the images will not show.
- Photos linked by URL depend on the remote site staying online.

## Screenshots

Screenshots have not been added yet. Before final submission, add images of the home page, an entry page, the contribution form, and the review queue to a `docs/screenshots/` folder, then link them here.

## Contributors

| Name | Role |
| --- | --- |
| [Your name] | Creator, developer, and curator of the archive |

Built in ICT 340 (Vibe Coding, Fall 2026) at the American University of Phnom Penh.
