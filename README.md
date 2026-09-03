# Hunny Cosmetics — Inventory & Billing

A web app for running an offline cosmetics shop: track inventory, sell products
at the counter, print a bill, and have stock update automatically. Built as a
Firebase-backed React app so it works with your shop's own Firebase project
(`hunny-cosmetics`), including offline support (Firestore caches data locally
and syncs when you're back online).

## Features

- **Inventory** — add products (name, brand, SKU/barcode, cost & selling
  price, quantity, unit, low-stock threshold, expiry date, supplier),
  restock ("Stock In"), and manual stock corrections — every change is
  logged to an audit trail (`stockMovements`).
- **Billing (POS)** — search/tap products into a cart, apply a discount,
  pick a payment method, checkout. Stock is decremented and the sale is
  recorded atomically — a bill can never be created without stock being
  deducted, or vice versa.
- **Receipts** — print immediately after checkout (or reprint from Sales
  History) in normal A5 or 80mm thermal format.
- **Sales History** — every invoice, searchable; admins can refund/void a
  sale (restores stock automatically).
- **Dashboard & Reports** — today's sales, low-stock & expiring-soon alerts,
  top-selling products, estimated profit, current stock value.
- **Roles** — Admin (full access) and Cashier (billing + read-only
  inventory, no cost prices, no settings/reports).
- **Bilingual** — English / Urdu toggle (Urdu renders right-to-left with
  Noto Nastaliq Urdu).
- **Mobile-ready & installable** — responsive down to phone widths (card
  layouts replace tables on small screens), and installable as an app on
  Android, iOS, and desktop (see "Install as an app" below).

## Tech stack

React + Vite + Tailwind CSS, Firebase (Authentication, Firestore) for the
backend, deployed as a static site to GitHub Pages (via GitHub Actions) —
Firebase Hosting also works as an alternative. No backend server to run;
Firebase is the entire backend.

## One-time Firebase Console setup

The app is already wired to the `hunny-cosmetics` Firebase project
(`src/firebase.js`). Before first use, in the
[Firebase Console](https://console.firebase.google.com/project/hunny-cosmetics):

1. **Authentication** → Sign-in method → enable **Email/Password**.
2. **Firestore Database** → create a database (production mode is fine —
   this repo's `firestore.rules` handles access control).
3. Deploy the security rules (from this repo, once you have the Firebase CLI
   set up — see below):
   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules
   ```

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL. Since no admin account exists yet, the app shows
**"Create the owner account"** — fill it in once; that becomes your Admin
login. After that, log in normally. Admins can add Cashier accounts from
**Settings → Staff Accounts**.

## Deploy — GitHub Pages (live site)

The app is live at **https://umair34836-sys.github.io/Hunny-cosmetics-/**,
built and deployed automatically by
`.github/workflows/deploy-pages.yml` on every push to this branch (and to
`main`, once this is merged there).

**One-time setup (do this once, in the GitHub UI — it can't be done from a
commit):**

1. Repo → **Settings → Pages** → under "Build and deployment", set
   **Source** to **GitHub Actions**.
2. Push to this branch (or click **Run workflow** on the *Deploy to GitHub
   Pages* workflow under the **Actions** tab) to trigger the first deploy.
   The site URL above goes live a minute or two after the workflow finishes.
3. **Critical — Firebase Auth will otherwise reject logins from this
   domain:** in the
   [Firebase Console](https://console.firebase.google.com/project/hunny-cosmetics/authentication/settings)
   → Authentication → Settings → **Authorized domains**, click **Add
   domain** and add `umair34836-sys.github.io`. Without this step, login
   fails with an `auth/unauthorized-domain` error on the live site (it
   still works fine on `localhost` during local dev).

Two things follow from GitHub Pages being static file hosting (no
server-side routing):
- Routes are hash-based (`.../Hunny-cosmetics-/#/products` instead of
  `.../products`) so refreshing or bookmarking a page never 404s.
- `npm run build:pages` (what the workflow runs) builds with the
  `/Hunny-cosmetics-/` subpath baked into every asset URL. Don't use its
  `dist/` output for anything served from a domain root.

## Deploy — Firebase Hosting (alternative)

```bash
npm run build
npx firebase-tools deploy --only hosting,firestore:rules
```

This publishes the app to `https://hunny-cosmetics.web.app` (or your
project's configured hosting domain) and applies the security rules. Use
the plain `npm run build` here, not `build:pages` — Firebase Hosting serves
from the domain root, and `hunny-cosmetics.web.app`/`.firebaseapp.com` are
already in Firebase's authorized domains by default, so no extra Auth step
is needed for this path.

## Install as an app (Android / iPhone / desktop)

The site is a PWA (Progressive Web App) — no app-store listing needed, and
it updates itself automatically whenever the site is redeployed:

- **Android (Chrome)**: open the site → menu (⋮) → **Install app** (or
  **Add to Home screen**). It appears as a normal app icon and opens full-
  screen, no browser bar.
- **iPhone/iPad (Safari)**: open the site → Share button → **Add to Home
  Screen**. (Must be Safari — Chrome/Firefox on iOS can't install PWAs;
  that's an iOS platform restriction, not something this app controls.)
- **Desktop (Chrome/Edge)**: an install icon (⊕) appears in the address
  bar — click it, or menu → **Install Hunny Cosmetics**.

Once installed it keeps working with a patchy connection: Firestore's
persistent local cache (enabled in `src/firebase.js`) lets the app read
recent data and queue sales/stock changes offline, syncing automatically
once back online — genuinely useful for a shop with unreliable wifi/data,
not just a nicety.

## Data model (Firestore)

| Collection | Purpose |
|---|---|
| `users/{uid}` | name, email, role (`admin`/`cashier`), active |
| `products/{id}` | name, brand, sku, category, costPrice, sellingPrice, quantity, unit, lowStockThreshold, expiryDate, supplier |
| `stockMovements/{id}` | immutable audit trail: every stock-in, adjustment, sale, and return |
| `sales/{id}` | invoiceNo, items, totals, payment method, cashier, status (`completed`/`refunded`) |
| `counters/invoice` | sequential invoice numbering |
| `settings/shop` | shop name/address/phone, currency symbol, tax %, receipt footer, default receipt format |
| `meta/bootstrap` | marks that the first admin account has been created |

## Notes & things worth knowing

- It's not a fully offline-first / no-internet-ever app — the very first
  login on a device needs connectivity (see "Install as an app" above for
  how it behaves offline after that).
- `src/firebase.js` contains the Firebase project's public web config —
  that's normal and safe to ship in the client bundle (these are
  identifiers, not secrets); access is enforced entirely by
  `firestore.rules`.
- Currency defaults to `Rs` (PKR) and is editable from Settings.
