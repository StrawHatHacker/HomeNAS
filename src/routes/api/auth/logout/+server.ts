import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { COOKIES, ROUTES } from '$lib/types';
import { Auth } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies }) => {
    const sessionCookie = cookies.get(COOKIES.session);
    Auth.deleteSessions([sessionCookie]);

    cookies.delete(COOKIES.session, { path: '/' });

    throw redirect(302, ROUTES.home);
};