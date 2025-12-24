import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { COOKIES, ROUTES } from '$lib/types';
import { getSession } from '$lib/server/queries';

export const load: LayoutServerLoad = async ({ cookies }) => {
    const sessionCookie = cookies.get(COOKIES.session);
    console.log(sessionCookie);
    
    if (!sessionCookie) throw redirect(302, ROUTES.home);

    const dbSession = getSession(sessionCookie);
    console.log(dbSession);
    
    if (!dbSession) throw redirect(302, ROUTES.home);

    return { user: dbSession.user };
};