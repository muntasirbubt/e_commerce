import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/admin";
const types: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif" };
export async function POST(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const form = await request.formData(); const file = form.get("file");
  if (!(file instanceof File) || !types[file.type] || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Choose a JPG, PNG, WebP, or AVIF image up to 5 MB." }, { status: 400 });
  if (process.env.STORAGE_DRIVER === "cloudinary") {
    const cloud = process.env.CLOUDINARY_CLOUD_NAME, key = process.env.CLOUDINARY_API_KEY, secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloud || !key || !secret) return NextResponse.json({ error: "Cloudinary credentials are not configured." }, { status: 503 });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHash("sha1").update(`timestamp=${timestamp}${secret}`).digest("hex");
    const payload = new FormData(); payload.set("file", file); payload.set("api_key", key); payload.set("timestamp", timestamp); payload.set("signature", signature);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`, { method: "POST", body: payload });
    const result = await response.json();
    if (!response.ok || typeof result.secure_url !== "string") return NextResponse.json({ error: "Cloudinary could not store this image." }, { status: 502 });
    return NextResponse.json({ url: result.secure_url }, { status: 201 });
  }
  const directory = path.join(process.cwd(), "public", "uploads"); await mkdir(directory, { recursive: true });
  const filename = `${randomUUID()}${types[file.type]}`; await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
}
