import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) before seeding.");
  await prisma.user.upsert({ where: { email: email.toLowerCase() }, update: { role: "ADMIN", passwordHash: await hash(password, 12) }, create: { email: email.toLowerCase(), name: "Store Admin", passwordHash: await hash(password, 12), role: "ADMIN" } });
  await prisma.storeSettings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
  const category = await prisma.category.upsert({ where: { slug: "everyday" }, update: { name: "Everyday" }, create: { slug: "everyday", name: "Everyday" } });
  const product = await prisma.product.upsert({ where: { slug: "daily-carry-tote" }, update: {}, create: { title: "Daily Carry Tote", slug: "daily-carry-tote", description: "A sturdy, uncomplicated tote for the things you take everywhere.", isPublished: true, categoryId: category.id, variants: { create: [{ sku: "TOTE-NATURAL", price: 24, stockQuantity: 18, attributesJson: { Color: "Natural" } }, { sku: "TOTE-FOREST", price: 24, stockQuantity: 3, attributesJson: { Color: "Forest" } }] } } });
  console.log(`Admin account ready: ${email}. Sample product: ${product.title}`);
}
main().finally(() => prisma.$disconnect());
