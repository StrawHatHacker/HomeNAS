type RateLimitEntry = {
    count: number;
    resetAt: number;
};

const RATE_LIMIT = 50;        // requests
const RATE_LIMIT_STRICT = 3;  // requests
const WINDOW_MS = 30_000;     // 30 seconds

const rateLimitMap = new Map<string, RateLimitEntry>();

export const isRateLimited = (ip: string, { strict = false }) => {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || entry.resetAt < now) {
        rateLimitMap.set(ip, {
            count: 1,
            resetAt: now + WINDOW_MS
        });
        return false;
    }

    entry.count++;

    if (entry.count > (strict ? RATE_LIMIT_STRICT : RATE_LIMIT)) {
        return true;
    }

    return false;
}
