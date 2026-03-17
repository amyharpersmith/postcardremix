import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { rateLimitOrThrow } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    await rateLimitOrThrow({ req, name: "upload", limit: 20, windowSeconds: 60 });
  } catch {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are supported" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
    const path = `uploads/${nanoid(10)}.${ext}`;

    const blob = await put(path, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });

    return NextResponse.json({ url: blob.url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 },
    );
  }
}

