import { kv } from "@vercel/kv";

function ipFromRequest(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function rateLimitOrThrow(opts: {
  req: Request;
  name: string;
  limit: number;
  windowSeconds: number;
}): Promise<void> {
  const ip = ipFromRequest(opts.req);
  const key = `rl:${opts.name}:${ip}`;

  const count = await kv.incr(key);
  if (count === 1) {
    await kv.expire(key, opts.windowSeconds);
  }
  if (count > opts.limit) {
    throw new Error("Rate limited");
  }
}

