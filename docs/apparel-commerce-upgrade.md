# Apparel commerce upgrade

## Schema and role model

- `Role`: `CUSTOMER`, `STAFF`, `ADMIN`. Signup remains customer-only; admins assign staff/admin roles.
- `Product`: apparel fit/material plus `featuredOffer` and `featuredUpcoming` curation flags.
- `ProductVariant`: normalized `size` and `color`, while retaining the existing JSON attributes for compatibility.
- `Order`: required customer phone; existing status/payment state fields remain the order lifecycle source of truth.
- Migration `20261008000000_staff_and_home_curation` adds the staff enum value and homepage curation flags. It carries existing discounted and upcoming items into the featured sections.

Staff can access the fulfillment workspace, inventory adjustment endpoint, and forward order status changes. They cannot access admin pages for revenue, catalog, marketing/settings, order overrides, or user management. The admin order endpoint returns only an order id/number/status for staff status updates.

## REST endpoint map

| Endpoint                      | Access         | Purpose                                                                                                  |
| ----------------------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| `POST /api/auth/register`     | Public         | Customer self-registration only                                                                          |
| `GET /api/admin/users`        | Admin          | List people and roles                                                                                    |
| `POST /api/admin/users`       | Admin          | Create a customer, staff, or admin account; hashes the password                                          |
| `PATCH /api/admin/users/:id`  | Admin          | Assign one of the three roles                                                                            |
| `POST /api/admin/inventory`   | Staff or admin | Atomic stock in/out adjustment with inventory audit log                                                  |
| `PATCH /api/admin/orders/:id` | Staff or admin | Staff may advance fulfillment only; admins can edit order lines/prices/address, cancel, or change status |
| `POST /api/admin/products`    | Admin          | Create apparel product and set featured homepage flags                                                   |
| `PUT /api/admin/products/:id` | Admin          | Edit apparel attributes and Offers/Coming Soon placement                                                 |
| `POST /api/checkout`          | Public         | Validated phone/address and configured checkout payment method                                           |
| `POST /api/notify`            | Public         | Subscribe to a featured upcoming product                                                                 |

The catalog and dashboards are server-rendered from Prisma with role-specific data projections; they do not expose financial data to the staff client. Existing coupon, settings, upload, and review routes retain their current access checks.

## Homepage layout

1. Campaign strip and apparel hero with one primary shop action.
2. Compact material, fit, and delivery benefits.
3. Offers grid showing only published products that an admin selected and that have a sale price.
4. Coming Soon cards showing only published upcoming products selected by an admin. Launch countdowns and Notify Me signup are supported.
5. One editorial campaign banner between merchandising sections, outside the navigation.
6. Filter rail and product grid with category, size, color swatches, fit, material, and price range.

Admins set Offers and Coming Soon placement from the product editor’s **Homepage placement** controls. Coming Soon additionally requires the product’s Upcoming state.

## Compact order row and staff workspace

```text
Order ID | Customer + phone | Total + COD badge | Date | ●──●──○──○ Status | Actions
                                                                          [Edit]
                                                                          [Mark delivered]
```

The All Orders view uses a dense row with a color-coded four-step status tracker. Quick actions stay in the row; expanding Edit reveals order items, quantity and unit price controls, delivery fields, discount, and shipping. Cancellation restores reserved inventory and records the movement. Delivery marks a COD order paid so the admin’s COD collected total updates from the paid-order aggregate.

Staff see a separate operational screen: today’s queue, forward-only status control, searchable stock, atomic stock adjustments, and recent inventory logs. No order totals, variant prices, sales totals, or payout figures are sent to that client.

## Account menu

The navbar’s logged-in account block opens a popover with **Profile** and **Logout**. Profile links to `/account`; Logout invalidates the NextAuth session and returns to the storefront.

## Implementation roadmap

1. **Database:** apply the new migration and regenerate Prisma Client.
2. **Access control:** create staff/admin accounts in People; verify staff are routed to operational tools and denied admin-only pages/endpoints.
3. **Merchandising:** edit products and select which published sale products and upcoming drops appear on the homepage.
4. **Operations:** use staff for inventory and fulfillment; use admins for financial review, overrides, cancellation, and account management.
5. **Checkout and release:** keep COD first/default, validate phone and address, then enable an online provider only after its payment adapter and webhook flow are configured.

Bundle-specific discount rules and editable ad-campaign content do not yet have dedicated database/admin management models. Sale prices, coupon codes, and the current editorial campaign banner are supported; a bundle/promotion manager can be added as a separate phase once offer rules are specified.
