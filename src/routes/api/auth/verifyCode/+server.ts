import { errorMap } from "$lib/server/errorMap";
import { isRateLimited } from "$lib/server/utils/rateLimit";
import { COOKIES, type DataOrErr } from "$lib/types";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import * as Queries from "$lib/server/queries";
import { Auth } from "$lib/server/auth";
import { PUBLIC_ENV } from "$env/static/public";

export const POST: RequestHandler = async ({ request, getClientAddress, cookies }) => {
    Auth.checkRatelimit(request, getClientAddress, true);

    const body = await request.json();
    const validatedBody = validateBody(body);
    if (!validatedBody.ok) return error(400, validatedBody.error);

    const user = Queries.getUserByEmail(validatedBody.data.email);
    if (!user) return error(404, errorMap.invalidEmail);
    console.info(`User ${user.name} (${user.email}) is trying to verify code.`);

    const validCode = Queries.getValidCode(validatedBody.data.code, user.id);
    if (!validCode) return error(404, errorMap.invalidCode);

    // Cleanup previous attempts
    Queries.deleteCodesByUserId(user.id);

    if (validatedBody.data.deletePreviousSessions) {
        Queries.deleteAllSessionsByUserId(user.id);
    }

    const sessionToken = await Auth.createSessionToken(user.id);
    Queries.createSession(user.id, sessionToken);
    console.info(`User ${user.name} (${user.email}) logged in.`);

    cookies.set(COOKIES.session, sessionToken, {
        path: '/',
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24,
    });

    return json({});
}

const validateBody = (body: any): DataOrErr<{ code: string, email: string, deletePreviousSessions: boolean }, string> => {
    if (!body || typeof body !== 'object') return { ok: false, error: errorMap.goAway };
    if (!('code' in body) || typeof body.code !== 'string') return { ok: false, error: errorMap.invalidCode };
    if (!('email' in body) || typeof body.email !== 'string') return { ok: false, error: errorMap.invalidEmail };
    if (!('deletePreviousSessions' in body) || typeof body.deletePreviousSessions !== 'boolean') return { ok: false, error: errorMap.goAway };

    return { ok: true, data: body };
}