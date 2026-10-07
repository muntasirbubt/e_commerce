ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'STAFF';

ALTER TABLE "Product"
ADD COLUMN "featuredOffer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "featuredUpcoming" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Product"
SET "featuredOffer" = true
WHERE EXISTS (
  SELECT 1 FROM "ProductVariant"
  WHERE "ProductVariant"."productId" = "Product"."id"
    AND "ProductVariant"."salePrice" IS NOT NULL
);

UPDATE "Product"
SET "featuredUpcoming" = true
WHERE "isUpcoming" = true;

CREATE INDEX "Product_isPublished_featuredOffer_idx"
ON "Product"("isPublished", "featuredOffer");

CREATE INDEX "Product_isPublished_isUpcoming_featuredUpcoming_idx"
ON "Product"("isPublished", "isUpcoming", "featuredUpcoming");
