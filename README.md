# Modular Market

A Next.js App Router storefront and admin inventory console using PostgreSQL, Prisma, and NextAuth credentials sessions.

## Local setup

Requirements: Node.js 20+, npm, and a local PostgreSQL database. No paid services are needed for local development.

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` of at least 12 characters. Prisma CLI reads `.env`; Next.js also loads it for the app.
2. Install dependencies with `npm install`.
3. Generate Prisma Client and create the database tables with `npx prisma generate` and `npx prisma migrate dev`.
4. Create the administrator and a small sample catalog with `npm run db:seed`.
5. Start the app with `npm run dev`. Visit `/` for the shop and `/admin` for the console.

The seed command resets the seeded administrator password to the current `ADMIN_PASSWORD`; keep that value private and change it before production use. Customers can register from the sign-in page; the first registered account is always a customer. Admins can grant admin access from the People page.

If you already set up the original database, apply later schema updates with `npx prisma migrate dev` after pulling the project changes, then restart the app with `npm run dev`. Run `npm run db:seed` only for the first setup or when you intentionally want to refresh the seeded administrator and sample catalog.

## Payment modes

Set `ENABLE_PAYMENT_GATEWAY=false` for COD, bank transfer, or order request. Checkout only offers providers selected in `ACTIVE_PAYMENT_PROVIDERS` or the admin Settings panel. Stripe Checkout is offered only when gateways are enabled and both Stripe keys are present. Set `STRIPE_WEBHOOK_SECRET` and configure Stripe to call `/api/checkout/stripe-webhook` for `checkout.session.completed` and `checkout.session.expired`; payment remains pending until the signed webhook confirms it. The integration supports Stripe Checkout. PayPal is listed as a schema/provider option but is intentionally withheld from checkout until its payment capture and webhook adapter is implemented.

The order is created and stock reserved transactionally before sending the shopper to Stripe. An expired Stripe session restores the stock and records an audit entry. Ensure the Stripe webhook is reachable in production so reservations are released after abandoned sessions.

## Production configuration

Deploy the Next.js app to a Node-compatible host and point `DATABASE_URL` at managed PostgreSQL. Use a long random `NEXTAUTH_SECRET`, set `NEXTAUTH_URL` to the production origin, and configure payment secrets only on the server. Settings saved by an administrator override environment defaults without a redeploy. `STORAGE_DRIVER=local` writes admin uploads to `/public/uploads`; use `STORAGE_DRIVER=cloudinary` with Cloudinary credentials for production hosted uploads.

## Included routes

- `/`: premium storefront with catalog search, category filters, offers, and upcoming launches.
- `/products/:slug`: product gallery, color and size selection, pricing, stock status, specifications, reviews, and related products.
- `/signin`, `/account`, `/account/orders`: customer registration/sign-in, profile, and order history.
- `/about`, `/contact`, `/faq`, `/policies/:slug`: brand and customer information pages.
- `/admin/catalog`, `/admin/marketing`, `/admin/users`: product editing and image uploads, coupon management, and user roles.
- `/admin`: dashboard with today’s orders and order search; `/admin/orders`: searchable full order history with optional date grouping and pagination. `STORE_TIMEZONE` sets the store’s day boundary (defaults to `Asia/Dhaka`).

- `GET /api/products`: published catalog with search, category, limit, and pagination parameters.
- `POST /api/cart`: fetch current details for browser cart variant IDs.
- `POST /api/checkout`: validate checkout, atomically reserve inventory, create order, and start Stripe Checkout if selected.
- `POST /api/checkout/stripe-webhook`: verify Stripe events and update payment/order state.
- `POST /api/admin/inventory`: admin-only atomic stock adjustment with inventory log.
- `POST /api/admin/products`, `PUT /api/admin/products/:id`: admin-only product creation and product detail/publishing edit.
- `PUT /api/admin/settings`: admin-only gateway, provider, shipping, threshold, currency, store name, and support details.
- `POST /api/admin/upload`: admin-only local image upload (JPG/PNG/WebP, 2 MB maximum).
- `POST /api/auth/register`, `POST /api/reviews`, `POST /api/notify`, and `POST /api/contact`: customer registration, product reviews, launch notifications, and contact messages.
- `PATCH /api/admin/orders/:id`: admin-only order status update; cancelling an unpaid order returns its stock and logs the adjustment.

Inventory decrements use a conditional `UPDATE` inside the same transaction as order creation, so concurrent checkouts cannot drive stock below zero. Admin inventory adjustment also rejects negative stock. Product variant prices and stock are variant-specific.
