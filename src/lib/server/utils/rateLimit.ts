type RateLimitEntry = {
    count: number;
    resetAt: number;
};

const RATE_LIMIT = 20;        // requests
const RATE_LIMIT_STRICT = 2;  // requests
const WINDOW_MS = 60_000;     // per minute

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
