import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isRateLimited } from '$lib/server/utils/rateLimit';
import { errorMap } from '$lib/server/errorMap';
import * as Queries from '$lib/server/queries';
import type { DataOrErr } from '$lib/types';
import { sendOneTimePassEmail } from '$lib/server/providers/emailer';
import { Auth } from '$lib/server/auth';
import { PUBLIC_ENV } from '$env/static/public';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
    Auth.checkRatelimit(request, getClientAddress, true);
    
    const body = await request.json();
    const validatedBody = validateBody(body);
    if (!validatedBody.ok) return error(400, validatedBody.error);

    const user = Queries.getUserByEmail(validatedBody.data.email);
    if (!user) return error(404, errorMap.invalidEmail);
    console.info(`User ${user.name} (${user.email}) is trying to login.`);

    const randomCode = Auth.random();

    // Cleanup previous attempts
    Queries.deleteCodesByUserId(user.id);

    // Create a new temporary auth code row to check against in the next step of the flow
    Queries.createAuthCode(user.id, randomCode);
    PUBLIC_ENV !== 'DEV' && await sendOneTimePassEmail(validatedBody.data.email, randomCode);

    return json(200, {});
};

const validateBody = (body: any): DataOrErr<{ email: string }, string> => {
    if (!body || typeof body !== 'object') return { ok: false, error: errorMap.goAway };
    if (!('email' in body) || typeof body.email !== 'string') return { ok: false, error: errorMap.invalidEmail };

    return { ok: true, data: body };
}