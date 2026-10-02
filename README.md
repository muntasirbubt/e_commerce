# Modular Market

A Next.js App Router storefront and admin inventory console using PostgreSQL, Prisma, and NextAuth credentials sessions.

## Local setup

Requirements: Node.js 20+, npm, and a local PostgreSQL database. No paid services are needed for local development.

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL`, `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` of at least 12 characters.
2. Install dependencies with `npm install`.
3. Generate Prisma Client and create the database tables with `npx prisma generate` and `npx prisma migrate dev`.
4. Create the administrator and a small sample catalog with `npm run db:seed`.
5. Start the app with `npm run dev`. Visit `/` for the shop and `/admin` for the console.

The seed command resets the seeded administrator password to the current `ADMIN_PASSWORD`; keep that value private and change it before production use. There is no public account registration route in this starter.

## Payment modes

Set `ENABLE_PAYMENT_GATEWAY=false` for COD, bank transfer, or order request. Checkout only offers providers selected in `ACTIVE_PAYMENT_PROVIDERS` or the admin Settings panel. Stripe Checkout is offered only when gateways are enabled and both Stripe keys are present. Set `STRIPE_WEBHOOK_SECRET` and configure Stripe to call `/api/checkout/stripe-webhook` for `checkout.session.completed` and `checkout.session.expired`; payment remains pending until the signed webhook confirms it. The integration supports Stripe Checkout. PayPal is listed as a schema/provider option but is intentionally withheld from checkout until its payment capture and webhook adapter is implemented.

The order is created and stock reserved transactionally before sending the shopper to Stripe. An expired Stripe session restores the stock and records an audit entry. Ensure the Stripe webhook is reachable in production so reservations are released after abandoned sessions.

## Production configuration

Deploy the Next.js app to a Node-compatible host and point `DATABASE_URL` at managed PostgreSQL. Use a long random `NEXTAUTH_SECRET`, set `NEXTAUTH_URL` to the production origin, and configure payment secrets only on the server. Settings saved by an administrator override environment defaults without a redeploy. `STORAGE_DRIVER=local` writes admin uploads to `/public/uploads`; use `STORAGE_DRIVER=cloudinary` with Cloudinary credentials for production hosted uploads.

## Included routes

- `GET /api/products`: published catalog with search, category, limit, and pagination parameters.
- `POST /api/cart`: fetch current details for browser cart variant IDs.
- `POST /api/checkout`: validate checkout, atomically reserve inventory, create order, and start Stripe Checkout if selected.
- `POST /api/checkout/stripe-webhook`: verify Stripe events and update payment/order state.
- `POST /api/admin/inventory`: admin-only atomic stock adjustment with inventory log.
- `POST /api/admin/products`, `PUT /api/admin/products/:id`: admin-only product creation and product detail/publishing edit.
- `PUT /api/admin/settings`: admin-only gateway, provider, shipping, threshold, currency, and store name settings.
- `POST /api/admin/upload`: admin-only local image upload (JPG/PNG/WebP/AVIF, 5 MB maximum).
- `PATCH /api/admin/orders/:id`: admin-only order status update; cancelling an unpaid order returns its stock and logs the adjustment.

Inventory decrements use a conditional `UPDATE` inside the same transaction as order creation, so concurrent checkouts cannot drive stock below zero. Admin inventory adjustment also rejects negative stock. Product variant prices and stock are variant-specific.
