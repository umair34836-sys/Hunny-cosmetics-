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

## Tech stack

React + Vite + Tailwind CSS, Firebase (Authentication, Firestore, Hosting).
No backend server to run — Firebase is the backend.

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

## Deploy (Firebase Hosting)

```bash
npm run build
npx firebase-tools deploy --only hosting,firestore:rules
```

This publishes the app to `https://hunny-cosmetics.web.app` (or your
project's configured hosting domain) and applies the security rules.

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

- Firestore's built-in offline persistence means the app keeps working (read
  and write) if the shop's internet drops — changes sync once you're back
  online. It is not a fully offline-first / no-internet-ever app; the very
  first login on a device needs connectivity.
- `src/firebase.js` contains the Firebase project's public web config —
  that's normal and safe to ship in the client bundle (these are
  identifiers, not secrets); access is enforced entirely by
  `firestore.rules`.
- Currency defaults to `Rs` (PKR) and is editable from Settings.
