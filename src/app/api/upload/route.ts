import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { rateLimitOrThrow } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    await rateLimitOrThrow({ req, name: "upload", limit: 20, windowSeconds: 60 });
  } catch {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const body = (await req.json()) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/*"],
        addRandomSuffix: false,
        maximumSizeInBytes: 15 * 1024 * 1024,
      }),
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 },
    );
  }
}
