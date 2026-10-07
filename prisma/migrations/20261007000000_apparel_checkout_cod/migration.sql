ALTER TABLE "Product"
ADD COLUMN "fitType" TEXT,
ADD COLUMN "material" TEXT;

ALTER TABLE "ProductVariant"
ADD COLUMN "size" TEXT,
ADD COLUMN "color" TEXT;

UPDATE "ProductVariant"
SET
  "size" = NULLIF("attributesJson" ->> 'Size', ''),
  "color" = NULLIF("attributesJson" ->> 'Color', '');

UPDATE "Product" AS product
SET
  "fitType" = NULLIF(variant."attributesJson" ->> 'Fit Type', ''),
  "material" = NULLIF(variant."attributesJson" ->> 'Material', '')
FROM "ProductVariant" AS variant
WHERE variant."productId" = product."id"
  AND (
    variant."attributesJson" ? 'Fit Type'
    OR variant."attributesJson" ? 'Material'
  );

ALTER TABLE "Order"
ADD COLUMN "customerPhone" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Order"
ALTER COLUMN "customerPhone" DROP DEFAULT;

CREATE INDEX "Product_fitType_idx" ON "Product"("fitType");
CREATE INDEX "Product_material_idx" ON "Product"("material");
CREATE INDEX "ProductVariant_size_idx" ON "ProductVariant"("size");
CREATE INDEX "ProductVariant_color_idx" ON "ProductVariant"("color");
