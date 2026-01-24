import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { COOKIES } from '$lib/types';
import { Auth } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies }) => {
    const sessionCookie = cookies.get(COOKIES.session);

    Auth.deleteSessions([sessionCookie]);

    cookies.set(COOKIES.session, '', {
        path: '/',
        httpOnly: true,
        secure: true,
        maxAge: 0,
    });

    return json(200, {});
};