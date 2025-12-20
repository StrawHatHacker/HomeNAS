import { errorMap } from "$lib/server/errorMap";
import { getClientIp } from "$lib/server/utils/getClientIP";
import { isRateLimited } from "$lib/server/utils/rateLimit";
import type { DataOrErr } from "$lib/types";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import * as Queries from "$lib/server/queries";
import { Auth } from "$lib/server/auth";
import { PUBLIC_ENV } from "$env/static/public";

export const POST: RequestHandler = async ({ request, getClientAddress, cookies }) => {
    const ip = getClientIp(request, getClientAddress);
    const body = await request.json();

    console.info(`Someone sent code from ${ip} with email: ${body['email']} & code: ${body['code']}`);

    if (PUBLIC_ENV !== 'DEV') {
        const isLimited = isRateLimited(ip, { strict: true });
        if (isLimited) return error(429, errorMap.tooManyRequests);
    }

    const validatedBody = validateBody(body);
    if (!validatedBody.ok) return error(400, validatedBody.error);

    const user = Queries.getUserByEmail(validatedBody.data.email);
    if (!user) return error(404, errorMap.invalidEmail);
    console.info(`User ${user.name} (${user.email}) is trying to verify code.`);

    const validCode = Queries.getValidCode(validatedBody.data.code, user.id);
    if (!validCode) return error(404, errorMap.invalidCode);

    Queries.deleteCodesByUserId(user.id);

    const sessionToken = await Auth.createSessionToken(user.id);
    console.info(`User ${user.name} (${user.email}) logged in.`);

    cookies.set('sessionToken', sessionToken, {
        path: '/',
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24,
    });

    return json({});
}

const validateBody = (body: any): DataOrErr<{ code: string, email: string }, string> => {
    if (!body || typeof body !== 'object') return { ok: false, error: errorMap.goAway };
    if (!body.code || typeof body.code !== 'string') return { ok: false, error: errorMap.invalidCode };
    if (!body.email || typeof body.email !== 'string') return { ok: false, error: errorMap.invalidEmail };

    return { ok: true, data: body };
}