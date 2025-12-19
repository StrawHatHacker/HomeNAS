import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isRateLimited } from '$lib/server/utils/rateLimit';
import { errorMap } from '$lib/server/errorMap';
import { getClientIp } from '$lib/server/utils/getClientIP';
import * as Queries from '$lib/server/queries';
import type { DataOrErr } from '$lib/types';
import { sendOneTimePassEmail } from '$lib/server/providers/emailer';
import { Auth } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
    const ip = getClientIp(request, getClientAddress);
    const body = await request.json();
    
    console.info(`Someone tried to login from ${ip} with email: ${body['email']}`);
    
    const isLimited = isRateLimited(ip, { strict: true });
    if (isLimited) return error(429, errorMap.tooManyRequests);

    const validatedBody = validateBody(body);
    if (!validatedBody.ok) return error(400, validatedBody.error);

    const user = Queries.getUserByEmail(validatedBody.data.email);
    if (!user) return error(404, errorMap.invalidEmail);
    console.info(`User ${user.name} (${user.email}) is trying to login.`);

    const randomCode = Auth.random();

    Queries.createAuthCode(user.id, randomCode);
    await sendOneTimePassEmail(validatedBody.data.email, randomCode);

    return json(200, {});
};

const validateBody = (body: any): DataOrErr<{ email: string }, string> => {
    if (!body || typeof body !== 'object') return { ok: false, error: errorMap.goAway };

    if (!body.email || typeof body.email !== 'string') return { ok: false, error: errorMap.invalidEmail };

    return { ok: true, data: body };
}