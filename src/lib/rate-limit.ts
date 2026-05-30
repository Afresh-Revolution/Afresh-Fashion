type Bucket = { count: number; resetAt: number };

const globalStore = globalThis as typeof globalThis & {
  __afreshRateLimit?: Map<string, Bucket>;
};

function store() {
  if (!globalStore.__afreshRateLimit) {
    globalStore.__afreshRateLimit = new Map();
  }
  return globalStore.__afreshRateLimit;
}

function prune(map: Map<string, Bucket>, now: number) {
  if (map.size < 8000) return;
  for (const [key, bucket] of map) {
    if (now >= bucket.resetAt) map.delete(key);
  }
}

export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const map = store();
  prune(map, now);

  const entry = map.get(key);
  if (!entry || now >= entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true };
  }

  if (entry.count >= config.limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return { allowed: true };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}
